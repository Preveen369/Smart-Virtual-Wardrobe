import cloudinary
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Folder structure for Cloudinary
CLOUDINARY_BASE_FOLDER = "virtual_wardrobe"
WARDROBE_ITEM_FOLDER = f"{CLOUDINARY_BASE_FOLDER}/wardrobe_item_images"
OUTFIT_ADVISOR_FOLDER = f"{CLOUDINARY_BASE_FOLDER}/outfit_advisor_images"
TRYON_IMAGE_FOLDER = f"{CLOUDINARY_BASE_FOLDER}/tryon_images"

def get_wardrobe_item_folder():
    """Get the folder path for wardrobe item images"""
    return WARDROBE_ITEM_FOLDER

def get_outfit_advisor_folder():
    """Get the folder path for outfit advisor images"""
    return OUTFIT_ADVISOR_FOLDER

def get_tryon_image_folder():
    """Get the folder path for try-on images"""
    return TRYON_IMAGE_FOLDER
