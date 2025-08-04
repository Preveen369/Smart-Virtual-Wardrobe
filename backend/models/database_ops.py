from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from database import get_database, get_sync_database
from models.schemas import (
    UserInDB, ProfileInDB, WardrobeItemInDB, TryOnSessionInDB,
    UserCreate, ProfileCreate, WardrobeItemCreate, TryOnSessionCreate,
    ProfileUpdate, WardrobeItemUpdate
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def convert_mongo_document(doc: Dict[str, Any], for_response: bool = False) -> Dict[str, Any]:
    """Convert MongoDB document to Pydantic-compatible format"""
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if "_id" in doc:
        if for_response:
            # For response models, convert _id to id
            doc["id"] = str(doc["_id"])
            del doc["_id"]
        else:
            # For database models with aliases, keep _id
            doc["_id"] = str(doc["_id"])
    
    # Convert any other ObjectId fields to strings
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
    
    return doc

# User Operations
async def create_user(user: UserCreate) -> UserInDB:
    """Create a new user in the database"""
    db = get_database()
    hashed_password = pwd_context.hash(user.password)
    
    user_data = UserInDB(
        email=user.email,
        hashed_password=hashed_password
    )
    
    result = await db.users.insert_one(user_data.dict())
    user_data.id = str(result.inserted_id)
    return user_data

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email"""
    db = get_database()
    user_data = await db.users.find_one({"email": email})
    if user_data:
        user_data = convert_mongo_document(user_data)
        return UserInDB(**user_data)
    return None

async def verify_user_password(email: str, password: str) -> bool:
    """Verify user password"""
    user = await get_user_by_email(email)
    if not user:
        return False
    return pwd_context.verify(password, user.hashed_password)

# Profile Operations
async def create_profile(email: str, profile: ProfileCreate) -> ProfileInDB:
    """Create a new user profile"""
    db = get_database()
    
    profile_data = ProfileInDB(
        email=email,
        **profile.dict()
    )
    
    result = await db.profiles.insert_one(profile_data.dict())
    profile_data.id = str(result.inserted_id)
    return profile_data

async def get_profile_by_email(email: str) -> Optional[ProfileInDB]:
    """Get profile by email"""
    db = get_database()
    profile_data = await db.profiles.find_one({"email": email})
    if profile_data:
        profile_data = convert_mongo_document(profile_data)
        return ProfileInDB(**profile_data)
    return None

async def update_profile(email: str, profile_update: ProfileUpdate) -> Optional[ProfileInDB]:
    """Update user profile"""
    db = get_database()
    
    update_data = {k: v for k, v in profile_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.profiles.update_one(
        {"email": email},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return await get_profile_by_email(email)
    return None

async def upsert_profile(email: str, profile: ProfileCreate) -> ProfileInDB:
    """Create or update user profile"""
    existing_profile = await get_profile_by_email(email)
    if existing_profile:
        profile_update = ProfileUpdate(**profile.dict())
        updated_profile = await update_profile(email, profile_update)
        return updated_profile
    else:
        return await create_profile(email, profile)

# Wardrobe Item Operations
async def create_wardrobe_item(email: str, item: WardrobeItemCreate) -> WardrobeItemInDB:
    """Create a new wardrobe item"""
    db = get_database()
    
    item_data = WardrobeItemInDB(
        email=email,
        **item.dict()
    )
    
    result = await db.wardrobe_items.insert_one(item_data.dict())
    item_data.id = str(result.inserted_id)
    return item_data

async def get_wardrobe_item_by_id(item_id: str, email: str) -> Optional[WardrobeItemInDB]:
    """Get wardrobe item by ID for a specific user"""
    db = get_database()
    try:
        item_data = await db.wardrobe_items.find_one({
            "_id": ObjectId(item_id),
            "email": email
        })
        if item_data:
            item_data = convert_mongo_document(item_data)
            return WardrobeItemInDB(**item_data)
    except Exception:
        pass
    return None

async def get_user_wardrobe_items(email: str, skip: int = 0, limit: int = 100) -> List[WardrobeItemInDB]:
    """Get all wardrobe items for a user"""
    db = get_database()
    items = []
    cursor = db.wardrobe_items.find({"email": email}).skip(skip).limit(limit).sort("created_at", -1)
    
    async for item_data in cursor:
        item_data = convert_mongo_document(item_data)
        items.append(WardrobeItemInDB(**item_data))
    
    return items

async def update_wardrobe_item(item_id: str, email: str, item_update: WardrobeItemUpdate) -> Optional[WardrobeItemInDB]:
    """Update wardrobe item"""
    db = get_database()
    
    update_data = {k: v for k, v in item_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.wardrobe_items.update_one(
        {"_id": ObjectId(item_id), "email": email},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return await get_wardrobe_item_by_id(item_id, email)
    return None

async def delete_wardrobe_item(item_id: str, email: str) -> bool:
    """Delete wardrobe item"""
    db = get_database()
    result = await db.wardrobe_items.delete_one({
        "_id": ObjectId(item_id),
        "email": email
    })
    return result.deleted_count > 0

async def search_wardrobe_items(
    email: str,
    garment_type: Optional[str] = None,
    style: Optional[str] = None,
    color: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[WardrobeItemInDB]:
    """Search wardrobe items with filters"""
    db = get_database()
    
    # Build filter query
    filter_query = {"email": email}
    if garment_type:
        filter_query["garment_type"] = garment_type
    if style:
        filter_query["style"] = style
    if color:
        filter_query["color"] = {"$regex": color, "$options": "i"}
    
    items = []
    cursor = db.wardrobe_items.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
    
    async for item_data in cursor:
        item_data = convert_mongo_document(item_data)
        items.append(WardrobeItemInDB(**item_data))
    
    return items

# Try-On Session Operations
async def create_tryon_session(email: str, session: TryOnSessionCreate) -> TryOnSessionInDB:
    """Create a new try-on session"""
    db = get_database()
    
    session_data = TryOnSessionInDB(
        email=email,
        **session.dict()
    )
    
    result = await db.tryon_sessions.insert_one(session_data.dict())
    session_data.id = str(result.inserted_id)
    return session_data

async def get_tryon_session_by_id(session_id: str, email: str) -> Optional[TryOnSessionInDB]:
    """Get try-on session by ID for a specific user"""
    db = get_database()
    try:
        session_data = await db.tryon_sessions.find_one({
            "_id": ObjectId(session_id),
            "email": email
        })
        if session_data:
            session_data = convert_mongo_document(session_data)
            return TryOnSessionInDB(**session_data)
    except Exception:
        pass
    return None

async def get_user_tryon_sessions(email: str, skip: int = 0, limit: int = 100) -> List[TryOnSessionInDB]:
    """Get all try-on sessions for a user"""
    db = get_database()
    sessions = []
    cursor = db.tryon_sessions.find({"email": email}).skip(skip).limit(limit).sort("created_at", -1)
    
    async for session_data in cursor:
        session_data = convert_mongo_document(session_data)
        sessions.append(TryOnSessionInDB(**session_data))
    
    return sessions

async def update_tryon_session_result(session_id: str, email: str, result_image_url: str) -> Optional[TryOnSessionInDB]:
    """Update try-on session with results"""
    db = get_database()
    
    update_data = {
        "result_image_url": result_image_url,
        "completed_at": datetime.utcnow()
    }
    
    result = await db.tryon_sessions.update_one(
        {"_id": ObjectId(session_id), "email": email},
        {"$set": update_data}
    )
    
    if result.modified_count > 0:
        return await get_tryon_session_by_id(session_id, email)
    return None

async def delete_tryon_session(session_id: str, email: str) -> bool:
    """Delete try-on session"""
    db = get_database()
    result = await db.tryon_sessions.delete_one({
        "_id": ObjectId(session_id),
        "email": email
    })
    return result.deleted_count > 0

# Statistics Operations
async def get_user_statistics(email: str) -> Dict[str, Any]:
    """Get user statistics"""
    db = get_database()
    
    # Count wardrobe items by type
    wardrobe_stats = await db.wardrobe_items.aggregate([
        {"$match": {"email": email}},
        {"$group": {"_id": "$garment_type", "count": {"$sum": 1}}}
    ]).to_list(length=None)
    
    # Count try-on sessions
    tryon_count = await db.tryon_sessions.count_documents({"email": email})
    
    # Count completed try-on sessions
    completed_count = await db.tryon_sessions.count_documents({
        "email": email,
        "result_image_url": {"$exists": True, "$ne": None}
    })
    
    return {
        "wardrobe_items_by_type": {item["_id"]: item["count"] for item in wardrobe_stats},
        "total_wardrobe_items": sum(item["count"] for item in wardrobe_stats),
        "total_tryon_sessions": tryon_count,
        "completed_tryon_sessions": completed_count
    } 