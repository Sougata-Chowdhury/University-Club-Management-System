import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  HandThumbUpIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  CogIcon,
  CalendarIcon,
  UserIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import feedbackService from '../services/feedbackService';
import NotificationBell from '../components/NotificationBell';
import FeedbackDialog from '../components/feedback/FeedbackDialog';

const FeedbackPage = () => {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const userMenuRef = useRef(null);
  const quickMenuRef = useRef(null);

  const tabs = [
    { label: 'All Feedback', value: 'all' },
    { label: 'Events', value: 'event' },
    { label: 'Clubs', value: 'club' },
    { label: 'General', value: 'general' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
        setShowQuickMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentTab, searchTerm]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(tabs[currentTab].value !== 'all' && { targetType: tabs[currentTab].value }),
      };

      const [feedbackResponse, statsResponse] = await Promise.all([
        feedbackService.getAllFeedback(params),
        feedbackService.getFeedbackStats(),
      ]);

      setFeedback(feedbackResponse.data.feedback);
      setStats(statsResponse.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
          />
        ))}
      </div>
    );
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { 
        label: 'Pending',
        bgClass: 'bg-yellow-500/20 border-yellow-400/50',
        textClass: 'text-yellow-200'
      },
      approved: { 
        label: 'Approved',
        bgClass: 'bg-green-500/20 border-green-400/50',
        textClass: 'text-green-200'
      },
    };
    return statusMap[status] || statusMap.approved;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Navigation Bar */}
      <nav className="bg-purple-600 border-b border-purple-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-purple-500 rounded-lg p-1.5">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-white text-base font-bold hidden sm:block">Club Portal</h1>
            </Link>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <NotificationBell />

              {/* Quick Actions */}
              <div className="relative" ref={quickMenuRef}>
                <button
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-white/20 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick</span>
                </button>
                
                {showQuickMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <Link to="/create-club" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <PlusIcon className="h-4 w-4 text-blue-500" />
                      <span>Create Club</span>
                    </Link>
                    <Link to="/create-event" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <CalendarIcon className="h-4 w-4 text-purple-500" />
                      <span>Create Event</span>
                    </Link>
                    <Link to="/announcements" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <SparklesIcon className="h-4 w-4 text-pink-500" />
                      <span>Announcements</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/dashboard" className="bg-purple-500 hover:bg-purple-700 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-purple-700 text-sm">
                <HomeIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {currentUser && currentUser.role === 'admin' && (
                <Link to="/admin" className="bg-yellow-500/90 hover:bg-yellow-500 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 font-semibold shadow-lg text-sm">
                  <CogIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-white/20 text-sm"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden md:inline max-w-[100px] truncate">{currentUser?.firstName || 'User'}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">{currentUser?.email || 'Loading...'}</p>
                    </div>
                    <Link to="/profile" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors items-center space-x-2" onClick={() => setShowUserMenu(false)}>
                      <UserIcon className="h-4 w-4 text-blue-500" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/payment-history" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors items-center space-x-2" onClick={() => setShowUserMenu(false)}>
                      <CreditCardIcon className="h-4 w-4 text-green-500" />
                      <span>Payments</span>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2">
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">Community Feedback</h1>
          <p className="text-blue-100 text-sm mb-3">Share your thoughts and help us improve</p>
          
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-white/20 backdrop-blur-lg text-white px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2 text-sm border border-white/30"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Submit New Feedback</span>
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
            <div className="bg-white rounded-xl p-3 border border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-300" />
                <span className="text-xl font-bold text-white">{stats.totalFeedback || 0}</span>
              </div>
              <p className="text-purple-200 text-xs">Total Reviews</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-yellow-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <StarIcon className="h-5 w-5 text-yellow-300" />
                <span className="text-xl font-bold text-white">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <p className="text-yellow-200 text-xs">Average Rating</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-green-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <ChartBarIcon className="h-5 w-5 text-green-300" />
                <span className="text-xl font-bold text-white">{stats.thisMonth || 0}</span>
              </div>
              <p className="text-green-200 text-xs">This Month</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Search and Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg mb-3">
          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg pl-10 pr-3 py-1.5 text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => { setCurrentTab(index); }}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  currentTab === index
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-2">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}

          {!loading && feedback.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-lg">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No feedback found</h3>
              <p className="text-gray-300 text-sm">Be the first to share your thoughts!</p>
            </div>
          )}

          {!loading && feedback.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={item._id} className="bg-white rounded-xl p-3 border border-gray-200 shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    {renderStars(item.rating)}
                    {item.status && (
                      <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgClass} ${statusInfo.textClass} border`}>
                        {statusInfo.label}
                      </span>
                    )}
                    {item.category && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-200 border border-purple-400/30">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Info */}
                {item.targetInfo && (
                  <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-2 mb-2">
                    <p className="text-xs text-purple-200">
                      Feedback for {item.targetType}:
                    </p>
                    <p className="text-sm font-semibold text-white">{item.targetInfo.name || item.targetInfo.title}</p>
                  </div>
                )}

                {/* Comment */}
                <p className="text-sm text-white mb-2 leading-relaxed">{item.comment}</p>

                {/* User Info */}
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-300">
                  <UserIcon className="h-3 w-3" />
                  <span>
                    {item.isAnonymous 
                      ? 'Anonymous' 
                      : (item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'Unknown User')
                    }
                  </span>
                </div>

                {/* Admin Response */}
                {item.adminResponse && (
                  <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-2 mb-2">
                    <p className="text-xs text-green-200">Admin Response:</p>
                    <p className="text-sm text-white">{item.adminResponse}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Submitted {formatDistanceToNow(new Date(item.createdAt))} ago</span>
                  <div className="flex items-center space-x-1">
                    <HandThumbUpIcon className="h-3 w-3" />
                    <span>{item.helpfulVotes || 0} helpful</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        targetType="general"
        targetId={null}
        targetName=""
        onFeedbackSubmitted={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default FeedbackPage;
