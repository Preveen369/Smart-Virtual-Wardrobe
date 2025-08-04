from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from utils.base64_helpers import array_buffer_to_base64
from dotenv import load_dotenv
import os
import cloudinary.uploader
from google import genai
from google.genai import types
import traceback
import base64
from routers.auth import verify_token
from cloudinary_config import get_tryon_image_folder
from models.schemas import (
    TryOnSessionCreate, TryOnSessionResponse, SuccessResponse
)
from models.database_ops import (
    create_tryon_session, get_tryon_session_by_id, get_user_tryon_sessions,
    update_tryon_session_result, delete_tryon_session
)

load_dotenv()

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY in .env")

client = genai.Client(api_key=GEMINI_API_KEY)

@router.post("/try-on")
async def try_on(
    person_image: UploadFile = File(...),
    cloth_image: UploadFile = File(...),
    instructions: str = Form("None"),
    model_type: str = Form(""),
    gender: str = Form(""),
    garment_type: str = Form(""),
    style: str = Form(""),
    email: str = Depends(verify_token),
):
    """Perform virtual try-on with image generation and store results in Cloudinary"""
    try:
        MAX_IMAGE_SIZE_MB = 10
        ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}

        if person_image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported file type for person_image: {person_image.content_type}")

        user_bytes = await person_image.read()
        if len(user_bytes) / (1024 * 1024) > MAX_IMAGE_SIZE_MB:
            raise HTTPException(status_code=400, detail="Image exceeds 10MB size limit for person_image")

        if cloth_image.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported file type for cloth_image: {cloth_image.content_type}")

        cloth_bytes = await cloth_image.read()
        if len(cloth_bytes) / (1024 * 1024) > MAX_IMAGE_SIZE_MB:
            raise HTTPException(status_code=400, detail="Image exceeds 10MB size limit for cloth_image")

        user_b64 = array_buffer_to_base64(user_bytes)
        cloth_b64 = array_buffer_to_base64(cloth_bytes)

        # Upload person and cloth images to Cloudinary
        folder = get_tryon_image_folder()
        person_upload_result = cloudinary.uploader.upload(
            user_bytes,
            folder=f"{folder}/person_images",
            public_id=f"{email}_person_{person_image.filename.split('.')[0]}",
            overwrite=False,
            resource_type="image"
        )
        
        cloth_upload_result = cloudinary.uploader.upload(
            cloth_bytes,
            folder=f"{folder}/cloth_images",
            public_id=f"{email}_cloth_{cloth_image.filename.split('.')[0]}",
            overwrite=False,
            resource_type="image"
        )

        garment_description_map = {
            "saree": "Ensure realistic draping from shoulder to foot, and match folds with body pose. Do not crop or misalign the pallu.",
            "churidar": "Fit the garment along the legs with tight ankle fitting and tunic on top. Avoid overlapping distortions.",
            "skirt": "Ensure waist-level fitting with correct flare, length, and folds aligned to posture.",
            "coat": "Layer the coat over existing clothing or upper body with realistic overlap and sleeve alignment.",
            "shirt": "Fit naturally on torso with collar, sleeve and hem properly aligned.",
            "tshirt": "Match torso tightly and preserve shoulder seams.",
            "pants": "Follow leg contours and match ankle length.",
            "dress": "Render from shoulders to knees/ankle with natural fall.",
            "jacket": "Overlay the torso with zip/button alignment preserved.",
        }

        garment_notes = garment_description_map.get(garment_type.lower(), "Apply the garment realistically over the model image.")

        prompt = f"""
{{
  "objective": "Generate a realistic virtual try-on image where the clothing from 'garment_image' is transferred onto the person in 'person_image', preserving the face, pose, and background of the original image perfectly.",
  "task": "Virtual Try-On with Identity and Background Preservation",
  "inputs": {{
    "person_image": {{
      "description": "Image of a real person. The output must retain the full face, expression, and original background exactly as in this image. Do not replace, reconstruct, or modify the face or background.",
      "id": "input_1"
    }},
    "garment_image": {{
      "description": "Image of the garment (flat lay, mannequin, or modeled). Extract only the garment texture, color, and style. Discard original garment image background or mannequin.",
      "id": "input_2"
    }}
  }},
  "processing_steps": [
    "Segment and extract garment from garment_image (input_2) with high fidelity.",
    "Analyze the person_image (input_1) to detect pose, body region, and position to fit the garment.",
    "Retain and protect all facial features, hair, and background elements from the original person_image.",
    "Overlay the extracted garment onto the person, ensuring natural drape, folds, and lighting consistency with the person_image.",
    "Do not alter the background or generate a new one.",
    "{garment_notes}"
  ],
  "output_requirements": {{
    "description": "Generate a realistic image of the person from person_image wearing the garment from garment_image. The face and background must be unchanged.",
    "format": "PNG or JPG",
    "quality": "High-resolution and photorealistic"
  }},
  "core_constraints": {{
    "identity_lock": {{
      "priority": "ABSOLUTE",
      "instruction": "Face and head must be left exactly as in the original image (input1). No generation, replacement, or modification is allowed."
    }},
    "garment_fidelity": {{
      "priority": "CRITICAL",
      "instruction": "Maintain the exact visual properties (color, pattern, texture, style) of the garment."
    }},
    "background_preservation": {{
      "priority": "CRITICAL",
      "instruction": "Keep the exact background from the person_image. No generation or changes allowed."
    }},
    "pose_alignment": {{
      "priority": "HIGH",
      "instruction": "Ensure the garment adapts to the existing pose and body shape from the person_image."
    }},
    "lighting_match": {{
      "priority": "HIGH",
      "instruction": "Match lighting and shadows of the garment to the person_image so it looks naturally worn."
    }}
  }},
  "prohibitions": [
    "Do not change or regenerate the face or background.",
    "Do not modify garment design or color.",
    "Do not hallucinate body pose or garment geometry.",
    "Do not change the person's pose."
  ],
  "contextual_tags": {{
    "Model Type": "{model_type}",
    "Gender": "{gender}",
    "Garment Type": "{garment_type}",
    "Style": "{style}",
    "Special Instructions": "None"
  }},
  "output_caption": "Explain how the garment fits on the person, note realism and drape quality, and mention any visible misalignment."
}}
"""

        contents = [
            prompt,
            types.Part.from_bytes(data=user_b64, mime_type=person_image.content_type),
            types.Part.from_bytes(data=cloth_b64, mime_type=cloth_image.content_type),
        ]

        response = client.models.generate_content(
            model="gemini-2.0-flash-exp-image-generation",
            contents=contents,
            config=types.GenerateContentConfig(response_modalities=["TEXT", "IMAGE"])
        )

        image_data = None
        text_response = "No Description available."
        if response.candidates and len(response.candidates) > 0:
            parts = response.candidates[0].content.parts
            for part in parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    image_data = part.inline_data.data
                    image_mime_type = getattr(part.inline_data, "mime_type", "image/png")
                elif hasattr(part, "text") and part.text:
                    text_response = part.text

        image_url = None
        if image_data:
            # Upload result image to Cloudinary
            result_upload_result = cloudinary.uploader.upload(
                image_data,
                folder=f"{folder}/results",
                public_id=f"{email}_tryon_result_{person_image.filename.split('.')[0]}_{cloth_image.filename.split('.')[0]}",
                overwrite=False,
                resource_type="image"
            )
            image_url = result_upload_result["secure_url"]

        # Create a try-on session to track this operation
        session_data = TryOnSessionCreate(
            person_image_url=person_upload_result["secure_url"],
            cloth_image_url=cloth_upload_result["secure_url"],
            instructions=instructions,
            model_type=model_type,
            gender=gender,
            garment_type=garment_type,
            style=style
        )
        
        tryon_session = await create_tryon_session(email, session_data)
        
        # Update the session with the results
        if image_url:
            await update_tryon_session_result(
                tryon_session.id, email, image_url
            )

        return JSONResponse(content={
            "image": image_url, 
            "text": text_response,
            "session_id": tryon_session.id
        })

    except Exception as e:
        print(f"Error in /api/try-on endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.post("/try-on/sessions", response_model=TryOnSessionResponse)
async def create_tryon_session_endpoint(
    session: TryOnSessionCreate,
    email: str = Depends(verify_token)
):
    """Create a new try-on session"""
    try:
        tryon_session = await create_tryon_session(email, session)
        session_dict = tryon_session.model_dump(by_alias=True)
        session_dict["id"] = session_dict.pop("_id")
        return TryOnSessionResponse(**session_dict)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create try-on session: {str(e)}"
        )

@router.get("/try-on/sessions", response_model=List[TryOnSessionResponse])
async def get_tryon_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    email: str = Depends(verify_token)
):
    """Get all try-on sessions for the user"""
    try:
        sessions = await get_user_tryon_sessions(email, skip=skip, limit=limit)
        response_sessions = []
        for session in sessions:
            session_dict = session.model_dump(by_alias=True)
            session_dict["id"] = session_dict.pop("_id")
            response_sessions.append(TryOnSessionResponse(**session_dict))
        return response_sessions
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get try-on sessions: {str(e)}"
        )

@router.get("/try-on/sessions/{session_id}", response_model=TryOnSessionResponse)
async def get_tryon_session(
    session_id: str,
    email: str = Depends(verify_token)
):
    """Get a specific try-on session"""
    try:
        session = await get_tryon_session_by_id(session_id, email)
        if not session:
            raise HTTPException(status_code=404, detail="Try-on session not found")
        session_dict = session.model_dump(by_alias=True)
        session_dict["id"] = session_dict.pop("_id")
        return TryOnSessionResponse(**session_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get try-on session: {str(e)}"
        )

@router.put("/try-on/sessions/{session_id}/result", response_model=TryOnSessionResponse)
async def update_tryon_session_result_endpoint(
    session_id: str,
    result_image_url: str,
    email: str = Depends(verify_token)
):
    """Update try-on session with results"""
    try:
        updated_session = await update_tryon_session_result(
            session_id, email, result_image_url
        )
        if not updated_session:
            raise HTTPException(status_code=404, detail="Try-on session not found")
        session_dict = updated_session.model_dump(by_alias=True)
        session_dict["id"] = session_dict.pop("_id")
        return TryOnSessionResponse(**session_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update try-on session: {str(e)}"
        )

@router.delete("/try-on/sessions/{session_id}", response_model=SuccessResponse)
async def delete_tryon_session_endpoint(
    session_id: str,
    email: str = Depends(verify_token)
):
    """Delete a try-on session"""
    try:
        success = await delete_tryon_session(session_id, email)
        if not success:
            raise HTTPException(status_code=404, detail="Try-on session not found")
        return SuccessResponse(
            success=True,
            message="Try-on session deleted successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete try-on session: {str(e)}"
        )
