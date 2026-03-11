from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import tryon, wardrobe, auth, image, apparel, favorites, style_feed, avatar, model3d
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

# Allow frontend to connect (development only - open to any origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tryon.router, prefix="/api")
app.include_router(wardrobe.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(style_feed.router, prefix="/api")
app.include_router(auth.router)
app.include_router(apparel.router, prefix="/api")
# Outfit advisor (LLM-backed)
from routers import outfit_advisor
app.include_router(outfit_advisor.router, prefix="/api")

# 3D/video model generation endpoints (non-/api prefix)
app.include_router(model3d.router)

# serve generated 3D assets (mp4 + glb) under /avatars_3D
app.mount("/avatars_3D", StaticFiles(directory="avatars_3D"), name="avatars_3D")

# Image generation proxy used by the frontend Style Feed (`GET /api/image/{prompt}`)
from routers import image
app.include_router(image.router, prefix="/api")
app.include_router(avatar.router, prefix="/api")

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
