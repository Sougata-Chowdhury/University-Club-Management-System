import api from './api';

export const clubService = {
  // Get all clubs
  getAllClubs: async () => {
    try {
      const response = await api.get('/clubs');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch clubs');
    }
  },

  // Get user's clubs (created and joined)
  getMyClubs: async () => {
    try {
      const response = await api.get('/clubs/my-clubs');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your clubs');
    }
  },

  // Get user's applications
  getUserApplications: async () => {
    try {
      console.log('clubService: Calling /clubs/my-applications API');
      const response = await api.get('/clubs/my-applications');
      console.log('clubService: API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('clubService: API error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user applications');
    }
  },

  // Get club by ID
  getClubById: async (clubId) => {
    try {
      const response = await api.get(`/clubs/${clubId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club details');
    }
  },

  // Create a new club
  createClub: async (clubData) => {
    try {
      const response = await api.post('/clubs', clubData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create club');
    }
  },

  // Update club
  updateClub: async (clubId, clubData) => {
    try {
      const response = await api.put(`/clubs/${clubId}`, clubData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update club');
    }
  },

  // Delete club
  deleteClub: async (clubId) => {
    try {
      const response = await api.delete(`/clubs/${clubId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete club');
    }
  },

  // Apply to join club
  applyToJoinClub: async (clubId) => {
    try {
      const response = await api.post(`/clubs/${clubId}/apply`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to apply to club');
    }
  },

  // Withdraw application from club
  withdrawApplication: async (clubId) => {
    try {
      const response = await api.delete(`/clubs/${clubId}/withdraw-application`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to withdraw application');
    }
  },

  // Get club applications (for club owners)
  getClubApplications: async (clubId) => {
    try {
      const response = await api.get(`/clubs/${clubId}/applications`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club applications');
    }
  },

  // Handle member application
  handleMemberApplication: async (clubId, userId, action) => {
    try {
      const response = await api.put(`/clubs/${clubId}/applications/${userId}`, {
        status: action
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to handle application');
    }
  },

  // Remove member from club
  removeMember: async (clubId, userId) => {
    try {
      const response = await api.delete(`/clubs/${clubId}/members/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to remove member');
    }
  }
};
