from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from utils.base64_helpers import array_buffer_to_base64
from dotenv import load_dotenv
import os
import cloudinary.uploader
from gradio_client import Client, handle_file
from gradio_client.exceptions import AppError
import httpx
import tempfile
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

GRADIO_TRYON_URL = os.getenv("GRADIO_TRYON_URL", "https://ai-modelscope-kolors-virtual-try-on.ms.fun/")
# initialize a Gradio client with a generous timeout for uploads
client = Client(GRADIO_TRYON_URL, httpx_kwargs={"timeout": httpx.Timeout(100)})

@router.post("/try-on")
async def try_on(
    person_image: UploadFile = File(...),
    cloth_image: UploadFile = File(...),
    instructions: str = Form("None"),
    seed: int = Form(0),
    randomize_seed: bool = Form(False),
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

        # Call the Gradio try-on model using temporary files
        person_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(person_image.filename or "")[1] or ".jpg")
        cloth_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(cloth_image.filename or "")[1] or ".jpg")
        image_url = None
        text_response = None
        try:
            person_tmp.write(user_bytes)
            person_tmp.flush()
            cloth_tmp.write(cloth_bytes)
            cloth_tmp.flush()

            try:
                raw_result = client.predict(
                    person_img=handle_file(person_tmp.name),
                    garment_img=handle_file(cloth_tmp.name),
                    seed=seed,
                    randomize_seed=randomize_seed,
                    api_name="/tryon",
                )
            except AppError as ae:
                # propagate sensible error to frontend
                raise HTTPException(status_code=503, detail=f"External try-on service busy: {ae}")

            if isinstance(raw_result, tuple):
                result = {"output": raw_result[0], "_tuple": raw_result}
            else:
                result = raw_result

            def _maybe_upload_output(out_val):
                nonlocal image_url
                if not out_val:
                    return
                # raw bytes from model
                if isinstance(out_val, (bytes, bytearray)):
                    try:
                        upload = cloudinary.uploader.upload(
                            out_val,
                            folder=f"{folder}/results",
                            public_id=f"{email}_tryon_result_{person_image.filename.split('.')[0]}_{cloth_image.filename.split('.')[0]}",
                            overwrite=False,
                            resource_type="image"
                        )
                        image_url = upload.get("secure_url")
                        return
                    except Exception:
                        pass
                if isinstance(out_val, str) and os.path.exists(out_val):
                    with open(out_val, "rb") as f:
                        data = f.read()
                    upload = cloudinary.uploader.upload(
                        data,
                        folder=f"{folder}/results",
                        public_id=f"{email}_tryon_result_{person_image.filename.split('.')[0]}_{cloth_image.filename.split('.')[0]}",
                        overwrite=False,
                        resource_type="image"
                    )
                    image_url = upload.get("secure_url")
                elif isinstance(out_val, str) and out_val.startswith("http"):
                    image_url = out_val
                elif isinstance(out_val, str) and out_val.startswith("data:"):
                    try:
                        header, b64 = out_val.split(",", 1)
                        data = base64.b64decode(b64)
                        upload = cloudinary.uploader.upload(
                            data,
                            folder=f"{folder}/results",
                            public_id=f"{email}_tryon_result_{person_image.filename.split('.')[0]}_{cloth_image.filename.split('.')[0]}",
                            overwrite=False,
                            resource_type="image"
                        )
                        image_url = upload.get("secure_url")
                    except Exception:
                        pass

            # Handle various result shapes: dict, tuple/list, raw string path/url, or bytes
            if isinstance(result, dict):
                _maybe_upload_output(result.get("output") or result.get("image") or result.get("image_url"))
                text_response = result.get("text") or result.get("caption")
            elif isinstance(result, (list, tuple)):
                for item in result:
                    _maybe_upload_output(item)
            elif isinstance(result, (bytes, bytearray)):
                _maybe_upload_output(result)
            elif isinstance(result, str):
                _maybe_upload_output(result)

        finally:
            try:
                person_tmp.close()
            except Exception:
                pass
            try:
                cloth_tmp.close()
            except Exception:
                pass
            # remove temporary files
            try:
                os.unlink(person_tmp.name)
            except Exception:
                pass
            try:
                os.unlink(cloth_tmp.name)
            except Exception:
                pass

        # Create a try-on session to track this operation
        session_data = TryOnSessionCreate(
            person_image_url=person_upload_result["secure_url"],
            cloth_image_url=cloth_upload_result["secure_url"],
            instructions=instructions,
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
