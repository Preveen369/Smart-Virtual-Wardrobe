from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from routers.auth import verify_token
from dotenv import load_dotenv
import os
import requests
import json
import re
from typing import Optional, List
import cloudinary.uploader
from cloudinary_config import get_outfit_advisor_folder
from models.schemas import OutfitAdvisorRequest, OutfitAdvisorResponse, OutfitAdvisorDBResponse
from models.database_ops import create_outfit_advice, get_user_outfit_advice, get_outfit_advice_by_id, delete_outfit_advice

load_dotenv()

router = APIRouter()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "gpt-4o-mini")
OPENROUTER_FALLBACK_MODEL = os.getenv("OPENROUTER_FALLBACK_MODEL", "gpt-4o-mini")

if not OPENROUTER_API_KEY:
    raise ValueError("Missing OPENROUTER_API_KEY in environment")


def _extract_text_from_choice(choice: dict) -> Optional[str]:
    # OpenRouter can return 'message.content' as an array of parts or as text
    msg = choice.get("message") or {}
    content = msg.get("content")
    if isinstance(content, list):
        # find first text-like part
        for part in content:
            if isinstance(part, dict):
                # possible keys: 'type' and 'text' or 'type':'output_text' with 'text'
                text = part.get("text") or part.get("content")
                if text:
                    return text
        # fallback: join text fields
        texts = [p.get("text") for p in content if isinstance(p, dict) and p.get("text")]
        if texts:
            return "\n".join(texts)
    elif isinstance(content, str):
        return content
    # try choices[].message?.get('content')[0].get('text') style
    if isinstance(choice.get("message"), dict):
        c = choice["message"].get("content")
        if isinstance(c, list) and len(c) and isinstance(c[0], dict):
            return c[0].get("text")
    return None


def _parse_json_from_text(text: str) -> Optional[dict]:
    if not text:
        return None
    # Try direct JSON first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Extract first JSON object using regex
    m = re.search(r"(\{[\s\S]*\})", text)
    if m:
        try:
            return json.loads(m.group(1))
        except Exception:
            return None
    return None


# --- apparel CSV helpers (cached, small concise summaries for prompt context) ---
_APPAREL_CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'utils', 'apparel_only.csv')
_APPAREL_DATA = None

def _load_apparel_data(limit: int = 20000):
    """Load and cache apparel_only.csv (best-effort). Returns list[dict]."""
    global _APPAREL_DATA
    if _APPAREL_DATA is not None:
        return _APPAREL_DATA
    path = os.path.abspath(_APPAREL_CSV_PATH)
    if not os.path.exists(path):
        _APPAREL_DATA = []
        return _APPAREL_DATA
    import csv
    rows = []
    try:
        with open(path, newline='', encoding='utf-8') as fh:
            reader = csv.DictReader(fh)
            for i, r in enumerate(reader):
                rows.append(r)
                if limit and i + 1 >= limit:
                    break
    except Exception as e:
        print(f"[outfit-advisor] failed to load apparel CSV: {e}")
        rows = []
    _APPAREL_DATA = rows
    return _APPAREL_DATA

def _build_apparel_context(payload: OutfitAdvisorRequest, max_examples: int = 7) -> Optional[str]:
    """Return a short, 1-line summary (colors/seasons/usages + examples) filtered by outfit_type/season if possible.
    The summary is deliberately brief so it can safely be appended to the model prompt. Returns up to `max_examples` product names (default 7).
    """
    rows = _load_apparel_data()
    if not rows:
        return None

    q = (payload.outfit_type or '').strip().lower() if payload.outfit_type else None
    matched = []
    if q:
        for r in rows:
            at = (r.get('articleType') or '').lower()
            sc = (r.get('subCategory') or '').lower()
            if q in at or q in sc:
                matched.append(r)

    # fallback by season
    if not matched and payload.outfit_season:
        season_q = (payload.outfit_season or '').strip().lower()
        for r in rows:
            if (r.get('season') or '').strip().lower() == season_q:
                matched.append(r)

    # If no good match, return a very short dataset summary
    if not matched:
        from collections import Counter
        colors = Counter((r.get('baseColour') or '').strip().title() for r in rows if r.get('baseColour'))
        types = Counter((r.get('articleType') or '').strip().title() for r in rows if r.get('articleType'))
        top_colors = ", ".join([c for c, _ in colors.most_common(3)])
        top_types = ", ".join([t for t, _ in types.most_common(3)])
        return f"Dataset summary — {len(rows)} items; common colors: {top_colors}; common types: {top_types}."

    # summarize matched items
    from collections import Counter
    colors = Counter((r.get('baseColour') or '').strip().title() for r in matched if r.get('baseColour'))
    seasons = Counter((r.get('season') or '').strip().title() for r in matched if r.get('season'))
    usages = Counter((r.get('usage') or '').strip().title() for r in matched if r.get('usage'))
    sample_names = [r.get('productDisplayName') for r in matched[:max_examples] if r.get('productDisplayName')]

    parts = []
    if colors:
        parts.append("colors: " + ", ".join([c for c, _ in colors.most_common(4)]))
    if seasons:
        parts.append("seasons: " + ", ".join([s for s, _ in seasons.most_common(3)]))
    if usages:
        parts.append("usage: " + ", ".join([u for u, _ in usages.most_common(3)]))
    if sample_names:
        parts.append("examples: " + "; ".join(sample_names))

    summary = "; ".join(parts)
    return f"Items similar to '{payload.outfit_type or 'N/A'}' — {summary}" if summary else None


@router.post("/outfit-advisor/analyze")
async def analyze_outfit(payload: OutfitAdvisorRequest, email: str = Depends(verify_token)):
    """Call external LLM (via OpenRouter) to evaluate the outfit and return structured JSON.

    - Uses only a `user` role message (no developer/system instructions) to avoid provider errors.
    - If provider returns an error referencing `Developer instruction`, falls back by inlining the image URL into the prompt and retrying.
    - Parses model text and attempts to extract valid JSON. If parsing fails we do NOT expose raw model output to the client; the endpoint will return only the structured fields (missing values become null).
    """
    try:
        # Build a clear instruction for the model (user message only)
        prompt_lines = [
            "You are an AI fashion stylist. Evaluate the outfit described below and return ONLY a single valid JSON object (no explanation, no extra keys) with these keys:\n",
            '  - suitability_score: integer between 0 and 100\n',
            "  - recommendation: either 'recommended' or 'not recommended'\n",
            "  - explanation: detailed explanation (3-6 sentences) that includes relevant context — mention color/print, fit, likely occasion(s), season/weather suitability, and at least one concrete suggestion or layering idea\n",
            "  - improvement_suggestions: short suggestions (comma-separated or array)\n",
            "  - better_outfit_idea: one concise alternative outfit idea\n\n",
            "Provide only valid JSON.\n\n",
            "OUTFIT DETAILS:\n",
        ]

        # include provided description + explicit fields
        if payload.description:
            prompt_lines.append(f"Description: {payload.description}\n")
        if payload.outfit_name:
            prompt_lines.append(f"Name: {payload.outfit_name}\n")
        if payload.outfit_type:
            prompt_lines.append(f"Type: {payload.outfit_type}\n")
        if payload.outfit_size:
            prompt_lines.append(f"Size: {payload.outfit_size}\n")
        if payload.outfit_season:
            prompt_lines.append(f"Season: {payload.outfit_season}\n")
        if payload.outfit_style:
            prompt_lines.append(f"Style: {payload.outfit_style}\n")

        # Attach apparel dataset context (concise) to help the model use domain data
        try:
            apparel_ctx = _build_apparel_context(payload)
            if apparel_ctx:
                # insert apparel reference just before the OUTFIT DETAILS section
                for i, line in enumerate(prompt_lines):
                    if line.strip() == "OUTFIT DETAILS:":
                        prompt_lines.insert(i, f"REFERENCE DATA: {apparel_ctx}\n\n")
                        break
        except Exception as _e:
            print(f"[outfit-advisor] apparel context error: {_e}")

        prompt = "".join(prompt_lines)

        # Construct messages for OpenRouter
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt}
                ]
            }
        ]

        # If image_url included, send image_url as a separate content part (OpenRouter supports this)
        if payload.image_url:
            messages[0]["content"].append({"type": "image_url", "image_url": {"url": payload.image_url}})

        body = {
            "model": OPENROUTER_MODEL,
            "messages": messages,
            "max_tokens": 512,
            "temperature": 0.2,
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

        # Helper to call OpenRouter and return Response
        def call_provider(model_name, request_body):
            try:
                print(f"[outfit-advisor] calling provider model={model_name}")
                return requests.post(f"{OPENROUTER_BASE}/chat/completions", headers=headers, json=request_body, timeout=30)
            except Exception as ex:
                print(f"[outfit-advisor] provider call exception: {ex}")
                raise

        # Primary request (try configured model first)
        body["model"] = OPENROUTER_MODEL
        resp = call_provider(OPENROUTER_MODEL, body)

        # If provider complains about developer instruction (some GEMMA variants) or rejects image parts,
        # retry by inlining the image URL (text-only content) and — if still failing — try a fallback model.
        def _is_dev_instruction_error(text):
            if not text:
                return False
            return any(sub in text.lower() for sub in ["developer instruction", "is not enabled", "developer instructions are not enabled"])

        if resp.status_code >= 400:
            # check for developer-instruction-like error
            try:
                err = resp.json()
                err_msg = json.dumps(err)
            except Exception:
                err_msg = resp.text
            print(f"[outfit-advisor] provider returned error: {err_msg}")

            # retry 1: inline image URL in the text (avoid image_url content part)
            retry_prompt = prompt + (f"\nImage URL: {payload.image_url}" if payload.image_url else "")
            retry_body = {"model": OPENROUTER_MODEL, "messages": [{"role": "user", "content": [{"type": "text", "text": retry_prompt}]}], "max_tokens": 512, "temperature": 0.2}
            try:
                resp = call_provider(OPENROUTER_MODEL, retry_body)
            except Exception:
                resp = None

        # If still failing and fallback model is different, try fallback
        if (not resp) or resp.status_code >= 400:
            if OPENROUTER_FALLBACK_MODEL and OPENROUTER_FALLBACK_MODEL != OPENROUTER_MODEL:
                print(f"[outfit-advisor] retrying with fallback model={OPENROUTER_FALLBACK_MODEL}")
                body["model"] = OPENROUTER_FALLBACK_MODEL
                try:
                    resp = call_provider(OPENROUTER_FALLBACK_MODEL, body)
                except Exception:
                    resp = None

        if (not resp) or resp.status_code != 200:
            try:
                details = resp.json() if resp else {"error": "no response from provider"}
            except Exception:
                details = resp.text if resp else "no response from provider"
            print(f"[outfit-advisor] final provider error: {details}")
            raise HTTPException(status_code=502, detail={"provider_error": details})

        data = resp.json()
        # Extract assistant text
        assistant_text = None
        choices = data.get("choices") or []
        if choices:
            assistant_text = _extract_text_from_choice(choices[0])

        parsed = _parse_json_from_text(assistant_text or "")

        result = {
            "suitability_score": None,
            "recommendation": None,
            "explanation": None,
            "improvement_suggestions": None,
            "better_outfit_idea": None,
        }

        if isinstance(parsed, dict):
            # Normalize keys (allow multiple key name variants)
            def getk(*keys):
                for k in keys:
                    if k in parsed:
                        return parsed[k]
                return None

            score = getk("suitability_score", "score")
            try:
                if score is not None:
                    result["suitability_score"] = int(score)
            except Exception:
                result["suitability_score"] = None

            result["recommendation"] = getk("recommendation", "recommended")
            result["explanation"] = getk("explanation", "reason", "explain")
            sugg = getk("improvement_suggestions", "suggestions", "improvement")
            if isinstance(sugg, list):
                result["improvement_suggestions"] = ", ".join(map(str, sugg))
            else:
                result["improvement_suggestions"] = sugg
            result["better_outfit_idea"] = getk("better_outfit_idea", "alternative", "better_idea")

        # Persist result to DB for the authenticated user (best-effort)
        try:
            request_data = payload.model_dump() if hasattr(payload, 'model_dump') else payload.__dict__
            record = await create_outfit_advice(email, request_data, result)
            if record and record.get('id'):
                result['id'] = record.get('id')
                print(f"[outfit-advisor] persisted result id={record.get('id')}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"[outfit-advisor] failed to persist result: {e}")
            # still return the result to the client
            pass

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        # Unexpected error
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/outfit-advisor", response_model=List[OutfitAdvisorDBResponse])
async def list_outfit_advice(skip: int = 0, limit: int = 50, email: str = Depends(verify_token)):
    """Return user's saved outfit advisor results (fail-safe: return empty list on error)."""
    try:
        items = await get_user_outfit_advice(email, skip=skip, limit=limit)
        # items are already converted for response in db layer; return directly so FastAPI
        # validates/serializes them via the response_model
        return items
    except Exception as e:
        # Log stack trace for debugging, but return an empty list so the frontend doesn't break with 500/CORS
        import traceback
        traceback.print_exc()
        return []



@router.get("/outfit-advisor/{record_id}", response_model=OutfitAdvisorDBResponse)
async def get_outfit_advice(record_id: str, email: str = Depends(verify_token)):
    try:
        doc = await get_outfit_advice_by_id(record_id, email)
        if not doc:
            raise HTTPException(status_code=404, detail="Not found")
        # Return dict (FastAPI will validate/serialize using response_model)
        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/outfit-advisor/{record_id}")
async def delete_outfit_advice_endpoint(record_id: str, email: str = Depends(verify_token)):
    try:
        ok = await delete_outfit_advice(record_id, email)
        if not ok:
            raise HTTPException(status_code=404, detail="Not found")
        return JSONResponse({"success": True, "message": "Deleted"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/outfit-advisor/upload')
async def upload_outfit_image(file: UploadFile = File(...), email: str = Depends(verify_token)):
    """Upload an outfit image to Cloudinary under the outfit_advisor_images folder and return secure URL"""
    try:
        content = await file.read()
        folder = get_outfit_advisor_folder()
        upload_result = cloudinary.uploader.upload(
            content,
            folder=folder,
            public_id=f"{email}_{file.filename.split('.')[0]}",
            overwrite=False,
            resource_type='image'
        )
        return JSONResponse({"image_url": upload_result.get('secure_url')})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
