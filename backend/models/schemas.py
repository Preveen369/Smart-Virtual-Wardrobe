from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class GarmentType(str, Enum):
    SHIRT = "shirt"
    TSHIRT = "tshirt"
    PANTS = "pants"
    DRESS = "dress"
    SKIRT = "skirt"
    JACKET = "jacket"
    COAT = "coat"
    SAREE = "saree"
    CHURIDAR = "churidar"
    OTHER = "other"

class Style(str, Enum):
    CASUAL = "casual"
    FORMAL = "formal"
    BUSINESS = "business"
    SPORTY = "sporty"
    ELEGANT = "elegant"
    BOHEMIAN = "bohemian"
    VINTAGE = "vintage"
    MODERN = "modern"
    TRADITIONAL = "traditional"
    OTHER = "other"

# User Authentication Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserResponse(BaseModel):
    email: EmailStr
    created_at: datetime
    is_active: bool

# Profile Models
class ProfileCreate(BaseModel):
    first_name: str = ""
    last_name: str = ""
    gender: Optional[Gender] = None
    age: Optional[int] = None
    style_preferences: List[str] = []

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[Gender] = None
    age: Optional[int] = None
    style_preferences: Optional[List[str]] = None

class ProfileInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    first_name: str = ""
    last_name: str = ""
    gender: Optional[Gender] = None
    age: Optional[int] = None
    style_preferences: List[str] = []
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProfileResponse(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    gender: Optional[Gender]
    age: Optional[int]
    style_preferences: List[str]
    updated_at: datetime

# Wardrobe Item Models
class WardrobeItemCreate(BaseModel):
    name: str
    garment_type: GarmentType
    style: Optional[Style] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    image_url: str
    classification_results: Optional[Dict[str, Any]] = None

class WardrobeItemUpdate(BaseModel):
    name: Optional[str] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    classification_results: Optional[Dict[str, Any]] = None

class WardrobeItemInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    name: str
    garment_type: GarmentType
    style: Optional[Style] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    image_url: str
    classification_results: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WardrobeItemResponse(BaseModel):
    id: str
    email: EmailStr
    name: str
    garment_type: GarmentType
    style: Optional[Style]
    color: Optional[str]
    brand: Optional[str]
    image_url: str
    classification_results: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

# Try-On Session Models
class TryOnSessionCreate(BaseModel):
    person_image_url: str
    cloth_image_url: str
    instructions: Optional[str] = None
    model_type: Optional[str] = None
    gender: Optional[Gender] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None

class TryOnSessionUpdate(BaseModel):
    person_image_url: Optional[str] = None
    cloth_image_url: Optional[str] = None
    result_image_url: Optional[str] = None
    instructions: Optional[str] = None
    model_type: Optional[str] = None
    gender: Optional[Gender] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None

class TryOnSessionInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    person_image_url: str
    cloth_image_url: str
    result_image_url: Optional[str] = None
    instructions: Optional[str] = None
    model_type: Optional[str] = None
    gender: Optional[Gender] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class TryOnSessionResponse(BaseModel):
    id: str
    email: EmailStr
    person_image_url: str
    cloth_image_url: str
    result_image_url: Optional[str]
    instructions: Optional[str]
    model_type: Optional[str]
    gender: Optional[Gender]
    garment_type: Optional[GarmentType]
    style: Optional[Style]
    created_at: datetime
    completed_at: Optional[datetime]

# Virtual Try-On Item Models
class VirtualTryOnItemCreate(BaseModel):
    person_image_url: str
    cloth_image_url: str
    result_image_url: str
    result_text: Optional[str] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None
    color: Optional[str] = None

class VirtualTryOnItemUpdate(BaseModel):
    person_image_url: Optional[str] = None
    cloth_image_url: Optional[str] = None
    result_image_url: Optional[str] = None
    result_text: Optional[str] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None
    color: Optional[str] = None

class VirtualTryOnItemInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    person_image_url: str
    cloth_image_url: str
    result_image_url: str
    result_text: Optional[str] = None
    garment_type: Optional[GarmentType] = None
    style: Optional[Style] = None
    color: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class VirtualTryOnItemResponse(BaseModel):
    id: str
    email: EmailStr
    person_image_url: str
    cloth_image_url: str
    result_image_url: str
    result_text: Optional[str]
    garment_type: Optional[GarmentType]
    style: Optional[Style]
    color: Optional[str]
    created_at: datetime
    updated_at: datetime

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Response Models
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool
    error: str
    detail: Optional[str] = None
