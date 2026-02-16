from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import tryon, wardrobe, auth
from database import connect_to_mongo, close_mongo_connection
import cloudinary_config

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Smart Virtual Wardrobe API",
    description="AI-powered virtual try-on application with MongoDB integration",
    version="1.0.0",
    lifespan=lifespan
)

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # or ["http://localhost:3000"] for React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tryon.router, prefix="/api")
app.include_router(wardrobe.router, prefix="/api")
app.include_router(auth.router)
# Outfit advisor (LLM-backed)
from routers import outfit_advisor
app.include_router(outfit_advisor.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Smart Virtual Wardrobe API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
