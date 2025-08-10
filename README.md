# 🧥🧥 Smart Virtual Wardrobe

A comprehensive AI-powered virtual wardrobe application that combines intelligent clothing classification, virtual try-on capabilities, and personal wardrobe management. Built with FastAPI backend and React frontend, featuring Google Gemini AI for realistic virtual try-ons and Roboflow for automatic clothing classification.

---

## 🚀 Features

**📱 Live Demo**: [Smart Virtual Wardrobe Demo](https://jmp.sh/iMeyrOOx)

- **🤖 AI Virtual Try-On**: Upload person and clothing images to generate photorealistic try-on results using Google Gemini
- **📸 Smart Clothing Classification**: Automatic categorization of clothing items using Roboflow AI
- **👕 Personal Wardrobe Management**: Digitally organize and manage your clothing collection
- **📊 Wardrobe Analytics**: Track statistics about your clothing collection
- **🔐 Secure Authentication**: JWT-based user authentication system
- **☁️ Cloud Storage**: Images stored securely on Cloudinary CDN
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🌓 Dark/Light Mode**: Toggle between themes for comfortable viewing

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Ant Design
- React Router
- React Context API
- Axios

### Backend
- FastAPI
- Python 3.12+
- Uvicorn
- Pydantic
- JWT Authentication

### AI Services
- Google Gemini API
- Roboflow Classification
- TensorFlow Models
- Computer Vision

### Cloud Services
- Cloudinary (Image Storage & CDN)
- CDN Delivery

### Database
- MongoDB Atlas

---

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- Google Gemini API key
- Roboflow API key

### 1. Clone the Repository

```bash
git clone https://github.com/Preveen369/Smart-Virtual-Wardrobe.git
cd Smart-Virtual-Wardrobe
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# OR using Poetry
poetry install
poetry shell

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys:
```

### 🔧 Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
ROBOFLOW_API_KEY=your_roboflow_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
```

**Start the backend server:**
```bash
uvicorn main:app --reload    # port: 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

**Start the frontend development server:**
```bash
npm run dev    # port: 5173
```


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

## 📁 Project Structure

```
Smart-Virtual-Wardrobe/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── database.py            # MongoDB connection
│   ├── cloudinary_config.py   # Cloudinary configuration
│   ├── routers/
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── tryon.py          # Virtual try-on endpoints
│   │   └── wardrobe.py       # Wardrobe management endpoints
│   ├── models/
│   │   ├── schemas.py        # Pydantic models
│   │   └── database_ops.py   # Database operations
│   ├── utils/
│   │   └── base64_helpers.py # Image processing utilities
│   ├── model_training_files/ # ML model training notebooks
│   ├── requirements.txt      # Python dependencies
│   └── pyproject.toml        # Poetry configuration
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── context/          # React context providers
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   └── assets/          # Static assets
│   ├── public/              # Public assets
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite configuration
├── screenshots/             # Application screenshots

├── .env.example            # Environment variables template
└── README.md               # Project documentation
```

For detailed documentation on each component, see:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)


---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing
1. Register a new user account
2. Upload clothing items to your wardrobe
3. Use the classification feature to auto-categorize items
4. Try the virtual try-on with person and clothing images
5. Test search and filtering functionality
6. Verify responsive design on mobile devices

---

## 🚀 Deployment

### Production Build
```bash
# Frontend production build
cd frontend
npm run build

# Backend production
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Environment-Specific Configurations
- **Development**: Local MongoDB, Cloudinary dev environment
- **Staging**: MongoDB Atlas staging, Cloudinary staging
- **Production**: MongoDB Atlas production, Cloudinary production with CDN

---

## 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- CORS configuration for frontend-backend communication
- Secure file upload validation
- Input sanitization and validation

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🗺️ Roadmap

- [✔️] **Phase 1**: Virtual try-on and Wardrobe Clothing Classification
- [ ] **Phase 2**: Outfit recommendation and Weather-based outfit suggestions
- [ ] **Phase 3**: Frontend and Backend Cloud Service Deployemnt

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋‍♂️ Team & Contributors

**Lead Developer**: Preveen S  
**Contributor**: Johnson J

---

## 💡 Acknowledgments

- Google for Gemini AI API
- Roboflow for clothing classification models
- Cloudinary for image storage and CDN
- MongoDB Atlas for database hosting
- FastAPI team for the excellent framework
- React community for UI libraries

---

**⭐ Star this repository if you find it helpful!**
