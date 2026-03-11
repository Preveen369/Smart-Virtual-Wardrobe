from fastapi import APIRouter, Depends, HTTPException
from typing import List

from routers.auth import verify_token
from models.database_ops import get_user_style_feed
from models.schemas import StyleFeedResponse

router = APIRouter()

@router.get("/stylefeed", response_model=List[StyleFeedResponse])
async def list_style_feed(email: str = Depends(verify_token)):
    """Return all style-feed cards for the authenticated user."""
    try:
        entries = await get_user_style_feed(email)
        return entries
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list style feed: {str(e)}")
