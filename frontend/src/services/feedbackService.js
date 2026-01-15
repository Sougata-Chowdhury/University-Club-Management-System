import api from './api';

class FeedbackService {
  // Submit new feedback
  async submitFeedback(feedbackData) {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit feedback');
    }
  }

  // Get user's own feedback
  async getMyFeedback(params = {}) {
    try {
      const response = await api.get('/feedback/my-feedback', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }

  // Get feedback for a specific target
  async getFeedbackByTarget(targetType, targetId, params = {}) {
    try {
      const response = await api.get(`/feedback/target/${targetType}/${targetId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }

  // Get feedback statistics
  async getFeedbackStats(targetType = null, targetId = null) {
    try {
      const params = {};
      if (targetType) params.targetType = targetType;
      if (targetId) params.targetId = targetId;
      
      const response = await api.get('/feedback/stats', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback stats');
    }
  }

  // Vote on feedback (helpful/not helpful)
  async voteFeedback(feedbackId, voteData) {
    try {
      const response = await api.post(`/feedback/${feedbackId}/vote`, voteData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to vote on feedback');
    }
  }

  // Delete user's own feedback
  async deleteFeedback(feedbackId) {
    try {
      const response = await api.delete(`/feedback/${feedbackId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete feedback');
    }
  }

  // Get all feedback (public view with filters)
  async getAllFeedback(params = {}) {
    try {
      const response = await api.get('/feedback', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch feedback');
    }
  }
}

const feedbackService = new FeedbackService();
export default feedbackService;
