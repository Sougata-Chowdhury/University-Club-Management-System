import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import notificationService from '../services/notificationService';

const NotificationCenter = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showReportsOnly, setShowReportsOnly] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [page, showUnreadOnly, showReportsOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page, 20, showUnreadOnly);
      
      let filteredNotifications = response.data.notifications;
      
      // Filter for report notifications if enabled
      if (showReportsOnly) {
        filteredNotifications = response.data.notifications.filter(n => 
          n.type && n.type.startsWith('report_')
        );
      }
      
      if (page === 1) {
        setNotifications(filteredNotifications);
      } else {
        setNotifications(prev => [...prev, ...filteredNotifications]);
      }
      
      setHasMore(response.data.notifications.length === 20);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await notificationService.getNotificationStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );
      setStats(prev => ({ ...prev, unread: prev.unread - 1 }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true, readAt: new Date() }))
      );
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteRead = async () => {
    try {
      const response = await notificationService.deleteReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
      setStats(prev => ({ ...prev, total: prev.total - response.data.deletedCount }));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const toggleUnreadFilter = () => {
    setShowUnreadOnly(!showUnreadOnly);
    setPage(1);
  };

  const toggleReportsFilter = () => {
    setShowReportsOnly(!showReportsOnly);
    setPage(1);
  };

  const getNotificationStyle = (notification) => {
    const baseStyle = "p-4 border-l-4 hover:bg-gray-50 transition-colors duration-200";
    
    // Special styling for report notifications
    if (notification.type && notification.type.startsWith('report_')) {
      const reportColors = {
        report_submitted: "border-blue-500 bg-blue-50",
        report_under_review: "border-yellow-500 bg-yellow-50", 
        report_action_taken: "border-green-500 bg-green-50",
        report_dismissed: "border-gray-500 bg-gray-50",
        report_status_updated: "border-purple-500 bg-purple-50"
      };
      const reportStyle = reportColors[notification.type] || reportColors.report_submitted;
      const opacity = notification.read ? "opacity-75" : "";
      return `${baseStyle} ${reportStyle} ${opacity}`;
    }
    
    // Default styling for other notifications
    const priorityColors = {
      success: "border-green-500 bg-green-50",
      info: "border-blue-500 bg-blue-50",
      warning: "border-yellow-500 bg-yellow-50",
      error: "border-red-500 bg-red-50",
      high: "border-red-500 bg-red-50",
      medium: "border-yellow-500 bg-yellow-50",
      low: "border-gray-500 bg-gray-50"
    };
    
    const opacity = notification.read ? "opacity-75" : "";
    const priorityStyle = priorityColors[notification.priority] || priorityColors.info;
    
    return `${baseStyle} ${priorityStyle} ${opacity}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BellSolidIcon className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Notifications</h2>
              {stats.unread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {stats.unread}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Action Bar */}
          <div className="flex items-center justify-between mt-3 space-x-2">
            <div className="flex space-x-2">
              <button
                onClick={toggleUnreadFilter}
                className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-colors"
              >
                {showUnreadOnly ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                <span>{showUnreadOnly ? 'Show All' : 'Unread Only'}</span>
              </button>
              
              <button
                onClick={toggleReportsFilter}
                className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                  showReportsOnly 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <span>📝</span>
                <span>{showReportsOnly ? 'All Types' : 'Reports Only'}</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              {stats.unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-colors"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Mark All Read</span>
                </button>
              )}
              
              <button
                onClick={handleDeleteRead}
                className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm hover:bg-opacity-30 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Clear Read</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <BellIcon className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div key={notification._id} className={getNotificationStyle(notification)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {notificationService.getNotificationIcon(notification.type)}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Special content for report notifications */}
                      {notification.type && notification.type.startsWith('report_') && (
                        <div className="mb-2">
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            📝 Report Update
                          </div>
                          {notification.relatedId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Report ID: {notification.relatedId.slice(-8)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {notificationService.formatTimeAgo(notification.createdAt)}
                        </span>
                        
                        {notification.actionUrl && (
                          <a
                            href={notification.actionUrl}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {notification.actionText || 'View'}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total: {stats.total}</span>
            <span>Unread: {stats.unread}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
