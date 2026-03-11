# Smart Virtual Wardrobe - Frontend

This is the frontend application for the Smart Virtual Wardrobe project, built with React, Vite, and Ant Design. It provides a responsive user interface for managing your virtual wardrobe, performing AI-powered virtual try-ons, browsing outfit recommendations, and generating 3D avatars.

---

## 🚀 Features

- Responsive React application with Ant Design UI components and Tailwind CSS
- User authentication (register/login) and profile management with photo upload
- Wardrobe management: add, classify, update, and delete clothing items
- Virtual try-on interface with image upload and AI integration (Gradio/Kolors)
- LLM-powered Outfit Advisor: upload a clothing image and receive AI style suggestions
- Style Feed: browse and save AI-generated style cards (Pollinations)
- Avatar Generator: generate a 3D model/video from a clothing image (MP4 preview + interactive GLB viewer powered by Three.js)
- Favorites management and try-on history
- Dark/light mode toggle for comfortable viewing
- Mobile-friendly, sticky navigation with drawer menu

---

## 🛠️ Tech Stack

- React 18
- Vite
- Ant Design 5
- Tailwind CSS
- React Router DOM v7
- React Context API (authentication state)
- Axios for API calls
- React Toastify for notifications
- Three.js for interactive GLB 3D model viewing

---

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+
- Backend API running locally (`http://localhost:8000`) or deployed

### Installation

```bash
git clone https://github.com/Preveen369/Smart-Virtual-Wardrobe.git
cd Smart-Virtual-Wardrobe/frontend
npm install
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
# serve with a static file server, or deploy to Vercel/Netlify/etc.
```
---

## 🧪 Testing

Run frontend tests with:

```bash
npm test
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx                    # Main application component, routing & navigation
│   ├── index.css                  # Global styles
│   ├── context/
│   │   └── AuthContext.jsx        # JWT authentication context provider
│   ├── components/
│   │   ├── Footer.jsx             # Footer component
│   │   ├── GLBViewer.jsx          # Interactive 3D GLB viewer (Three.js)
│   │   ├── ImageUpload.jsx        # Reusable image upload component
│   │   └── Logout.jsx             # Logout button component
│   ├── pages/
│   │   ├── HomePage.jsx           # Landing / home page
│   │   ├── TryOnPage.jsx          # AI virtual try-on page
│   │   ├── WardrobePage.jsx       # Wardrobe management page
│   │   ├── FavoritesPage.jsx      # Saved favorites page
│   │   ├── HistoryPage.jsx        # Try-on history page
│   │   ├── ProfilePage.jsx        # User profile & photo upload
│   │   ├── OutfitAdvisorPage.jsx  # LLM outfit advice page
│   │   ├── StyleFeed.jsx          # AI-generated style feed page
│   │   ├── AvatarGeneratorPage.jsx# 3D avatar/model generator page
│   │   ├── HelpPage.jsx           # Help & FAQ page
│   │   ├── LoginPage.jsx          # Login page
│   │   └── RegisterPage.jsx       # Registration page
│   ├── services/
│   │   └── api.js                 # Axios API service functions
│   └── assets/
│       └── ClothHangerIcon.jsx    # Custom SVG logo icon
├── public/                        # Public static files
├── index.html                     # HTML entry point
├── package.json                   # Node.js dependencies and scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.js              # PostCSS configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes. Make sure to follow the coding standards and test your changes.

---

**⭐ Star this repository if you find it helpful!**
