import api from './api';

class NotificationService {
  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  // Get notification preferences
  async getNotificationPreferences() {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(preferences) {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete all read notifications
  async deleteReadNotifications() {
    try {
      const response = await api.delete('/notifications/read');
      return response.data;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }

  // Create specific notification types
  async createClubJoinNotification(clubName, clubId) {
    try {
      const response = await api.post('/notifications/club-join', {
        clubName,
        clubId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating club join notification:', error);
      throw error;
    }
  }

  async createEventRegistrationNotification(eventName, eventId) {
    try {
      const response = await api.post('/notifications/event-registration', {
        eventName,
        eventId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating event registration notification:', error);
      throw error;
    }
  }

  async createPaymentNotification(amount, eventName) {
    try {
      const response = await api.post('/notifications/payment', {
        amount,
        eventName
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment notification:', error);
      throw error;
    }
  }

  // Report-specific notification methods
  async getReportNotifications(page = 1, limit = 10) {
    try {
      const response = await api.get('/notifications', {
        params: { 
          page, 
          limit,
          type: 'report_submitted,report_status_updated,report_action_taken,report_dismissed,report_under_review'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching report notifications:', error);
      throw error;
    }
  }

  // Format report notification message based on type and content
  formatReportNotification(notification) {
    const { type } = notification;
    
    switch (type) {
      case 'report_submitted':
        return {
          ...notification,
          icon: '📝',
          color: 'blue',
          actionText: 'View Report Status'
        };
      case 'report_status_updated':
        return {
          ...notification,
          icon: '🔄',
          color: 'yellow',
          actionText: 'Check Update'
        };
      case 'report_action_taken':
        return {
          ...notification,
          icon: '✅',
          color: 'green',
          actionText: 'View Details'
        };
      case 'report_dismissed':
        return {
          ...notification,
          icon: '❌',
          color: 'red',
          actionText: 'Learn More'
        };
      case 'report_under_review':
        return {
          ...notification,
          icon: '👀',
          color: 'orange',
          actionText: 'Track Progress'
        };
      default:
        return notification;
    }
  }

  // Helper methods for UI
  getNotificationIcon(type) {
    const icons = {
      club: '👥',
      event: '📅',
      payment: '💳',
      announcement: '📢',
      admin: '⚠️',
      reminder: '⏰',
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      report_submitted: '📝',
      report_status_updated: '🔄',
      report_action_taken: '✅',
      report_dismissed: '❌',
      report_under_review: '👀'
    };
    return icons[type] || icons.info;
  }

  getNotificationColor(priority) {
    const colors = {
      success: 'green',
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      high: 'red',
      medium: 'yellow',
      low: 'gray'
    };
    return colors[priority] || colors.info;
  }

  formatTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now - notificationDate;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
