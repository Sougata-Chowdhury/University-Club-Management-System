import React, { useState, useEffect } from 'react';
import { BellIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import NotificationCenter from './NotificationCenter';
import notificationService from '../services/notificationService';

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getNotificationStats();
      const newUnreadCount = response.data.unread;
      
      // Animate if count increased
      if (newUnreadCount > unreadCount) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
      
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const closeNotifications = () => {
    setShowNotifications(false);
    // Refresh unread count when closing
    loadUnreadCount();
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={toggleNotifications}
          className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 transition-all duration-200 ${
            isAnimating ? 'animate-bounce' : ''
          }`}
          aria-label="Notifications"
        >
          {unreadCount > 0 ? (
            <BellSolidIcon className="h-6 w-6 text-blue-600" />
          ) : (
            <BellIcon className="h-6 w-6" />
          )}
          
          {unreadCount > 0 && (
            <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full ${
              isAnimating ? 'animate-pulse scale-110' : ''
            }`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          
          {/* Notification indicator for screen readers */}
          {unreadCount > 0 && (
            <span className="sr-only">
              {unreadCount} unread notifications
            </span>
          )}
        </button>

        {/* Quick preview tooltip on hover */}
        {unreadCount > 0 && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Notification Center Modal */}
      {showNotifications && (
        <NotificationCenter onClose={closeNotifications} />
      )}
    </>
  );
};

export default NotificationBell;
