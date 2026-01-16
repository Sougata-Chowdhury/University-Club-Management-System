import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  SpeakerWaveIcon,
  TrashIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  HomeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { announcementService } from '../services/announcementService';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchAllAnnouncements();
  }, [currentPage]);

  const fetchAllAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAllAnnouncementsForAdmin(currentPage, 20);
      setAnnouncements(response.announcements);
      setPagination(response.pagination);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch announcements');
      setAnnouncements([]);
    } finally {
      setLoading(false);
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
      setAnnouncements(prev => prev.filter(a => a._id !== announcementId));
      
      setSuccessMessage('Announcement deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete announcement');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDeleting(prev => ({ ...prev, [announcementId]: false }));
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl flex items-center">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading announcements...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Navigation */}
      <nav className="bg-purple-600 border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                to="/admin/dashboard" 
                className="text-white hover:text-gray-300 transition-colors flex items-center"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 border-l border-white/30"></div>
              <h1 className="text-white text-xl font-bold flex items-center">
                <SpeakerWaveIcon className="w-6 h-6 mr-2" />
                Announcements Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center text-white hover:text-gray-300"
              >
                <HomeIcon className="w-5 h-5 mr-1" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <SpeakerWaveIcon className="w-10 h-10 mr-3 text-purple-600" />
            📢 Announcements Management
          </h1>
          <p className="text-xl text-gray-700">Monitor and manage all announcements across the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Announcements</p>
                <p className="text-3xl font-bold text-purple-600">{pagination?.totalItems || 0}</p>
              </div>
              <SpeakerWaveIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-3xl font-bold text-green-600">
                  {announcements.filter(a => a.isActive !== false).length}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Deleted</p>
                <p className="text-3xl font-bold text-red-600">
                  {announcements.filter(a => a.isActive === false).length}
                </p>
              </div>
              <div className="text-2xl">🚫</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Showing</p>
                <p className="text-3xl font-bold text-purple-600">{announcements.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Announcements */}
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-lg">
            <SpeakerWaveIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              📢 No announcements found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There are currently no announcements to display.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement._id}
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {announcement.createdBy?.firstName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="text-gray-900 font-semibold">
                          {announcement.createdBy?.firstName} {announcement.createdBy?.lastName}
                        </h4>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-purple-600 text-sm font-medium">
                          {announcement.club?.name}
                        </span>
                        {announcement.club?.category && (
                          <>
                            <span className="text-gray-500 text-sm">•</span>
                            <span className="text-purple-700 text-xs bg-purple-50 border border-purple-200 px-2 py-1 rounded">
                              {announcement.club.category}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-gray-600 text-sm mt-1">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>❤️ {announcement.likes || 0}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {announcement._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Admin Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Status Badge */}
                    <div className={`flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${
                      announcement.isActive === false
                        ? 'bg-red-50 border border-red-200 text-red-800'
                        : 'bg-green-50 border border-green-200 text-green-800'
                    }`}>
                      {announcement.isActive === false ? '🚫 DELETED' : '✅ ACTIVE'}
                    </div>
                    
                    <div className="flex items-center px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-xs">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                      ADMIN
                    </div>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                      disabled={deleting[announcement._id] || announcement.isActive === false}
                      className="text-red-600 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                      title={announcement.isActive === false ? "Already deleted" : "Delete announcement (Admin)"}
                    >
                      {deleting[announcement._id] ? (
                        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                    {announcement.message}
                  </p>
                </div>

                {/* Image */}
                {announcement.image && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={`http://localhost:8000${announcement.image}`}
                      alt="Announcement"
                      className="w-full h-auto max-h-96 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-gray-600 text-sm">
                    <span>Created by {announcement.createdBy?.email}</span>
                  </div>
                  <div className="text-gray-600 text-sm">
                    <span>Club ID: {announcement.club?._id?.slice(-8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="bg-white rounded-2xl p-2 border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 rounded-lg text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 rounded-lg text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
