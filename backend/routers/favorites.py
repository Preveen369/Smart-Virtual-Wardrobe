from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from routers.auth import verify_token
from models.schemas import FavoriteCreate, FavoriteResponse
from models.database_ops import (
    create_favorite, get_user_favorites, delete_favorite
)

router = APIRouter()

@router.get("/favorites", response_model=List[FavoriteResponse])
async def list_favorites(
    type: Optional[str] = Query(None),
    email: str = Depends(verify_token)
):
    """List favorites for the authenticated user.  Optional `type` filter"""
    try:
        favs = await get_user_favorites(email, fav_type=type)
        return favs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list favorites: {str(e)}")

@router.post("/favorites", response_model=FavoriteResponse)
async def create_favorite_endpoint(
    fav: FavoriteCreate,
    email: str = Depends(verify_token)
):
    """Create a new favorite entry"""
    try:
        record = await create_favorite(email, fav.type, fav.item)
        if not record:
            raise HTTPException(status_code=500, detail="Failed to create favorite")
        # convert for response model (id already string)
        return FavoriteResponse(**record)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create favorite: {str(e)}")

@router.delete("/favorites/{fav_id}")
async def delete_favorite_endpoint(
    fav_id: str,
    email: str = Depends(verify_token)
):
    """Delete a favorite by its id"""
    try:
        success = await delete_favorite(fav_id, email)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")
        return {"success": True, "message": "Favorite removed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete favorite: {str(e)}")
