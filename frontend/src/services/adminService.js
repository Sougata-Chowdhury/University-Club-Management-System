import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

class AdminService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses and errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Only logout for authentication errors (invalid/expired token)
        // Don't logout for authorization errors (403 Forbidden)
        if (error.response?.status === 401 && 
            (error.response?.data?.message?.includes('Unauthorized') || 
             error.response?.data?.message?.includes('token') ||
             error.response?.data?.message?.includes('Invalid token'))) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Dashboard & Statistics
  async getDashboard() {
    const response = await this.api.get('/dashboard');
    return response.data;
  }

  async getSystemStats() {
    const response = await this.api.get('/stats');
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.api.get('/health');
    return response.data;
  }

  // User Management
  async getUsers(params = {}) {
    const response = await this.api.get('/users', { params });
    return response.data.data || response.data; // Handle both formats
  }

  async toggleUserStatus(userId) {
    const response = await this.api.put(`/users/${userId}/toggle-status`);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await this.api.delete(`/users/${userId}`);
    return response.data;
  }

  async bulkUserAction(data) {
    const response = await this.api.post('/users/bulk-action', data);
    return response.data;
  }

  // Club Management
  async getAllClubs() {
    try {
      // Use the regular clubs endpoint with admin token
      const response = await axios.get('http://localhost:8000/clubs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      throw error;
    }
  }

  async getPendingClubs() {
    const response = await this.api.get('/clubs/pending');
    return response.data.data || response.data; // Handle both formats
  }

  async approveClub(clubId) {
    const response = await this.api.put(`/clubs/${clubId}/approve`);
    return response.data;
  }

  async rejectClub(clubId, reason) {
    const response = await this.api.put(`/clubs/${clubId}/reject`, { reason });
    return response.data;
  }

  // Payment Management
  async getPendingPayments() {
    const response = await this.api.get('/payments/pending');
    return response.data.data || response.data; // Handle both formats
  }

  async approvePayment(paymentId) {
    const response = await this.api.put(`/payments/${paymentId}/approve`);
    return response.data;
  }

  async rejectPayment(paymentId, reason) {
    const response = await this.api.put(`/payments/${paymentId}/reject`, { reason });
    return response.data;
  }

  // Feedback Management
  async updateFeedbackStatus(feedbackId, statusData) {
    try {
      // Use the main feedback endpoint for status updates
      const response = await axios.put(`${API_BASE_URL}/feedback/${feedbackId}/status`, statusData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  }

  async getAllFeedback(params = {}) {
    try {
      // Use the main feedback endpoint with admin flag
      const response = await axios.get(`${API_BASE_URL}/feedback`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        params: {
          ...params,
          admin: true
        }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching all feedback:', error);
      throw error;
    }
  }

  // Reports & Analytics
  async generateSystemReport(params = {}) {
    const response = await this.api.get('/reports/system', { params });
    return response.data.data || response.data; // Handle both formats
  }

  async getAnalytics(filters = {}) {
    const response = await this.api.get('/analytics', { params: filters });
    return response.data.data || response.data; // Handle both formats
  }
}

export const adminService = new AdminService();
export default adminService;
