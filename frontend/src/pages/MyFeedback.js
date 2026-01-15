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
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import feedbackService from '../services/feedbackService';
import NotificationBell from '../components/NotificationBell';

const MyFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const userMenuRef = useRef(null);
  const quickMenuRef = useRef(null);

  const tabs = [
    { label: 'All Feedback', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Under Review', value: 'under_review' },
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
    fetchFeedback();
  }, [currentTab, page, searchTerm]);

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

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(tabs[currentTab].value !== 'all' && { status: tabs[currentTab].value }),
      };

      const response = await feedbackService.getMyFeedback(params);
      setFeedback(response.data.feedback);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await feedbackService.deleteFeedback(feedbackId);
      setFeedback(prev => prev.filter(item => item._id !== feedbackId));
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { 
        label: 'Pending Review',
        bgClass: 'bg-yellow-500/20 border-yellow-400/50',
        textClass: 'text-yellow-200'
      },
      approved: { 
        label: 'Approved',
        bgClass: 'bg-green-500/20 border-green-400/50',
        textClass: 'text-green-200'
      },
      rejected: { 
        label: 'Rejected',
        bgClass: 'bg-red-500/20 border-red-400/50',
        textClass: 'text-red-200'
      },
      under_review: { 
        label: 'Under Review',
        bgClass: 'bg-blue-500/20 border-blue-400/50',
        textClass: 'text-blue-200'
      },
    };
    return statusMap[status] || statusMap.pending;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="bg-white/20 rounded-lg p-1.5">
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

              <Link to="/dashboard" className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-white/30 text-sm">
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
          <h1 className="text-2xl font-bold text-white mb-1">My Feedback</h1>
          <p className="text-blue-100 text-sm mb-3">View and manage your feedback submissions</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Search and Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-3">
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
                onClick={() => { setCurrentTab(index); setPage(1); }}
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
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No feedback found</h3>
              <p className="text-gray-300 text-sm">No feedback submissions match your filters.</p>
            </div>
          )}

          {!loading && feedback.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <div key={item._id} className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2 flex-1">
                    {renderStars(item.rating)}
                    <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bgClass} ${statusInfo.textClass} border`}>
                      {statusInfo.label}
                    </span>
                    {item.category && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-200 border border-purple-400/30">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteFeedback(item._id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => prev - 1)}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-all text-sm border border-white/20"
              >
                Previous
              </button>
              
              <span className="text-white text-sm">
                Page {page} of {totalPages}
              </span>
              
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => prev + 1)}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-all text-sm border border-white/20"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFeedback;
