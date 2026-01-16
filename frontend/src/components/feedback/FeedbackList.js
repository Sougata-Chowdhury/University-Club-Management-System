import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChatBubbleLeftRightIcon, PlusIcon, ChartBarIcon, StarIcon, HandThumbUpIcon, ChevronLeftIcon, ChevronRightIcon, UserGroupIcon, CogIcon, CalendarIcon, UserIcon, CreditCardIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';
import FeedbackDialog from './FeedbackDialog';
import FeedbackCard from './FeedbackCard';
import NotificationBell from '../NotificationBell';

const FeedbackList = ({ targetType = null, targetId = null, targetName = null, showStats = true }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const userMenuRef = useRef(null);
  const quickMenuRef = useRef(null);
  const isAdmin = currentUser?.role === 'admin';

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

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const tabFilters = [
    { label: 'All Feedback', value: {} },
    { label: 'Recent', value: { sortBy: 'createdAt', sortOrder: 'desc' } },
    { label: 'Highly Rated', value: { sortBy: 'rating', sortOrder: 'desc' } },
    { label: 'Most Helpful', value: { sortBy: 'helpfulVotes', sortOrder: 'desc' } },
    ...(isAdmin ? [{ label: 'Pending Review', value: { status: 'pending' } }] : []),
  ];

  useEffect(() => {
    fetchFeedback();
    if (showStats) {
      fetchStats();
    }
  }, [pagination.page, filters, targetType, targetId]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
        ...(targetType && { targetType }),
        ...(targetId && { targetId }),
      });

      const token = localStorage.getItem('token');
      const endpoint = targetType && targetId 
        ? `http://localhost:8000/feedback/target/${targetType}/${targetId}?${params}`
        : `http://localhost:8000/feedback?${params}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch feedback');
      }

      setFeedback(data.data.feedback);
      setPagination(prev => ({
        ...prev,
        total: data.data.total,
        totalPages: data.data.totalPages,
      }));

    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (targetType) params.append('targetType', targetType);
      if (targetId) params.append('targetId', targetId);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/feedback/stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setFilters(prev => ({
      ...prev,
      ...tabFilters[newValue].value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleVote = async (feedbackId, voteData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/feedback/${feedbackId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(voteData),
      });

      if (response.ok) {
        fetchFeedback(); // Refresh the list
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleStatusUpdate = async (feedbackId, updateData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        fetchFeedback(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchFeedback(); // Refresh the list
        if (showStats) fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
          <h1 className="text-2xl font-bold text-white mb-1">
            {targetName ? `Feedback for ${targetName}` : 'Feedback Center'}
          </h1>
          <p className="text-blue-100 text-sm mb-3">Share your thoughts and help us improve</p>
          
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-white/20 backdrop-blur-lg text-white px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2 text-sm border border-white/30"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Submit Feedback</span>
          </button>
        </div>

        {/* Statistics */}
        {showStats && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
            <div className="bg-white rounded-xl p-3 border border-purple-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600" />
                <span className="text-xl font-bold text-gray-900">{stats.totalFeedback}</span>
              </div>
              <p className="text-purple-700 text-xs">Total Feedback</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-yellow-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <StarIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-yellow-700 text-xs">Avg Rating</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">{stats.recentFeedback}</span>
              </div>
              <p className="text-blue-700 text-xs">Last 30 Days</p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-green-200 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <HandThumbUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-xl font-bold text-gray-900">
                  {feedback.reduce((sum, fb) => sum + (fb.helpfulVotes || 0), 0)}
                </span>
              </div>
              <p className="text-green-200 text-xs">Helpful Votes</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-3">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-white/10">
            {tabFilters.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(null, index)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === index
                    ? 'text-white border-b-2 border-purple-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="organization">Organization</option>
              <option value="communication">Communication</option>
              <option value="facilities">Facilities</option>
              <option value="content">Content</option>
              <option value="instructor">Instructor</option>
              <option value="other">Other</option>
            </select>

            {isAdmin && (
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="under_review">Under Review</option>
              </select>
            )}

            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="createdAt">Date</option>
              <option value="rating">Rating</option>
              <option value="helpfulVotes">Helpful Votes</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-2">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {!loading && feedback.length === 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center border border-white/20">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No feedback found</h3>
              <p className="text-gray-300 text-sm">Be the first to share your thoughts!</p>
            </div>
          )}

          {!loading && feedback.map((item) => (
            <FeedbackCard
              key={item._id}
              feedback={item}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onVote={handleVote}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
            />
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 text-sm border border-white/20"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span>Previous</span>
              </button>
              
              <span className="text-white text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 text-sm border border-white/20"
              >
                <span>Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        targetType={targetType}
        targetId={targetId}
        targetName={targetName}
        onFeedbackSubmitted={() => {
          fetchFeedback();
          if (showStats) fetchStats();
        }}
      />
    </div>
  );
};

export default FeedbackList;
