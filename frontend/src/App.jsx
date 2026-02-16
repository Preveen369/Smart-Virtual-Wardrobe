import React, { useState, useEffect } from "react";
import { Layout, ConfigProvider, theme, Switch, Typography } from "antd";
import { BulbOutlined, BulbFilled } from "@ant-design/icons";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Logout from "./components/Logout";
import HomePage from "./pages/HomePage";
import TryOnPage from "./pages/TryOnPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import WardrobePage from "./pages/WardrobePage";
import FavoritesPage from "./pages/FavoritesPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import HelpPage from "./pages/HelpPage";
import OutfitAdvisorPage from "./pages/OutfitAdvisorPage";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";
import { Drawer, Button, Divider } from "antd";
import Footer from "./components/Footer";
import ClothHangerIcon from "./assets/ClothHangerIcon";
import { ToastContainer } from 'react-toastify';

const { Header } = Layout;
const { Title } = Typography;

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppNav({ isDarkMode, setIsDarkMode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  if (!user) return null;

  // Theme-responsive colors
  const bgColor = isDarkMode ? "#18181b" : "#fff";
  const textColor = isDarkMode ? "#e4e4e7" : "#111827";
  const subText = isDarkMode ? "#a1a1aa" : "#4b5563";
  const borderColor = isDarkMode ? "#27272a" : "#e5e7eb";
  const activeColor = "#0ea5e9";
  const hoverColor = isDarkMode ? "#38bdf8" : "#0ea5e9";

  const navLinksMain = [
    { to: "/", label: "Home" },
    { to: "/tryon", label: "Try-On" },
    { to: "/wardrobe", label: "Wardrobe" },
    { to: "/favorites", label: "Favorites" },
    { to: "/history", label: "History" },
  ];
  const navLinksAccount = [
    { to: "/profile", label: "Profile" },
    { to: "/help", label: "Help" },
  ];

  return (
    <Header
      style={{
        background: bgColor,
        display: "flex",
        alignItems: "center",
        padding: "1.5rem 2rem",
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: isDarkMode
          ? "0 2px 8px 0 rgba(0,0,0,0.15)"
          : "0 2px 8px 0 rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      {/* Left: Logo/Title */}
      <div className="flex items-center min-w-[220px]">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClothHangerIcon size={38} color={activeColor} style={{ marginRight: 4, marginBottom: 2 }} />
            <Title level={3} style={{ margin: 0, color: textColor, letterSpacing: 1, cursor: 'pointer' }}>
              Smart Virtual Wardrobe
            </Title>
          </div>
        </Link>
      </div>
      {/* Hamburger for mobile */}
      <div className="flex-1 flex justify-end md:hidden">
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 24, color: textColor }} />}
          onClick={() => setDrawerOpen(true)}
        />
      </div>
      {/* Center: Nav Links (hidden on mobile) */}
      <div className="flex-1 justify-center hidden md:flex">
        <nav className="flex gap-4 items-center text-base">
          {[...navLinksMain, ...navLinksAccount].map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  color: isActive ? activeColor : subText,
                  fontWeight: isActive ? "bold" : "normal",
                  textDecoration: "none",
                  padding: "2px 8px",
                  borderRadius: 6,
                  transition: "color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => (e.target.style.color = hoverColor)}
                onMouseLeave={e => (e.target.style.color = isActive ? activeColor : subText)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Right: User Actions (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-6 min-w-[220px] justify-end">
        <Switch
          checked={isDarkMode}
          onChange={setIsDarkMode}
          checkedChildren={<BulbFilled />} 
          unCheckedChildren={<BulbOutlined />}
        />
        <Logout isDarkMode={isDarkMode} />
      </div>
      {/* Drawer for mobile nav */}
      <Drawer
        title={null}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: 0, background: bgColor }, header: { display: 'none' } }}
        width={290}
        style={{ boxShadow: isDarkMode ? '0 0 24px #18181b' : '0 0 24px #e5e7eb' }}
      >
        {/* Logo/Title at the top */}
        <div style={{
          padding: '1.5rem 1rem 0.5rem 1.5rem',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {/* <BulbFilled style={{ color: activeColor, fontSize: 28, marginRight: 8 }} /> */}
          <ClothHangerIcon size={38} color={activeColor} style={{ marginRight: 4, marginBottom: 2 }} />
          <Title level={4} style={{ margin: 0, color: textColor, letterSpacing: 1 }}>
            Smart Virtual Wardrobe
          </Title>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)' }}>
          {/* Navigation Section */}
          <div style={{ padding: '1.2rem 0.5rem 0.5rem 1.5rem' }}>
            <div className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: subText, paddingLeft: 2, letterSpacing: 1 }}>
              Navigation
            </div>
            {navLinksMain.map((link, idx) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: location.pathname === link.to ? activeColor : textColor,
                  fontWeight: location.pathname === link.to ? 'bold' : 'normal',
                  textDecoration: 'none',
                  fontSize: 18,
                  padding: '10px 0 10px 0',
                  borderRadius: 8,
                  marginBottom: 2,
                  background: location.pathname === link.to ? (isDarkMode ? '#23272f' : '#e6f7ff') : 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onClick={() => setDrawerOpen(false)}
                onMouseEnter={e => (e.target.style.color = hoverColor)}
                onMouseLeave={e => (e.target.style.color = location.pathname === link.to ? activeColor : textColor)}
              >
                {/* Add icons for each nav item */}
                {idx === 0 && <span role="img" aria-label="home">🏠</span>}
                {idx === 1 && <span role="img" aria-label="tryon">👗</span>}
                {idx === 2 && <span role="img" aria-label="wardrobe">🧥</span>}
                {idx === 3 && <span role="img" aria-label="favorites">❤️</span>}
                {idx === 4 && <span role="img" aria-label="history">📅</span>}
                {link.label}
              </Link>
            ))}
          </div>
          <Divider style={{ margin: '12px 0 0 0', borderColor: borderColor }} />
          {/* Account Section */}
          <div style={{ padding: '1.2rem 0.5rem 0.5rem 1.5rem', marginTop: 6 }}>
            <div className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide" style={{ color: subText, paddingLeft: 2, letterSpacing: 1 }}>
              Account
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navLinksAccount.map((link, idx) => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    color: location.pathname === link.to ? activeColor : textColor,
                    fontWeight: location.pathname === link.to ? 'bold' : 'normal',
                    textDecoration: 'none',
                    fontSize: 18,
                    padding: '10px 0 10px 0',
                    borderRadius: 8,
                    marginBottom: 2,
                    background: location.pathname === link.to ? (isDarkMode ? '#23272f' : '#e6f7ff') : 'transparent',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onClick={() => setDrawerOpen(false)}
                  onMouseEnter={e => (e.target.style.color = hoverColor)}
                  onMouseLeave={e => (e.target.style.color = location.pathname === link.to ? activeColor : textColor)}
                >
                  {idx === 0 && <span role="img" aria-label="profile">👤</span>}
                  {idx === 1 && <span role="img" aria-label="help">❓</span>}
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          {/* Spacer to push bottom actions down */}
          <div style={{ flex: 1 }} />
          {/* Bottom actions: dark mode toggle and logout */}
          <div style={{
            borderTop: `1px solid ${borderColor}`,
            padding: '1.2rem 1.5rem 1.5rem 1.5rem',
            background: isDarkMode ? '#18181b' : '#f4f6fa',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
              <span style={{ color: subText, fontWeight: 500, fontSize: 15 }}>Dark Mode</span>
              <Switch
                checked={isDarkMode}
                onChange={setIsDarkMode}
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
              />
            </div>
            <Logout isDarkMode={isDarkMode} />
          </div>
        </nav>
      </Drawer>
    </Header>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { defaultAlgorithm, darkAlgorithm } = theme;

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <AuthProvider>
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: "#0ea5e9",
          borderRadius: 10,
        },
      }}
    >
        <BrowserRouter>
          <AppNav isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          <div
            style={{
              minHeight: "100vh",
              background: isDarkMode ? "#0f0f0f" : "#f9fafb",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<LoginPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                <Route path="/register" element={<RegisterPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <HomePage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/tryon"
                  element={
                    <PrivateRoute>
                      <TryOnPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/wardrobe"
                  element={
                    <PrivateRoute>
                      <WardrobePage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/outfit-advisor"
                  element={
                    <PrivateRoute>
                      <OutfitAdvisorPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <PrivateRoute>
                      <FavoritesPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PrivateRoute>
                      <HistoryPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <PrivateRoute>
                      <HelpPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
            {/* Toast notifications container (for react-toastify) */}
            <div>
              {/* Place ToastContainer here for global notifications */}
              <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={isDarkMode ? 'dark' : 'light'} />
            </div>
            <Footer isDarkMode={isDarkMode} />
          </div>
        </BrowserRouter>
    </ConfigProvider>
    </AuthProvider>
  );
}

export default App;