import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';

const AdminClubManagement = () => {
  const [pendingClubs, setPendingClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingClubs();
  }, []);

  const fetchPendingClubs = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingClubs();
      
      // Handle different response formats
      if (response && Array.isArray(response.clubs)) {
        setPendingClubs(response.clubs);
      } else if (Array.isArray(response)) {
        setPendingClubs(response);
      } else {
        setPendingClubs([]);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch pending clubs');
      console.error('Error fetching pending clubs:', err);
      setPendingClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClubAction = async (clubId, action, reason = '') => {
    setActionLoading(clubId);
    try {
      if (action === 'approve') {
        await adminService.approveClub(clubId);
      } else {
        const rejectionReason = reason || prompt('Please provide a reason for rejection:');
        if (!rejectionReason) {
          setActionLoading(null);
          return;
        }
        await adminService.rejectClub(clubId, rejectionReason);
      }
      
      await fetchPendingClubs(); // Refresh data
      alert(`Club ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} club`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-white/20"></div>
              <h1 className="text-white text-xl font-bold">Club Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center text-white hover:text-gray-300"
              >
                <HomeIcon className="w-5 h-5 mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="text-white hover:text-gray-300"
              >
                Users
              </button>
              <button
                onClick={() => window.location.href = '/admin/payments'}
                className="text-white hover:text-gray-300"
              >
                Payments
              </button>
              <button
                onClick={() => window.location.href = '/admin/reports'}
                className="text-white hover:text-gray-300"
              >
                Reports
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Club Management</h1>
          <p className="text-xl text-gray-300">Review and approve club applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Pending Clubs</p>
                <p className="text-3xl font-bold text-yellow-300">{pendingClubs.length}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Pending Clubs */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-white text-xl">Loading pending clubs...</div>
          </div>
        ) : pendingClubs.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No pending clubs</h3>
            <p className="text-gray-300">All clubs have been reviewed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingClubs.map((club) => (
              <div
                key={club._id}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{club.name}</h3>
                      <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-400/50 rounded-full text-yellow-200 text-sm">
                        Pending
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 border border-purple-400/50 rounded-full text-purple-200 text-sm">
                        {club.category}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-4">{club.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Created by:</p>
                        <p className="text-white">{club.createdBy?.firstName} {club.createdBy?.lastName}</p>
                        <p className="text-gray-400 text-sm">{club.createdBy?.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Created on:</p>
                        <p className="text-white">{new Date(club.createdAt).toLocaleDateString()}</p>
                        {club.location && (
                          <>
                            <p className="text-gray-400 text-sm mt-2">Location:</p>
                            <p className="text-white">{club.location}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {club.tags && club.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {club.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded text-blue-200 text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleClubAction(club._id, 'approve')}
                      disabled={actionLoading === club._id}
                      className="flex items-center px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {actionLoading === club._id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleClubAction(club._id, 'reject')}
                      disabled={actionLoading === club._id}
                      className="flex items-center px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      {actionLoading === club._id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClubManagement;
