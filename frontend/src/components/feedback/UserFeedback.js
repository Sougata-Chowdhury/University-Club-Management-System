import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  HandThumbUpIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  UserGroupIcon,
  CogIcon,
  CalendarIcon,
  UserIcon,
  CreditCardIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import FeedbackDialog from './FeedbackDialog';
import NotificationBell from '../NotificationBell';

const UserFeedback = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const userMenuRef = useRef(null);
  const quickMenuRef = useRef(null);

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

  const tabs = [
    { label: 'All My Feedback', value: 'all' },
    { label: 'Recent', value: 'recent' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Approved', value: 'approved' },
  ];

  useEffect(() => {
    fetchUserFeedback();
    fetchUserStats();
  }, [activeTab]);

  const fetchUserFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = 'http://localhost:8000/feedback/my-feedback';
      
      const params = new URLSearchParams();
      
      switch (tabs[activeTab].value) {
        case 'recent':
          params.append('sortBy', 'createdAt');
          params.append('sortOrder', 'desc');
          params.append('limit', '10');
          break;
        case 'pending':
          params.append('status', 'pending');
          break;
        case 'approved':
          params.append('status', 'approved');
          break;
        default:
          break;
      }

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

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

    } catch (error) {
      console.error('Error fetching feedback:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/feedback/my-feedback', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        const allFeedback = data.data.feedback;
        const totalFeedback = allFeedback.length;
        const averageRating = totalFeedback > 0 
          ? allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback 
          : 0;
        const totalHelpfulVotes = allFeedback.reduce((sum, fb) => sum + (fb.helpfulVotes || 0), 0);
        const pendingCount = allFeedback.filter(fb => fb.status === 'pending').length;
        const approvedCount = allFeedback.filter(fb => fb.status === 'approved').length;

        setStats({
          totalFeedback,
          averageRating,
          totalHelpfulVotes,
          pendingCount,
          approvedCount,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (index) => {
    setActiveTab(index);
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
        fetchUserFeedback();
        fetchUserStats();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
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
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">My Feedback</h1>
          <p className="text-blue-100 text-sm mb-3">Track and manage your submitted feedback</p>
          
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-white/20 backdrop-blur-lg text-white px-3 py-1.5 rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2 text-sm border border-white/30 mx-auto"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Submit New Feedback</span>
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-purple-400/30">
              <div className="flex items-center justify-between mb-1">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-300" />
                <span className="text-xl font-bold text-white">{stats.totalFeedback}</span>
              </div>
              <p className="text-purple-200 text-xs">Total Feedback</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-yellow-400/30">
              <div className="flex items-center justify-between mb-1">
                <StarIcon className="h-5 w-5 text-yellow-300" />
                <span className="text-xl font-bold text-white">{stats.averageRating.toFixed(1)}</span>
              </div>
              <p className="text-yellow-200 text-xs">Avg Rating</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-blue-400/30">
              <div className="flex items-center justify-between mb-1">
                <HandThumbUpIcon className="h-5 w-5 text-blue-300" />
                <span className="text-xl font-bold text-white">{stats.totalHelpfulVotes}</span>
              </div>
              <p className="text-blue-200 text-xs">Helpful Votes</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-orange-400/30">
              <div className="flex items-center justify-between mb-1">
                <ClockIcon className="h-5 w-5 text-orange-300" />
                <span className="text-xl font-bold text-white">{stats.pendingCount}</span>
              </div>
              <p className="text-orange-200 text-xs">Pending Review</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-green-400/30">
              <div className="flex items-center justify-between mb-1">
                <CheckCircleIcon className="h-5 w-5 text-green-300" />
                <span className="text-xl font-bold text-white">{stats.approvedCount}</span>
              </div>
              <p className="text-green-200 text-xs">Approved</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-3">
          <div className="flex overflow-x-auto border-b border-white/10">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => handleTabChange(index)}
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
              <p className="text-gray-300 text-sm mb-3">You haven't submitted any feedback yet.</p>
              <button
                onClick={() => setDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-all text-sm"
              >
                Submit Your First Feedback
              </button>
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
                    onClick={() => handleDelete(item._id)}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Target Info */}
                {item.targetInfo && (
                  <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-2 mb-2">
                    <p className="text-xs text-purple-200">Feedback about:</p>
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
        </div>
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingFeedback(null);
        }}
        editingFeedback={editingFeedback}
        onFeedbackSubmitted={() => {
          fetchUserFeedback();
          fetchUserStats();
        }}
      />
    </div>
  );
};

export default UserFeedback;
