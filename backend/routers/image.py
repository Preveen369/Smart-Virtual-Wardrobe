import os
import requests
from urllib.parse import quote

from fastapi import APIRouter, HTTPException

router = APIRouter()

POLLINATIONS_API_KEY = os.getenv("POLLINATIONS_API_KEY")

# Valid models accepted by Pollinations (kept in sync with upstream allowed values)
ALLOWED_MODELS = {
    "kontext", "seedream", "seedream-pro", "nanobanana", "nanobanana-pro",
    "gptimage", "gptimage-large", "veo", "seedance", "seedance-pro",
    "wan", "zimage", "flux", "klein", "klein-large", "imagen-4",
    "grok-video", "ltx-2"
}

@router.get('/image/{prompt}')
def generate_image(prompt: str, model: str = "seedream"):
    """Proxy endpoint for Pollinations image generation.

    - Validates `model` against a known list and forwards it to Pollinations as a
      query parameter (e.g. ?model=flux).
    - Returns JSON: { "image_url": <url>, "status": <http-status>, "model": <model> }
    """
    # Validate model early so callers get immediate, clear feedback
    if model not in ALLOWED_MODELS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "invalid_model",
                "message": f"Invalid model '{model}'. Valid models: {', '.join(sorted(ALLOWED_MODELS))}"
            }
        )

    try:
        encoded = quote(prompt, safe='')
        encoded_model = quote(model, safe='')
        # Forward model as query parameter (upstream expects `model`)
        url = f"https://gen.pollinations.ai/image/{encoded}?model={encoded_model}"

        headers = {}
        if POLLINATIONS_API_KEY:
            headers["Authorization"] = f"Bearer {POLLINATIONS_API_KEY}"

        resp = requests.get(url, headers=headers, timeout=30)

    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Upstream request failed: {str(exc)}")

    # Upstream success -> return canonical image URL + model used
    if resp.status_code == 200:
        return {"image_url": url, "status": resp.status_code, "model": model}

    # Forward upstream error body (already JSON/stringified) to the client
    raise HTTPException(status_code=resp.status_code, detail=resp.text or "Upstream error")
