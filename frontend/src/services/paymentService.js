import api from './api';

export const paymentService = {
  // Create payment for event
  createPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create payment');
    }
  },

  // Get user's payment history
  getUserPayments: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/payments/my-payments?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  },

  // Get payments for a specific club (for club managers)
  getClubPayments: async (clubId, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/payments/club/${clubId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club payments');
    }
  },

  // Get approved payment history for a specific club
  getClubPaymentHistory: async (clubId, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/payments/club/${clubId}/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club payment history');
    }
  },

  // Get payments for a specific event
  getEventPayments: async (eventId) => {
    try {
      const response = await api.get(`/payments/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event payments');
    }
  },

  // Get payment by ID
  getPaymentById: async (paymentId) => {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment details');
    }
  },

  // Update payment (for users to update pending payments)
  updatePayment: async (paymentId, paymentData) => {
    try {
      const response = await api.put(`/payments/${paymentId}`, paymentData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update payment');
    }
  },

  // Approve payment (for club managers)
  approvePayment: async (paymentId, notes = '') => {
    try {
      const response = await api.put(`/payments/${paymentId}/approve`, {
        status: 'approved',
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve payment');
    }
  },

  // Reject payment (for club managers)
  rejectPayment: async (paymentId, rejectionReason = '', notes = '') => {
    try {
      const response = await api.put(`/payments/${paymentId}/approve`, {
        status: 'rejected',
        rejectionReason,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reject payment');
    }
  },

  // Get payment statistics
  getPaymentStats: async () => {
    try {
      const response = await api.get('/payments/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment statistics');
    }
  }
};
