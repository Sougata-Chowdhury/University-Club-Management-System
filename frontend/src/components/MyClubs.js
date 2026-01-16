import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  EyeIcon,
  PlusIcon,
  CalendarIcon,
  TrashIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { clubService } from '../services/clubService';

const MyClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('owned');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);

  useEffect(() => {
    fetchMyClubs();
    fetchApplications();
  }, []);

  const fetchMyClubs = async () => {
    try {
      const data = await clubService.getMyClubs();
      console.log('My clubs data:', data);
      // The API returns { createdClubs: [], joinedClubs: [] }
      setClubs(data.createdClubs || []);
    } catch (error) {
      setError('Failed to fetch your clubs');
      setClubs([]); // Ensure clubs is always an array
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Current token:', token ? 'exists' : 'missing');

      const data = await clubService.getUserApplications();
      console.log('Applications API response:', data);
      console.log('Applications type:', typeof data);
      console.log('Applications is array:', Array.isArray(data));
      console.log('Raw applications data:', JSON.stringify(data, null, 2));
      setApplications(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to fetch applications');
      setApplications([]); // Ensure applications is always an array
      setLoading(false);
    }
  };

  const handleDeleteClub = async (clubId) => {
    setDeleting(true);
    try {
      await clubService.deleteClub(clubId);
      // Remove the deleted club from the local state
      setClubs(clubs.filter(club => club._id !== clubId));
      setDeleteConfirmation(null);
      setError('');
    } catch (error) {
      console.error('Error deleting club:', error);
      setError(error.message || 'Failed to delete club');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (club) => {
    setDeleteConfirmation(club);
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleWithdrawApplication = async (clubId) => {
    setWithdrawing(clubId);
    try {
      await clubService.withdrawApplication(clubId);
      // Remove the withdrawn application from the local state
      setApplications(applications.filter(app => app.club._id !== clubId));
      setError('');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      setError(error.message || 'Failed to withdraw application');
    } finally {
      setWithdrawing(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 border border-green-200 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            ✅ Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-50 border border-yellow-200 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            ⏳ Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 border border-red-200 text-red-800">
            <ExclamationCircleIcon className="w-4 h-4 mr-1" />
            ❌ Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 border border-gray-300 text-gray-700">
            ❓ Unknown
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading your clubs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Navigation */}
      <nav className="bg-purple-600 border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-white text-xl font-bold">
              University Clubs
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors">
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link 
                to="/settings" 
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <CogIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏛️ My Clubs Dashboard</h1>
          <p className="text-xl text-gray-700 mb-6">Manage your clubs and track your applications</p>
          
          {/* Quick Stats */}
          {Array.isArray(clubs) && clubs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 text-lg font-bold">
                  {clubs.filter(club => club.status === 'approved').length}
                </div>
                <div className="text-green-700 text-sm">✅ Approved Clubs</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-yellow-800 text-lg font-bold">
                  {clubs.filter(club => club.status === 'pending').length}
                </div>
                <div className="text-yellow-700 text-sm">⏳ Pending Approval</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-purple-900 text-lg font-bold">
                  {clubs.reduce((sum, club) => sum + (club.memberApplications?.length || 0), 0)}
                </div>
                <div className="text-purple-800 text-sm">📝 Total Applications</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-purple-50 rounded-2xl p-1 mb-8 border border-gray-200 shadow-lg max-w-md mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('owned')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                activeTab === 'owned'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🏛️ Owned Clubs
              {Array.isArray(clubs) && clubs.length > 0 && (
                <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                  {clubs.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center ${
                activeTab === 'applications'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              � Member Applications
              {Array.isArray(clubs) && clubs.some(club => club.memberApplications?.some(app => app.status === 'pending')) && (
                <span className="ml-2 bg-white/20 text-xs px-2 py-1 rounded-full">
                  {clubs.reduce((sum, club) => sum + (club.memberApplications?.filter(app => app.status === 'pending').length || 0), 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Owned Clubs Tab */}
        {activeTab === 'owned' && (
          <div>
            {!Array.isArray(clubs) || clubs.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 shadow-lg rounded-2xl">
                <UserGroupIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">🎯 No clubs created yet</h3>
                <p className="text-gray-700 mb-4 max-w-md mx-auto">
                  Start building your community by creating your first club! 
                  Share your interests and connect with like-minded students.
                </p>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <h4 className="text-purple-900 font-semibold mb-2">💡 Getting Started:</h4>
                  <ul className="text-purple-800 text-sm text-left space-y-1">
                    <li>• Create your club with a compelling description</li>
                    <li>• Wait for admin approval (usually 1-2 days)</li>
                    <li>• Start accepting members once approved</li>
                    <li>• Organize events and build your community</li>
                  </ul>
                </div>
                <Link
                  to="/create-club"
                  className="inline-flex items-center px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
                >
                  <PlusIcon className="w-6 h-6 mr-3" />
                  Create Your First Club
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.isArray(clubs) && clubs.map((club) => (
                  <div
                    key={club._id}
                    className={`bg-white border border-gray-200 shadow-lg rounded-2xl p-6 transform transition-all duration-300 hover:scale-105 ${
                      club.status === 'approved' 
                        ? 'hover:border-green-300' 
                        : club.status === 'pending'
                        ? 'hover:border-yellow-300'
                        : 'hover:border-red-300'
                    }`}
                  >
                    {/* Status Badge - More Prominent */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(club.status)}
                        {club.status === 'pending' && (
                          <div className="text-yellow-800 text-xs bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
                            💡 Waiting for admin approval
                          </div>
                        )}
                        {club.status === 'rejected' && (
                          <div className="text-red-800 text-xs bg-red-50 border border-red-200 px-2 py-1 rounded">
                            ❌ Contact admin for details
                          </div>
                        )}
                      </div>
                      <span className="text-gray-700 text-sm bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                        📂 {club.category || 'General'}
                      </span>
                    </div>

                    {/* Club Info */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                      🏛️ {club.name}
                    </h3>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {club.description || 'No description provided'}
                    </p>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-gray-700 text-sm bg-gray-50 border border-gray-200 p-2 rounded-lg">
                        <UserGroupIcon className="w-4 h-4 mr-2 text-purple-600" />
                        <div>
                          <div className="font-semibold">{club.members?.length || 0}</div>
                          <div className="text-xs text-gray-600">Members</div>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-700 text-sm bg-gray-50 border border-gray-200 p-2 rounded-lg">
                        <ClockIcon className="w-4 h-4 mr-2 text-purple-600" />
                        <div>
                          <div className="font-semibold">{club.memberApplications?.length || 0}</div>
                          <div className="text-xs text-gray-600">Applications</div>
                        </div>
                      </div>
                    </div>

                    {/* Creation Date */}
                    <div className="text-gray-700 text-xs mb-4 bg-gray-50 border border-gray-200 p-2 rounded-lg">
                      📅 Created: {new Date(club.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        {club.status === 'approved' && (
                          <Link
                            to={`/manage-club/${club._id}`}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg font-semibold text-center text-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <Cog6ToothIcon className="w-4 h-4 inline mr-1" />
                            Manage Club
                          </Link>
                        )}
                        {club.status === 'pending' && (
                          <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-800 py-2 px-3 rounded-lg text-center text-sm">
                            <ClockIcon className="w-4 h-4 inline mr-1" />
                            Awaiting Approval
                          </div>
                        )}
                        {club.status === 'rejected' && (
                          <div className="flex-1 bg-red-50 border border-red-200 text-red-800 py-2 px-3 rounded-lg text-center text-sm">
                            <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />
                            Rejected
                          </div>
                        )}
                        <Link
                          to={`/clubs/${club._id}`}
                          className="flex-1 bg-white border border-gray-300 text-gray-900 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm"
                        >
                          <EyeIcon className="w-4 h-4 inline mr-1" />
                          View Details
                        </Link>
                      </div>
                      
                      {/* Event Management - Only for approved clubs */}
                      {club.status === 'approved' && (
                        <div className="flex gap-2">
                          <Link
                            to={`/create-event?clubId=${club._id}`}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg font-semibold text-center text-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <PlusIcon className="w-4 h-4 inline mr-1" />
                            Create Event
                          </Link>
                          <Link
                            to={`/club-events/${club._id}`}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg font-semibold text-center text-sm transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <CalendarIcon className="w-4 h-4 inline mr-1" />
                            View Events
                          </Link>
                        </div>
                      )}

                      {/* Delete Club Button */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmDelete(club)}
                          className="w-full bg-red-50 border border-red-200 text-red-800 py-2 px-3 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors text-center text-sm font-medium"
                        >
                          <TrashIcon className="w-4 h-4 inline mr-1" />
                          Delete Club
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            {!Array.isArray(clubs) || clubs.length === 0 ? (
              <div className="text-center py-12 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
                <UserGroupIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-3">🏛️ No clubs created yet</h3>
                <p className="text-gray-300 mb-4 max-w-md mx-auto">
                  Create a club first to receive membership applications from other students!
                </p>
                <Link
                  to="/create-club"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl text-lg"
                >
                  <PlusIcon className="w-6 h-6 mr-3" />
                  Create Your First Club
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Applications Overview */}
                <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    📨 Membership Applications Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-blue-300">
                        {clubs.reduce((sum, club) => sum + (club.memberApplications?.filter(app => app.status === 'pending').length || 0), 0)}
                      </div>
                      <div className="text-blue-200 text-sm">⏳ Pending Applications</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-300">
                        {clubs.reduce((sum, club) => sum + (club.memberApplications?.filter(app => app.status === 'approved').length || 0), 0)}
                      </div>
                      <div className="text-green-200 text-sm">✅ Approved Applications</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-purple-300">
                        {clubs.reduce((sum, club) => sum + (club.memberApplications?.length || 0), 0)}
                      </div>
                      <div className="text-purple-200 text-sm">📊 Total Applications</div>
                    </div>
                  </div>
                </div>

                {/* Applications by Club */}
                {clubs.map((club) => {
                  const pendingApplications = club.memberApplications?.filter(app => app.status === 'pending') || [];
                  const approvedApplications = club.memberApplications?.filter(app => app.status === 'approved') || [];
                  const totalApplications = club.memberApplications?.length || 0;

                  if (totalApplications === 0) return null;

                  return (
                    <div
                      key={club._id}
                      className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden"
                    >
                      {/* Club Header */}
                      <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-6 border-b border-white/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-white flex items-center mb-2">
                              🏛️ {club.name}
                              <span className="ml-3 text-sm bg-white/20 px-3 py-1 rounded-full">
                                {getStatusBadge(club.status)}
                              </span>
                            </h3>
                            <p className="text-gray-300 text-sm max-w-2xl">
                              {club.description || 'No description provided'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{totalApplications}</div>
                            <div className="text-gray-300 text-sm">Total Applications</div>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 text-center">
                            <div className="text-yellow-200 text-lg font-bold">{pendingApplications.length}</div>
                            <div className="text-yellow-300 text-xs">⏳ Pending</div>
                          </div>
                          <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3 text-center">
                            <div className="text-green-200 text-lg font-bold">{approvedApplications.length}</div>
                            <div className="text-green-300 text-xs">✅ Approved</div>
                          </div>
                          <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3 text-center">
                            <div className="text-blue-200 text-lg font-bold">{club.members?.length || 0}</div>
                            <div className="text-blue-300 text-xs">👥 Members</div>
                          </div>
                        </div>
                      </div>

                      {/* Applications List */}
                      <div className="p-6">
                        {pendingApplications.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-semibold text-yellow-200 mb-3 flex items-center">
                              ⏳ Pending Applications ({pendingApplications.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {pendingApplications.slice(0, 6).map((application, index) => (
                                <div
                                  key={index}
                                  className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 hover:bg-yellow-500/20 transition-colors"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center">
                                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold">
                                        {(application.userId?.firstName?.[0] || 'U').toUpperCase()}
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-white font-semibold text-sm">
                                          {application.userId?.firstName || 'Unknown'} {application.userId?.lastName || 'User'}
                                        </div>
                                        <div className="text-gray-400 text-xs">
                                          {application.userId?.email || 'No email'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-gray-300 text-xs mb-3">
                                    📅 Applied: {new Date(application.appliedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {/* Handle approve */}}
                                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      ✅ Approve
                                    </button>
                                    <button
                                      onClick={() => {/* Handle reject */}}
                                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors"
                                    >
                                      ❌ Reject
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {pendingApplications.length > 6 && (
                              <div className="text-center mt-4">
                                <Link
                                  to={`/manage-club/${club._id}?tab=applications`}
                                  className="inline-flex items-center text-yellow-300 hover:text-yellow-200 text-sm font-semibold"
                                >
                                  View all {pendingApplications.length} pending applications →
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {approvedApplications.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-green-200 mb-3 flex items-center">
                              ✅ Recent Approved Members ({approvedApplications.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {approvedApplications.slice(0, 8).map((application, index) => (
                                <div
                                  key={index}
                                  className="bg-green-500/10 border border-green-400/30 rounded-lg p-3 text-center"
                                >
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto mb-2">
                                    {(application.userId?.firstName?.[0] || 'U').toUpperCase()}
                                  </div>
                                  <div className="text-white text-sm font-semibold">
                                    {application.userId?.firstName || 'Unknown'}
                                  </div>
                                  <div className="text-green-300 text-xs">
                                    Member since {new Date(application.approvedAt || application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {approvedApplications.length > 8 && (
                              <div className="text-center mt-3">
                                <Link
                                  to={`/manage-club/${club._id}?tab=members`}
                                  className="inline-flex items-center text-green-300 hover:text-green-200 text-sm font-semibold"
                                >
                                  View all {approvedApplications.length} members →
                                </Link>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="mt-6 pt-4 border-t border-white/10">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              to={`/manage-club/${club._id}?tab=applications`}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-sm hover:scale-105 transition-transform"
                            >
                              <Cog6ToothIcon className="w-4 h-4 mr-2" />
                              Manage Applications
                            </Link>
                            <Link
                              to={`/clubs/${club._id}`}
                              className="flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                            >
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View Club
                            </Link>
                            {pendingApplications.length > 0 && (
                              <div className="flex items-center px-3 py-2 bg-yellow-500/20 border border-yellow-400/50 text-yellow-200 rounded-lg text-sm">
                                <ClockIcon className="w-4 h-4 mr-2" />
                                {pendingApplications.length} need attention
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* No Applications Message */}
                {clubs.every(club => (club.memberApplications?.length || 0) === 0) && (
                  <div className="text-center py-12 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20">
                    <ClockIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold text-white mb-3">📝 No applications yet</h3>
                    <p className="text-gray-300 mb-4 max-w-md mx-auto">
                      Once your clubs are approved, students will be able to apply to join them. Applications will appear here for you to review.
                    </p>
                    <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                      <h4 className="text-blue-200 font-semibold mb-2">💡 Tips to get applications:</h4>
                      <ul className="text-blue-300 text-sm text-left space-y-1">
                        <li>• Make sure your clubs are approved by admin</li>
                        <li>• Write compelling club descriptions</li>
                        <li>• Create engaging events to attract members</li>
                        <li>• Share your club with fellow students</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-md w-full">
            <div className="text-center">
              <TrashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Club</h3>
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-white">"{deleteConfirmation.name}"</span>?
              </p>
              <div className="bg-red-500/10 border border-red-400/50 rounded-lg p-3 mb-6">
                <p className="text-red-200 text-sm">
                  ⚠️ This action cannot be undone. All club data, members, and events will be permanently removed.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 bg-gray-500/20 border border-gray-400/50 text-gray-200 py-3 px-4 rounded-lg hover:bg-gray-500/30 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteClub(deleteConfirmation._id)}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 inline mr-1" />
                      Delete Club
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <Link
        to="/create-club"
        className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 hover:shadow-purple-500/25 z-50"
        title="Create New Club"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </div>
  );
};

export default MyClubs;
