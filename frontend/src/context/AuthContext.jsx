/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { authService, apiUtils } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        return { email: decoded.sub };
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(false);

  // Login function using new API service
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      setToken(data.access_token);
      setUser({ email });
      localStorage.setItem("token", data.access_token);
      return { success: true };
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      return { success: false, message: errorInfo.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function using new API service
  const register = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(email, password);
      setToken(data.access_token);
      setUser({ email });
      localStorage.setItem("token", data.access_token);
      return { success: true };
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      return { success: false, message: errorInfo.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const profile = await authService.getProfile();
      return { success: true, data: profile };
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await authService.updateProfile(profileData);
      return { success: true, data: updatedProfile };
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // On mount, try to restore user and token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !user) {
      setToken(storedToken);
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ email: decoded.sub });
      } catch {
        setUser(null);
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        logout, 
        getProfile, 
        updateProfile,
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 