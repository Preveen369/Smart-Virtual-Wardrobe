# Smart Virtual Wardrobe - Backend

This is the backend API server for the Smart Virtual Wardrobe project, built with FastAPI and Python. It provides RESTful endpoints for user authentication, wardrobe management, AI-powered virtual try-on, clothing classification, outfit advice, style feed, apparel catalog, and 3D avatar/model generation.

---

## 🚀 Features

- FastAPI-based REST API with JWT authentication
- User registration, login, profile management, and profile photo upload (stored on Cloudinary)
- Wardrobe item CRUD operations with image upload and Roboflow clothing classification
- Virtual try-on image generation via Gradio (Kolors Virtual Try-On space), results saved to Cloudinary
- LLM-powered outfit advisor using OpenRouter API with image upload support
- Style feed backed by the user's saved favorites
- Apparel catalog browsing and filtering from a local CSV dataset
- Pollinations-powered image generation and 3D-style avatar generation
- 3D model/video generation (MP4 preview + GLB file) using the TRELLIS Gradio space; results served from `/avatars_3D`
- MongoDB integration (async via Motor) for data storage
- Cloudinary integration for image storage and delivery
- Robust input validation, error handling, and file type/size checks

---

## 🛠️ Tech Stack

- FastAPI
- Python 3.12+
- Uvicorn ASGI server
- Pydantic for data validation
- MongoDB with Motor async driver
- Cloudinary for image storage
- Gradio Client for virtual try-on and 3D generation
- Roboflow Inference SDK for clothing classification
- OpenRouter API for LLM outfit advice
- Pollinations AI for image and avatar generation
- JWT for authentication

---

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.12+
- MongoDB Atlas account
- Cloudinary account
- Roboflow API key
- OpenRouter API key
- Pollinations API key (optional)
- HuggingFace token (optional, for TRELLIS 3D space)

### Installation

```bash
git clone https://github.com/Preveen369/Smart-Virtual-Wardrobe.git
cd Smart-Virtual-Wardrobe/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```bash
ROBOFLOW_API_KEY=your_roboflow_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

# OpenRouter (LLM Outfit Advisor)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1   # optional, default shown
OPENROUTER_MODEL=nvidia/nemotron-nano-12b-v2-vl:free  # optional, default shown
OPENROUTER_FALLBACK_MODEL=gpt-4o-mini                 # optional, default shown

# Gradio Virtual Try-On space URL (optional, default shown)
GRADIO_TRYON_URL=https://ai-modelscope-kolors-virtual-try-on.ms.fun/

# Pollinations image/avatar generation (optional)
POLLINATIONS_API_KEY=your_pollinations_api_key_here

# HuggingFace token for TRELLIS 3D space (optional)
HF_TOKEN=your_huggingface_token_here
```

### Running the Server

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs are available at `http://localhost:8000/docs`.

---

## 📦 API Endpoints

### Authentication & Profile
```
POST   /register                    # User registration
POST   /login                       # User login
GET    /me                          # Get current user info
GET    /profile                     # Get user profile
POST   /profile                     # Create user profile
PUT    /profile                     # Update user profile
POST   /profile/photo               # Upload profile photo (Cloudinary)
```

### Virtual Try-On
```
POST   /api/try-on                        # Generate virtual try-on (Gradio/Kolors)
POST   /api/try-on/sessions               # Create try-on session record
GET    /api/try-on/sessions               # Get user's try-on history
GET    /api/try-on/sessions/{id}          # Get specific try-on session
PUT    /api/try-on/sessions/{id}/result   # Update session result
DELETE /api/try-on/sessions/{id}          # Delete try-on session
```

### Wardrobe Management
```
POST   /api/wardrobe/classify       # Classify clothing image (Roboflow)
POST   /api/wardrobe/items          # Add new wardrobe item
GET    /api/wardrobe/items          # Get user's wardrobe items
GET    /api/wardrobe/items/{id}     # Get specific item
PUT    /api/wardrobe/items/{id}     # Update item details
DELETE /api/wardrobe/items/{id}     # Delete item
GET    /api/wardrobe/search         # Search items with filters
GET    /api/wardrobe/statistics     # Get wardrobe statistics
```

### Outfit Advisor
```
POST   /api/outfit-advisor/analyze  # Analyze outfit and get AI-powered advice
POST   /api/outfit-advisor/upload   # Upload clothing image for advisor context
GET    /api/outfit-advisor          # List user's outfit advice history
GET    /api/outfit-advisor/{id}     # Get specific advice record
DELETE /api/outfit-advisor/{id}     # Delete advice record
```

### Favorites & Style Feed
```
GET    /api/favorites               # List favorites (optional ?type= filter)
POST   /api/favorites               # Save a favorite
DELETE /api/favorites/{id}          # Remove a favorite
GET    /api/stylefeed               # List style-feed cards for the user (latest first)
```

> The `/api/stylefeed` collection stays in sync with `favorites` of type `stylefeed`. The frontend uses this endpoint exclusively when rendering the Style Feed page.

### Apparel Catalog
```
GET    /api/apparel/filters         # Get available filter options (gender, season, color, …)
GET    /api/apparel/products        # Get filtered apparel products (up to 5 results)
```

### Image & Avatar Generation
```
GET    /api/image/{prompt}          # Generate image via Pollinations (query: ?model=)
POST   /api/avatar                  # Generate 3D-style avatar via Pollinations (klein model)
```

### 3D Model Generation
```
POST   /generate-3d                 # Generate 3D model + GLB from image (TRELLIS Gradio space)
POST   /generate-3d-fast            # Fast 3D model generation variant
```

### Static Assets
```
GET    /avatars_3D/{filename}       # Serve generated MP4 previews and GLB files
```

---

## 🧪 Testing

Run backend tests with:

```bash
pytest tests/ -v
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes. Ensure your code passes tests and follows coding standards.

---

**⭐ Star this repository if you find it helpful!**
