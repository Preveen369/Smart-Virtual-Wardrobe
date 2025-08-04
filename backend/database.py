import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = "virtual_wardrobe"

# Async client for FastAPI
async_client = None
# Sync client for operations that need it
sync_client = None

async def connect_to_mongo():
    """Initialize MongoDB connection"""
    global async_client, sync_client
    try:
        async_client = AsyncIOMotorClient(MONGODB_URL)
        sync_client = MongoClient(MONGODB_URL)
        
        # Test the connection
        await async_client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        return async_client
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close MongoDB connection"""
    global async_client, sync_client
    if async_client:
        async_client.close()
    if sync_client:
        sync_client.close()
    print("🔌 MongoDB connection closed")

def get_database():
    """Get database instance"""
    if not async_client:
        raise Exception("Database not connected. Call connect_to_mongo() first.")
    return async_client[DATABASE_NAME]

def get_sync_database():
    """Get sync database instance for operations that need it"""
    if not sync_client:
        raise Exception("Database not connected. Call connect_to_mongo() first.")
    return sync_client[DATABASE_NAME] 
