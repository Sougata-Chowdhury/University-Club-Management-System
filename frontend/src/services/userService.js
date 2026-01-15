import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://university-club-management-system.onrender.com'
    : 'http://localhost:8000');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout for authentication errors (invalid/expired token)
    // Don't logout for authorization errors (403 Forbidden)
    if (error.response?.status === 401 && 
        (error.response?.data?.message?.includes('Unauthorized') || 
         error.response?.data?.message?.includes('token') ||
         error.response?.data?.message?.includes('Invalid token'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const userService = {
  // Authentication methods (existing)
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getUserActivity: async (limit = 20) => {
    try {
      console.log('UserService: Getting user activity, limit:', limit);
      const response = await api.get(`/users/activity?limit=${limit}`);
      console.log('UserService: Activity response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error getting activity:', error);
      return []; // Return empty array if activity endpoint fails
    }
  },

  getCurrentUser: async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      const response = await api.get('/users/profile');
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw new Error('Please log in to continue');
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  // New User Management methods
  getUserProfile: async () => {
    try {
      console.log('UserService: Getting user profile');
      const response = await api.get('/users/profile');
      console.log('UserService: Profile response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error getting profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (profileData) => {
    try {
      console.log('UserService: Updating user profile:', profileData);
      const response = await api.put('/users/profile', profileData);
      console.log('UserService: Profile update response:', response.data);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('UserService: Error updating profile:', error);
      throw error;
    }
  },

  uploadProfilePicture: async (formData) => {
    try {
      console.log('UserService: Uploading profile picture');
      const response = await api.post('/users/profile/upload-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('UserService: Profile picture upload response:', response.data);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('UserService: Error uploading profile picture:', error);
      throw error;
    }
  },

  updateUserSettings: async (settingsData) => {
    try {
      console.log('UserService: Updating user settings:', settingsData);
      const response = await api.put('/users/settings', settingsData);
      console.log('UserService: Settings update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error updating settings:', error);
      throw error;
    }
  },

  changePassword: async (passwordData) => {
    try {
      console.log('UserService: Changing password');
      const response = await api.post('/users/change-password', passwordData);
      console.log('UserService: Password change response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error changing password:', error);
      throw error;
    }
  },

  deactivateAccount: async () => {
    try {
      console.log('UserService: Deactivating account');
      const response = await api.post('/users/deactivate');
      console.log('UserService: Deactivation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error deactivating account:', error);
      throw error;
    }
  },

  getAllUsers: async (page = 1, limit = 10) => {
    try {
      console.log('UserService: Getting all users, page:', page, 'limit:', limit);
      const response = await api.get(`/users/all?page=${page}&limit=${limit}`);
      console.log('UserService: All users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error getting all users:', error);
      throw error;
    }
  },

  getUserById: async (userId) => {
    try {
      console.log('UserService: Getting user by ID:', userId);
      const response = await api.get(`/users/${userId}`);
      console.log('UserService: User by ID response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error getting user by ID:', error);
      throw error;
    }
  },

  logActivity: async (userId, activityData) => {
    try {
      console.log('UserService: Logging activity for user:', userId, activityData);
      const response = await api.post(`/users/${userId}/activity`, activityData);
      console.log('UserService: Log activity response:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserService: Error logging activity:', error);
      throw error;
    }
  }
};

export default userService;
