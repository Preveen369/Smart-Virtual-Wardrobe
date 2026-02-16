import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  // Register new user
  register: async (email, password) => {
    const response = await api.post('/register', { email, password });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

// Wardrobe Services
export const wardrobeService = {
  // Classify uploaded image
  classifyImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/wardrobe/classify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create new wardrobe item
  createItem: async (itemData) => {
    const response = await api.post('/api/wardrobe/items', itemData);
    return response.data;
  },

  // Get all wardrobe items
  getItems: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/wardrobe/items', {
      params: { skip, limit },
    });
    return response.data;
  },

  // Get specific wardrobe item
  getItem: async (itemId) => {
    const response = await api.get(`/api/wardrobe/items/${itemId}`);
    return response.data;
  },

  // Update wardrobe item
  updateItem: async (itemId, updateData) => {
    const response = await api.put(`/api/wardrobe/items/${itemId}`, updateData);
    return response.data;
  },

  // Delete wardrobe item
  deleteItem: async (itemId) => {
    const response = await api.delete(`/api/wardrobe/items/${itemId}`);
    return response.data;
  },

  // Search wardrobe items
  searchItems: async (filters = {}) => {
    const response = await api.get('/api/wardrobe/search', { params: filters });
    return response.data;
  },

  // Get wardrobe statistics
  getStatistics: async () => {
    const response = await api.get('/api/wardrobe/statistics');
    return response.data;
  },
};

// Outfit Advisor / LLM integration
export const advisorService = {
  // Analyze outfit by sending structured description and optional image
  analyzeOutfit: async (payload) => {
    // payload: { description, outfit_name, outfit_type, outfit_size, outfit_season, outfit_style, image_url }
    const response = await api.post('/api/outfit-advisor/analyze', payload);
    return response.data;
  },

  // List saved analyses
  listResults: async (skip = 0, limit = 50) => {
    const response = await api.get('/api/outfit-advisor', { params: { skip, limit } });
    return response.data;
  },

  // Get single saved analysis
  getResult: async (id) => {
    const response = await api.get(`/api/outfit-advisor/${id}`);
    return response.data;
  },

  // Delete a saved analysis
  deleteResult: async (id) => {
    const response = await api.delete(`/api/outfit-advisor/${id}`);
    return response.data;
  },

  // Upload an outfit image specifically for Outfit Advisor
  uploadImage: async (file) => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/api/outfit-advisor/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
};
// Try-On Services
export const tryOnService = {
  // Perform virtual try-on
  tryOn: async (formData) => {
    const response = await api.post('/api/try-on', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Create try-on session
  createSession: async (sessionData) => {
    const response = await api.post('/api/try-on/sessions', sessionData);
    return response.data;
  },

  // Get all try-on sessions
  getSessions: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/try-on/sessions', {
      params: { skip, limit },
    });
    return response.data;
  },

  // Get specific try-on session
  getSession: async (sessionId) => {
    const response = await api.get(`/api/try-on/sessions/${sessionId}`);
    return response.data;
  },

  // Update try-on session with results
  updateSessionResult: async (sessionId, resultData) => {
    const response = await api.put(`/api/try-on/sessions/${sessionId}/result`, resultData);
    return response.data;
  },

  // Delete try-on session
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/api/try-on/sessions/${sessionId}`);
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data?.detail || error.response.data?.message || 'An error occurred',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        status: 0,
      };
    } else {
      // Something else happened
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        status: 0,
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get user email from token
  getUserEmail: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub;
      } catch (error) {
        return null;
      }
    }
    return null;
  },
};

export default api;
