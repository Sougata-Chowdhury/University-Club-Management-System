import api from './api';

export const announcementService = {
  // Get all announcements with pagination
  getAllAnnouncements: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/announcements?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch announcements');
    }
  },

  // Get user's announcements
  getMyAnnouncements: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/announcements/my-announcements?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch your announcements');
    }
  },

  // Get announcements by club
  getAnnouncementsByClub: async (clubId, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/announcements/club/${clubId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch club announcements');
    }
  },

  // Get announcement by ID
  getAnnouncementById: async (announcementId) => {
    try {
      const response = await api.get(`/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch announcement');
    }
  },

  // Create new announcement
  createAnnouncement: async (announcementData) => {
    try {
      const formData = new FormData();
      formData.append('message', announcementData.message);
      formData.append('clubId', announcementData.clubId);
      
      if (announcementData.image) {
        formData.append('image', announcementData.image);
      }

      const response = await api.post('/announcements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create announcement');
    }
  },

  // Update announcement
  updateAnnouncement: async (announcementId, announcementData) => {
    try {
      const formData = new FormData();
      
      if (announcementData.message) {
        formData.append('message', announcementData.message);
      }
      
      if (announcementData.image) {
        formData.append('image', announcementData.image);
      }

      const response = await api.put(`/announcements/${announcementId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update announcement');
    }
  },

  // Delete announcement
  deleteAnnouncement: async (announcementId) => {
    try {
      const response = await api.delete(`/announcements/${announcementId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete announcement');
    }
  },

  // Toggle like on announcement
  toggleLike: async (announcementId) => {
    try {
      const response = await api.post(`/announcements/${announcementId}/like`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle like');
    }
  },

  // Get announcement stats
  getAnnouncementStats: async () => {
    try {
      const response = await api.get('/announcements/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch announcement stats');
    }
  },

  // Admin: Get all announcements including soft-deleted ones
  getAllAnnouncementsForAdmin: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/announcements/admin/all?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin announcements');
    }
  }
};
