from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from dotenv import load_dotenv
import os
import cloudinary.uploader
from inference_sdk import InferenceHTTPClient
from routers.auth import verify_token
from cloudinary_config import get_wardrobe_item_folder
from models.schemas import (
    WardrobeItemCreate, WardrobeItemUpdate, WardrobeItemResponse,
    SuccessResponse, ErrorResponse
)
from models.database_ops import (
    create_wardrobe_item, get_wardrobe_item_by_id, get_user_wardrobe_items,
    update_wardrobe_item, delete_wardrobe_item, search_wardrobe_items,
    get_user_statistics
)

load_dotenv()

router = APIRouter()

MODEL_ID = "clothing-classifier-w73mm-ehldp/1"
API_URL = "https://serverless.roboflow.com"
API_KEY = os.getenv("ROBOFLOW_API_KEY")
if not API_KEY:
    raise ValueError("Missing ROBOFLOW_API_KEY in .env")

def classify_and_save_image(image_path, model_id, api_url, api_key):
    client = InferenceHTTPClient(api_url=api_url, api_key=api_key)
    result = client.infer(image_path, model_id=model_id)
    predictions = result['predictions']
    filtered = [
        (factor, data['confidence'])
        for factor, data in predictions.items()
        if round(data['confidence'], 2) > 0.00
    ]
    top_two = sorted(filtered, key=lambda x: x[1], reverse=True)[:2]
    return top_two

@router.post("/wardrobe/classify")
async def classify_wardrobe_image(
    file: UploadFile = File(...),
    email: str = Depends(verify_token),
):
    """Classify uploaded wardrobe image and upload to Cloudinary"""
    try:
        # Read the file content
        file_content = await file.read()
        
        # Upload to Cloudinary
        folder = get_wardrobe_item_folder()
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            public_id=f"{email}_{file.filename.split('.')[0]}",
            overwrite=False,
            resource_type="image"
        )
        
        # Save temporarily for classification
        temp_file_path = f"/tmp/{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(file_content)
        
        results = classify_and_save_image(temp_file_path, MODEL_ID, API_URL, API_KEY)
        
        # Clean up temporary file
        os.remove(temp_file_path)
        
        # Convert confidence from 0-1 float to integer percent string
        import re
        formatted_results = []
        for c, v in results:
            percent = int(round(float(v) * 100))
            # Remove any trailing digits/percent from class name
            class_name = re.sub(r"[\s\d.%]+$", "", c)
            formatted_results.append({"class": class_name, "confidence": f"{percent}%"})
        
        return JSONResponse({
            "results": formatted_results,
            "image_url": upload_result["secure_url"]
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {str(e)}")

@router.post("/wardrobe/items", response_model=WardrobeItemResponse)
async def create_wardrobe_item_endpoint(
    item: WardrobeItemCreate,
    email: str = Depends(verify_token)
):
    """Create a new wardrobe item"""
    try:
        wardrobe_item = await create_wardrobe_item(email, item)
        # Convert for response model (id instead of _id)
        item_dict = wardrobe_item.model_dump(by_alias=True)
        item_dict["id"] = item_dict.pop("_id")
        return WardrobeItemResponse(**item_dict)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create wardrobe item: {str(e)}"
        )

@router.get("/wardrobe/items", response_model=List[WardrobeItemResponse])
async def get_wardrobe_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    email: str = Depends(verify_token)
):
    """Get all wardrobe items for the user"""
    try:
        items = await get_user_wardrobe_items(email, skip=skip, limit=limit)
        response_items = []
        for item in items:
            item_dict = item.model_dump(by_alias=True)
            item_dict["id"] = item_dict.pop("_id")
            response_items.append(WardrobeItemResponse(**item_dict))
        return response_items
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get wardrobe items: {str(e)}"
        )

@router.get("/wardrobe/items/{item_id}", response_model=WardrobeItemResponse)
async def get_wardrobe_item(
    item_id: str,
    email: str = Depends(verify_token)
):
    """Get a specific wardrobe item"""
    try:
        item = await get_wardrobe_item_by_id(item_id, email)
        if not item:
            raise HTTPException(status_code=404, detail="Wardrobe item not found")
        item_dict = item.model_dump(by_alias=True)
        item_dict["id"] = item_dict.pop("_id")
        return WardrobeItemResponse(**item_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get wardrobe item: {str(e)}"
        )

@router.put("/wardrobe/items/{item_id}", response_model=WardrobeItemResponse)
async def update_wardrobe_item_endpoint(
    item_id: str,
    item_update: WardrobeItemUpdate,
    email: str = Depends(verify_token)
):
    """Update a wardrobe item"""
    try:
        updated_item = await update_wardrobe_item(item_id, email, item_update)
        if not updated_item:
            raise HTTPException(status_code=404, detail="Wardrobe item not found")
        item_dict = updated_item.model_dump(by_alias=True)
        item_dict["id"] = item_dict.pop("_id")
        return WardrobeItemResponse(**item_dict)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update wardrobe item: {str(e)}"
        )

@router.delete("/wardrobe/items/{item_id}", response_model=SuccessResponse)
async def delete_wardrobe_item_endpoint(
    item_id: str,
    email: str = Depends(verify_token)
):
    """Delete a wardrobe item"""
    try:
        success = await delete_wardrobe_item(item_id, email)
        if not success:
            raise HTTPException(status_code=404, detail="Wardrobe item not found")
        return SuccessResponse(
            success=True,
            message="Wardrobe item deleted successfully"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete wardrobe item: {str(e)}"
        )

@router.get("/wardrobe/search", response_model=List[WardrobeItemResponse])
async def search_wardrobe_items_endpoint(
    garment_type: Optional[str] = Query(None),
    style: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    email: str = Depends(verify_token)
):
    """Search wardrobe items with filters"""
    try:
        items = await search_wardrobe_items(
            email=email,
            garment_type=garment_type,
            style=style,
            color=color,
            skip=skip,
            limit=limit
        )
        response_items = []
        for item in items:
            item_dict = item.model_dump(by_alias=True)
            item_dict["id"] = item_dict.pop("_id")
            response_items.append(WardrobeItemResponse(**item_dict))
        return response_items
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search wardrobe items: {str(e)}"
        )

@router.get("/wardrobe/statistics")
async def get_wardrobe_statistics(email: str = Depends(verify_token)):
    """Get user wardrobe statistics"""
    try:
        stats = await get_user_statistics(email)
        return stats
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )

