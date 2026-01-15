import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

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

// Handle auth errors - only logout for invalid/expired token, not for other 401/403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout if it's an authentication error (invalid/expired token)
    // Don't logout for authorization errors (e.g., already registered, past event, etc.)
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

export const eventService = {
  // Get all events
  getAllEvents: async () => {
    try {
      const response = await api.get('/events');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  // Get event by ID
  getEventById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event');
    }
  },

  // Get events created by current user
  getMyEvents: async () => {
    try {
      const response = await api.get('/events/my');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your events');
    }
  },

  // Get events user is registered for
  getRegisteredEvents: async () => {
    try {
      const response = await api.get('/events/registered');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch registered events');
    }
  },

  // Get events by club ID
  getEventsByClub: async (clubId) => {
    try {
      const response = await api.get(`/events/club/${clubId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club events');
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  // Update event
  updateEvent: async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  // Delete event
  deleteEvent: async (id) => {
    try {
      await api.delete(`/events/${id}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },

  // Join event (register)
  joinEvent: async (id) => {
    try {
      const response = await api.post(`/events/${id}/join`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join event');
    }
  },

  // Leave event (unregister)
  leaveEvent: async (id) => {
    try {
      const response = await api.delete(`/events/${id}/leave`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to leave event');
    }
  }
};
