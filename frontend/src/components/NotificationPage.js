import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import NotificationCenter from './NotificationCenter';
import NotificationSettings from './NotificationSettings';
import notificationService from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';

const NotificationPage = () => {
  const { getThemeClasses, getCardClasses, getInputClasses, isDark } = useTheme();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await notificationService.getNotificationStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setMessage('All notifications marked as read!');
      loadStats(); // Refresh stats
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setMessage('Failed to mark all as read');
    }
  };

  const deleteReadNotifications = async () => {
    try {
      await notificationService.deleteReadNotifications();
      setMessage('Read notifications deleted!');
      loadStats(); // Refresh stats
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      setMessage('Failed to delete read notifications');
    }
  };

  return (
    <div className={getThemeClasses()}>
      {/* Header */}
      <div className={`${getCardClasses()} shadow`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BellIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage your notification preferences and view your messages</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <CogIcon className="h-5 w-5" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <BellIcon className="h-5 w-5" />
                <span>View Notifications</span>
                {stats.unread > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {stats.unread}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Failed') || message.includes('Error')
              ? isDark 
                ? 'bg-red-900/50 text-red-300 border border-red-700'
                : 'bg-red-100 text-red-700 border border-red-200'
              : isDark
                ? 'bg-green-900/50 text-green-300 border border-green-700'
                : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${getCardClasses()} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <BellIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Notifications</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className={`${getCardClasses()} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
                <SparklesIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unread</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.unread}</p>
              </div>
            </div>
          </div>

          <div className={`${getCardClasses()} rounded-lg shadow p-6`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Read</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total - stats.unread}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className={`${getCardClasses()} rounded-lg shadow p-6 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mark All Read</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mark all notifications as read</p>
            <button
              onClick={markAllAsRead}
              disabled={stats.unread === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Mark Read
            </button>
          </div>

          <div className={`${getCardClasses()} rounded-lg shadow p-6 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-red-900/50' : 'bg-red-100'}`}>
              <TrashIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Clear Read</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Delete all read notifications</p>
            <button
              onClick={deleteReadNotifications}
              disabled={stats.total - stats.unread === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Delete Read
            </button>
          </div>

          <div className={`${getCardClasses()} rounded-lg shadow p-6 text-center`}>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
              <CogIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Preferences</h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure notification settings</p>
            <button
              onClick={() => setShowSettings(true)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Quick Access */}
        <div className={`mt-8 ${getCardClasses()} rounded-lg shadow`}>
          <div className="p-6">
            <h2 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quick Access</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowNotificationCenter(true)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 border-gray-600' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BellIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>View All Notifications</span>
                  </div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→</span>
                </div>
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 border-gray-600' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CogIcon className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Settings</span>
                  </div>
                  <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>→</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNotificationCenter && (
        <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
      )}
      
      {showSettings && (
        <NotificationSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default NotificationPage;
