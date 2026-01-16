import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  UserGroupIcon, 
  CalendarIcon,
  TagIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  TrashIcon,
  Cog6ToothIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';
import ReportButton from './ReportButton';
import FeedbackButton from './feedback/FeedbackButton';

const ClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClubDetails();
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getCurrentUser = async () => {
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

  const fetchClubDetails = async () => {
    try {
      const data = await clubService.getClubById(id);
      setClub(data);
      
      // Check if current user has applied
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const user = userResponse.data;
          const userId = user._id || user.id;
          const application = data.memberApplications?.find(
            app => {
              const appUserId = typeof app.userId === 'string' ? app.userId : (app.userId._id || app.userId.id);
              return String(appUserId) === String(userId);
            }
          );
          if (application) {
            setApplicationStatus(application.status);
          }
        } catch (userErr) {
          console.error('Failed to fetch user:', userErr);
        }
      }
    } catch (error) {
      setError('Failed to fetch club details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJoin = async () => {
    setIsApplying(true);
    setError(''); // Clear any previous errors
    try {
      const response = await clubService.applyToJoinClub(id);
      setApplicationStatus('pending');
      fetchClubDetails(); // Refresh club data
      // Show success message
      alert(response.message || 'Application submitted successfully!');
    } catch (error) {
      setError(error.message || 'Failed to apply to club');
      // Also show error in alert for immediate feedback
      alert(error.message || 'Failed to apply to club');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDeleteClub = async () => {
    setIsDeleting(true);
    try {
      await clubService.deleteClub(id);
      navigate('/my-clubs');
    } catch (error) {
      setError(error.message || 'Failed to delete club');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-green-50 border border-green-200 text-green-800">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            ✅ Approved & Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-yellow-50 border border-yellow-200 text-yellow-800">
            <ClockIcon className="w-5 h-5 mr-2" />
            ⏳ Pending Admin Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-red-50 border border-red-200 text-red-800">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const isClubCreator = currentUser && club && (
    club.createdBy._id === currentUser.id || club.createdBy === currentUser.id
  );

  const canApplyToJoin = currentUser && club && 
    club.status === 'approved' && 
    !isClubCreator && 
    !applicationStatus;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading club details...</div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center text-gray-900">
          <h2 className="text-2xl font-bold mb-4">Club Not Found</h2>
          <p className="mb-6 text-gray-700">{error || 'The club you are looking for does not exist.'}</p>
          <Link
            to="/browse-clubs"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Browse Clubs
          </Link>
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
            <Link to="/dashboard" className="text-white text-xl font-bold">
              University Clubs
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/browse-clubs" className="text-white hover:text-purple-100 transition-colors">
                Browse Clubs
              </Link>
              <Link to="/my-clubs" className="text-white hover:text-purple-100 transition-colors">
                My Clubs
              </Link>
              <Link 
                to="/profile" 
                className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link 
                to="/settings" 
                className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2">
              >
                <CogIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-gray-700 hover:text-purple-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Club Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold text-gray-900">🏛️ {club.name}</h1>
                  {getStatusBadge(club.status)}
                </div>
                {currentUser && !isClubCreator && (
                  <ReportButton
                    reportType="club"
                    reportTargetId={club._id}
                    reportTargetInfo={{ 
                      title: club.name,
                      description: club.description,
                      category: club.category 
                    }}
                    variant="icon"
                    size="medium"
                    tooltip="Report this club"
                  />
                )}
              </div>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {club.description || 'No description available.'}
              </p>

              {/* Club Actions for Creator */}
              {isClubCreator && (
                <div className="flex gap-3 mb-6">
                  {club.status === 'approved' && (
                    <Link
                      to={`/manage-club/${club._id}`}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                    >
                      <Cog6ToothIcon className="w-5 h-5 mr-2" />
                      Manage Club
                    </Link>
                  )}
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold hover:scale-105 transition-transform">
                  >
                    <TrashIcon className="w-5 h-5 mr-2" />
                    Delete Club
                  </button>
                </div>
              )}

              {/* Apply Button for Non-Creator */}
              {canApplyToJoin && (
                <button
                  onClick={handleApplyToJoin}
                  disabled={isApplying}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50"
                >
                  {isApplying ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Applying...
                    </div>
                  ) : (
                    <>
                      <UserGroupIcon className="w-5 h-5 mr-2" />
                      Apply to Join
                    </>
                  )}
                </button>
              )}

              {/* Application Status */}
              {applicationStatus && (
                <div className="mt-4">
                  {applicationStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800">⏳ Your application is pending approval</p>
                    </div>
                  )}
                  {applicationStatus === 'approved' && (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-green-800">🎉 You are a member of this club!</p>
                      </div>
                      <div className="flex justify-center">
                        <FeedbackButton
                          targetType="club"
                          targetId={club._id}
                          targetInfo={{
                            title: club.name,
                            description: club.description,
                            category: club.category
                          }}
                          text="Rate This Club"
                          buttonVariant="outlined"
                          sx={{ 
                            borderColor: '#667eea',
                            color: '#667eea',
                            '&:hover': {
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {applicationStatus === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800">❌ Your application was rejected</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Club Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Club Information</h3>
            <div className="space-y-4">
              <div className="flex items-center text-gray-700">
                <TagIcon className="w-5 h-5 mr-3 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-semibold">{club.category || 'General'}</div>
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <UserIcon className="w-5 h-5 mr-3 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Club Creator</div>
                  <div className="font-semibold">
                    {club.createdBy?.firstName} {club.createdBy?.lastName}
                  </div>
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <CalendarIcon className="w-5 h-5 mr-3 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Created Date</div>
                  <div className="font-semibold">
                    {new Date(club.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Club Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <UserGroupIcon className="w-5 h-5 mr-3 text-purple-600" />
                  <span>Total Members</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{club.members?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center text-gray-700">
                  <ClockIcon className="w-5 h-5 mr-3 text-purple-600" />
                  <span>Pending Applications</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {club.memberApplications?.filter(app => app.status === 'pending').length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section (if approved) */}
        {club.status === 'approved' && club.members && club.members.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Club Members</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {club.members.map((member, index) => (
                <div key={index} className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </div>
                    <div>
                      <div className="text-gray-900 font-semibold">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-gray-600 text-sm">{member.email}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/50 max-w-md w-full">
            <div className="text-center">
              <TrashIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Delete Club</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete "{club.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClub}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Club'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetails;
