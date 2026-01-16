import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  SpeakerWaveIcon,
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { announcementService } from '../services/announcementService';
import ReportButton from './ReportButton';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [myAnnouncements, setMyAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState(null);
  const [myPagination, setMyPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [liking, setLiking] = useState({});
  const [deleting, setDeleting] = useState({});
  const [editing, setEditing] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllAnnouncements();
    } else {
      fetchMyAnnouncements();
    }
  }, [activeTab, currentPage]);

  const fetchAllAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAllAnnouncements(currentPage, 10);
      setAnnouncements(response.announcements);
      setPagination(response.pagination);
      setError('');
    } catch (err) {
      setError(err.message);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getMyAnnouncements(currentPage, 10);
      setMyAnnouncements(response.announcements);
      setMyPagination(response.pagination);
      setError('');
    } catch (err) {
      setError(err.message);
      setMyAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (announcementId) => {
    if (liking[announcementId]) return;

    try {
      setLiking(prev => ({ ...prev, [announcementId]: true }));
      const result = await announcementService.toggleLike(announcementId);
      
      // Update the announcements state
      const updateAnnouncementList = (announcements) => 
        announcements.map(announcement => 
          announcement._id === announcementId
            ? { ...announcement, likes: result.likes, liked: result.liked }
            : announcement
        );

      if (activeTab === 'all') {
        setAnnouncements(prev => updateAnnouncementList(prev));
      } else {
        setMyAnnouncements(prev => updateAnnouncementList(prev));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLiking(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(prev => ({ ...prev, [announcementId]: true }));
      await announcementService.deleteAnnouncement(announcementId);
      
      // Remove from local state
      if (activeTab === 'all') {
        setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
      } else {
        setMyAnnouncements(prev => prev.filter(a => a._id !== announcementId));
      }
      
      setSuccessMessage('Announcement deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleting(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  const handleEditAnnouncement = async (announcementId, newMessage) => {
    try {
      setEditing(prev => ({ ...prev, [announcementId]: true }));
      const updatedAnnouncement = await announcementService.updateAnnouncement(announcementId, {
        message: newMessage
      });
      
      // Update local state
      const updateAnnouncementList = (announcements) => 
        announcements.map(announcement => 
          announcement._id === announcementId
            ? { ...announcement, message: updatedAnnouncement.message }
            : announcement
        );

      if (activeTab === 'all') {
        setAnnouncements(prev => updateAnnouncementList(prev));
      } else {
        setMyAnnouncements(prev => updateAnnouncementList(prev));
      }
      
      setEditingId(null);
      setEditMessage('');
      setSuccessMessage('Announcement updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update announcement');
      setTimeout(() => setError(''), 5000);
    } finally {
      setEditing(prev => ({ ...prev, [announcementId]: false }));
    }
  };

  const startEdit = (announcementId, currentMessage) => {
    setEditingId(announcementId);
    setEditMessage(currentMessage);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const saveEdit = (announcementId) => {
    if (editMessage.trim()) {
      handleEditAnnouncement(announcementId, editMessage.trim());
    }
  };

  const isOwnAnnouncement = (announcement) => {
    if (!currentUser || !announcement.createdBy) return false;
    return currentUser.id === announcement.createdBy._id || 
           currentUser._id === announcement.createdBy._id ||
           currentUser.id === announcement.createdBy ||
           currentUser._id === announcement.createdBy;
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor((now - date) / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const currentAnnouncements = activeTab === 'all' ? announcements : myAnnouncements;
  const currentPagination = activeTab === 'all' ? pagination : myPagination;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-700 text-xl flex items-center">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Compact Navigation Bar */}
      <nav className="bg-purple-600 border-b border-purple-700 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-white/80 hover:text-white transition-colors text-sm flex items-center space-x-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-lg p-1.5">
                  <SpeakerWaveIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-white text-base font-bold hidden sm:block">Club Announcements</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/create-announcement"
                className="bg-purple-700 hover:bg-purple-800 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 transform transition-all duration-300 hover:scale-105 shadow-lg text-sm"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-semibold">New</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Tabs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
          <div className="flex space-x-2 bg-purple-700 rounded-xl p-1 border border-purple-800">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                activeTab === 'all'
                  ? 'bg-purple-800 text-white shadow-lg'
                  : 'text-purple-100 hover:text-white hover:bg-purple-600'
              }`}
            >
              <SpeakerWaveIcon className="w-4 h-4 mr-2" />
              All Announcements
            </button>
            <button
              onClick={() => {
                setActiveTab('my');
                setCurrentPage(1);
              }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                activeTab === 'my'
                  ? 'bg-purple-800 text-white shadow-lg'
                  : 'text-purple-100 hover:text-white hover:bg-purple-600'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 mr-2" />
              My Announcements
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 rounded-lg p-3 mb-4">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Announcements */}
        {currentAnnouncements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-lg">
            <SpeakerWaveIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {activeTab === 'all' ? '📢 No announcements yet' : '📝 No announcements created'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm max-w-md mx-auto">
              {activeTab === 'all' 
                ? 'Check back later for updates from university clubs!'
                : 'Start sharing updates with your club members by creating your first announcement.'
              }
            </p>
            {activeTab === 'my' && (
              <Link
                to="/create-announcement"
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transform transition-all duration-300 hover:scale-105 text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Your First Announcement
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentAnnouncements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-lg transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {announcement.createdBy?.firstName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-gray-800 font-semibold text-sm sm:text-base truncate">
                          {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                        </h4>
                        <span className="text-gray-400 text-xs sm:text-sm">•</span>
                        <span className="text-purple-600 text-xs sm:text-sm font-medium">
                          {announcement.club?.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 text-gray-500 text-xs sm:text-sm">
                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{formatDate(announcement.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {(activeTab === 'my' || isOwnAnnouncement(announcement)) && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(announcement._id, announcement.message)}
                          disabled={editing[announcement._id] || deleting[announcement._id]}
                          className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                          title="Edit announcement"
                        >
                          <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          disabled={deleting[announcement._id] || editing[announcement._id]}
                          className="text-red-600 hover:text-red-700 transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          title="Delete announcement"
                        >
                          {deleting[announcement._id] ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    )}
                    {activeTab === 'all' && !isOwnAnnouncement(announcement) && (
                      <ReportButton
                        reportType="announcement"
                        reportTargetId={announcement._id}
                        reportTargetInfo={{ 
                          title: announcement.message ? 
                            (announcement.message.length > 50 ? 
                              `"${announcement.message.substring(0, 50)}..."` : 
                              `"${announcement.message}"`) :
                            `Announcement by ${announcement.createdBy?.name || 
                              announcement.createdBy?.email || 
                              `${announcement.createdBy?.firstName || ''} ${announcement.createdBy?.lastName || ''}`.trim() ||
                              'Unknown User'}`,
                          description: announcement.message,
                          club: announcement.club?.name,
                          author: announcement.createdBy?.name || announcement.createdBy?.email || 'Unknown'
                        }}
                        variant="icon"
                        size="small"
                        tooltip="Report this announcement"
                      />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-3">
                  {editingId === announcement._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all resize-none text-sm"
                        rows={4}
                        placeholder="Edit your announcement..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveEdit(announcement._id)}
                          disabled={editing[announcement._id] || !editMessage.trim()}
                          className="px-3 py-1.5 bg-green-100 border border-green-400 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-medium"
                        >
                          {editing[announcement._id] ? (
                            <>
                              <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin inline mr-1"></div>
                              Saving...
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={editing[announcement._id]}
                          className="px-3 py-1.5 bg-gray-100 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  )}
                </div>

                {/* Image */}
                {announcement.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={`http://localhost:8000${announcement.image}`}
                      alt="Announcement"
                      className="w-full h-auto max-h-80 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <button
                      onClick={() => handleLike(announcement._id)}
                      disabled={liking[announcement._id]}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg transition-all transform hover:scale-105 text-xs sm:text-sm ${
                        announcement.liked
                          ? 'bg-red-100 border border-red-400 text-red-700'
                          : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {announcement.liked ? (
                        <HeartSolidIcon className="w-4 h-4" />
                      ) : (
                        <HeartIcon className="w-4 h-4" />
                      )}
                      <span className="font-medium">{announcement.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1.5 text-gray-600 text-xs sm:text-sm">
                      <ChatBubbleLeftIcon className="w-4 h-4" />
                      <span>Comments</span>
                    </div>
                  </div>
                  <div className="text-gray-600 text-xs sm:text-sm">
                    {announcement.club?.category && (
                      <span className="bg-purple-100 border border-purple-300 px-2 py-0.5 sm:py-1 rounded text-purple-700">
                        {announcement.club.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {currentPagination && currentPagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="bg-white rounded-xl p-1.5 border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!currentPagination.hasPrev}
                  className="px-2.5 py-1.5 rounded-lg text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-xs sm:text-sm"
                >
                  Previous
                </button>
                {Array.from({ length: currentPagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2.5 py-1.5 rounded-lg transition-colors text-xs sm:text-sm ${
                      page === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!currentPagination.hasNext}
                  className="px-2.5 py-1.5 rounded-lg text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-xs sm:text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/create-announcement"
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 z-50"
        title="Create New Announcement"
      >
        <PlusIcon className="w-5 h-5" />
      </Link>
    </div>
  );
};

export default Announcements;
