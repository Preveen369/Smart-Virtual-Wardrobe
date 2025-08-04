# Smart Virtual Wardrobe - Backend

This is the backend API server for the Smart Virtual Wardrobe project, built with FastAPI and Python. It provides RESTful endpoints for user authentication, wardrobe management, AI-powered virtual try-on, and clothing classification.

---

## 🚀 Features

- FastAPI-based REST API with JWT authentication
- User registration, login, and token verification
- Wardrobe item CRUD operations with image upload and classification
- Virtual try-on image generation using Google Gemini AI
- MongoDB integration for data storage
- Cloudinary integration for image storage and delivery
- Robust error handling and validation

---

## 🛠️ Tech Stack

- FastAPI
- Python 3.12+
- Uvicorn ASGI server
- Pydantic for data validation
- MongoDB with Motor async driver
- Cloudinary for image storage
- Google Gemini API for AI image generation
- Roboflow API for clothing classification
- JWT for authentication

---

## ⚙️ Setup Instructions

### Prerequisites

- Python 3.12+
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API key
- Roboflow API key

### Installation

```bash
git clone https://github.com/yourusername/Smart-Virtual-Wardrobe.git
cd Smart-Virtual-Wardrobe/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
ROBOFLOW_API_KEY=your_roboflow_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
```

### Running the Server

```bash
uvicorn main:app --reload 
```

The app will be available at `http://localhost:8000`.

---

## 📦 API Endpoints

### Authentication
```
POST   /auth/register           # User registration
POST   /auth/login              # User login
GET    /auth/verify             # Verify JWT token
```

### Virtual Try-On
```
POST   /api/try-on              # Generate virtual try-on
GET    /api/try-on/sessions     # Get user's try-on history
GET    /api/try-on/sessions/{id} # Get specific try-on session
DELETE /api/try-on/sessions/{id} # Delete try-on session
```

### Wardrobe Management
```
POST   /api/wardrobe/classify   # Classify clothing image
POST   /api/wardrobe/items      # Add new wardrobe item
GET    /api/wardrobe/items      # Get user's wardrobe items
GET    /api/wardrobe/items/{id} # Get specific item
PUT    /api/wardrobe/items/{id} # Update item details
DELETE /api/wardrobe/items/{id} # Delete item
GET    /api/wardrobe/search     # Search items with filters
GET    /api/wardrobe/statistics # Get wardrobe statistics
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

## 📞 Support

For issues or questions, please open an issue on the main repository or contact support@smartvirtualwardrobe.com.

---

**⭐ Star this repository if you find it helpful!**
