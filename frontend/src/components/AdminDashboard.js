import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingClubs, setPendingClubs] = useState([]);
  const [allClubs, setAllClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const handleClubAction = async (clubId, action) => {
    setActionLoading(clubId);
    try {
      if (action === 'approve') {
        await adminService.approveClub(clubId);
      } else {
        await adminService.rejectClub(clubId);
      }
      
      await fetchData(); // Refresh data
      alert(`Club ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(error.message || `Failed to ${action} club`);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [allClubsData, pendingClubsData, usersData] = await Promise.all([
        adminService.getAllClubs(), // Get all clubs
        adminService.getPendingClubs(), // Get pending clubs for admin actions
        authService.getAllUsers() // Get all users
      ]);

      // Set all clubs data
      const clubsData = Array.isArray(allClubsData) ? allClubsData : [];
      setAllClubs(clubsData);
      
      // Set pending clubs
      const pendingClubsList = Array.isArray(pendingClubsData) ? 
        pendingClubsData.filter(club => club.status === 'pending') : [];
      setPendingClubs(pendingClubsList);
      
      // Set users
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear auth data and redirect
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Navigation */}
      <nav className="bg-purple-600 border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-white text-xl font-bold">Admin Panel - University Club Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Admin Dashboard</span>
              <button
                onClick={handleRefresh}
                className="bg-purple-700 hover:bg-purple-800 text-white px-3 py-1 rounded-lg transition-colors text-sm flex items-center space-x-1"
                disabled={loading}
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleLogout}
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-xl text-gray-700">Manage clubs and users</p>
        </div>

        {/* Admin Navigation */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <UserGroupIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-gray-900 font-semibold">User Management</span>
              <span className="text-gray-600 text-sm">Manage all users</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/clubs')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <CheckCircleIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-gray-900 font-semibold">Club Management</span>
              <span className="text-gray-600 text-sm">Approve & manage clubs</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/announcements')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <SpeakerWaveIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-gray-900 font-semibold">Announcements</span>
              <span className="text-gray-600 text-sm">Manage announcements</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/payments')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <ClockIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-gray-900 font-semibold">Payment Management</span>
              <span className="text-gray-600 text-sm">Process payments</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/reports')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mb-2">🛡️</span>
              <span className="text-gray-900 font-semibold">Reports Management</span>
              <span className="text-gray-600 text-sm">Handle user reports</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/feedback')}
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-gray-900 font-semibold">Feedback Management</span>
              <span className="text-gray-600 text-sm">Review user feedback</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Clubs</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingClubs.length}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Clubs</p>
                <p className="text-3xl font-bold text-purple-600">{allClubs.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Clubs</p>
                <p className="text-3xl font-bold text-green-600">
                  {allClubs.filter(club => club.status === 'approved').length}
                </p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{users.length}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-1 mb-8 border border-gray-200 shadow-lg max-w-md mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'pending'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pending Clubs ({pendingClubs.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              All Clubs ({allClubs.length})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pending Clubs Tab */}
        {activeTab === 'pending' && (
          <div>
            {pendingClubs.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending clubs</h3>
                <p className="text-gray-600">All clubs have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingClubs.map((club) => (
                  <div
                    key={club._id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-6">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{club.name}</h3>
                          <span className="px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-800 text-sm">
                            Pending
                          </span>
                          <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-sm">
                            {club.category}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{club.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-600 text-sm">Created by:</p>
                            <p className="text-gray-900">
                              {club.createdBy?.firstName && club.createdBy?.lastName 
                                ? `${club.createdBy.firstName} ${club.createdBy.lastName}` 
                                : 'Unknown'}
                            </p>
                            <p className="text-gray-600 text-sm">{club.createdBy?.email || 'No email'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Created on:</p>
                            <p className="text-gray-900">{new Date(club.createdAt).toLocaleDateString()}</p>
                            {club.location && (
                              <>
                                <p className="text-gray-600 text-sm mt-2">Location:</p>
                                <p className="text-gray-900">{club.location}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {club.tags && club.tags.length > 0 && (
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm mb-2">Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {club.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 text-sm"
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
                          className="flex items-center px-4 py-2 bg-green-600 border border-green-700 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          {actionLoading === club._id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleClubAction(club._id, 'reject')}
                          disabled={actionLoading === club._id}
                          className="flex items-center px-4 py-2 bg-red-600 border border-red-700 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
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
        )}

        {/* All Clubs Tab */}
        {activeTab === 'all' && (
          <div>
            {allClubs.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No clubs found</h3>
                <p className="text-gray-600">No clubs have been created yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allClubs.map((club) => (
                  <div
                    key={club._id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm border ${
                        club.status === 'approved' 
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : club.status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        {club.status}
                      </span>
                      <span className="px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 text-sm">
                        {club.category}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{club.name}</h3>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">{club.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>Members: {club.members?.length || 0}</span>
                      <span>{new Date(club.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p>Creator: {club.createdBy?.firstName && club.createdBy?.lastName 
                        ? `${club.createdBy.firstName} ${club.createdBy.lastName}` 
                        : 'Unknown'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
