import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  EnvelopeIcon,
  CalendarIcon,
  MapPinIcon,
  CogIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { authService } from '../services/authService';
import axios from 'axios';

const ManageClub = () => {
  const { clubId } = useParams();
  const [club, setClub] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchClubDetails();
    fetchApplications();
  }, [clubId]);

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

  const fetchClubDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/clubs/${clubId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClub(response.data);
    } catch (error) {
      setError('Failed to fetch club details');
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/clubs/${clubId}/applications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplications(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch applications');
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, action) => {
    setActionLoading(applicationId);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${process.env.REACT_APP_BACKEND_URL}/clubs/${clubId}/applications/${applicationId}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh applications
      await fetchApplications();
      await fetchClubDetails();
      
      alert(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} application`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    // Prevent creator from removing themselves
    if (currentUser && memberId === currentUser.id) {
      alert('You cannot remove yourself as the club creator.');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setRemoveLoading(memberId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/clubs/${clubId}/members/${memberId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh club data
      await fetchClubDetails();
      
      alert('Member removed successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemoveLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading club management...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Club not found</h2>
          <Link to="/my-clubs" className="text-purple-300 hover:text-purple-200">
            Return to My Clubs
          </Link>
        </div>
      </div>
    );
  }

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const approvedApplications = applications.filter(app => app.status === 'approved');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-white text-xl font-bold">
              University Clubs
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/my-clubs" className="text-white hover:text-gray-300 transition-colors">
                My Clubs
              </Link>
              <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <CogIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Manage Club</h1>
          <h2 className="text-2xl text-purple-300 mb-4">{club.name}</h2>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Club Overview */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Club Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-2">
                {club.members?.length || 0}
              </div>
              <div className="text-gray-300">Current Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300 mb-2">
                {pendingApplications.length}
              </div>
              <div className="text-gray-300">Pending Applications</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300 mb-2">
                {club.maxMembers || '∞'}
              </div>
              <div className="text-gray-300">Max Members</div>
            </div>
            <div className="text-center">
              <Link 
                to={`/clubs/${clubId}/manage-payments`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors inline-flex items-center justify-center space-x-2"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                <span>Manage Payments</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Club Details */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Club Details</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-semibold mb-2">Description</h4>
              <p className="text-gray-300">{club.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Category</h4>
                <span className="px-3 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full text-purple-200 text-sm">
                  {club.category}
                </span>
              </div>
              
              {club.location && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Location</h4>
                  <div className="flex items-center text-gray-300">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {club.location}
                  </div>
                </div>
              )}
              
              {club.meetingTime && (
                <div>
                  <h4 className="text-white font-semibold mb-2">Meeting Time</h4>
                  <div className="flex items-center text-gray-300">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {club.meetingTime}
                  </div>
                </div>
              )}
            </div>

            {club.tags && club.tags.length > 0 && (
              <div>
                <h4 className="text-white font-semibold mb-2">Tags</h4>
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
        </div>

        {/* Pending Applications */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6">
            Pending Applications ({pendingApplications.length})
          </h3>
          
          {pendingApplications.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <div
                  key={application._id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">
                        {application.userId ? 
                          `${application.userId.firstName} ${application.userId.lastName}` : 
                          'Unknown User'
                        }
                      </h4>
                      <div className="flex items-center text-gray-300 text-sm mt-1">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        {application.userId?.email || 'No email available'}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Applied: {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApplicationAction(application._id, 'approve')}
                        disabled={actionLoading === application._id}
                        className="flex items-center px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        {actionLoading === application._id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleApplicationAction(application._id, 'reject')}
                        disabled={actionLoading === application._id}
                        className="flex items-center px-4 py-2 bg-red-500/20 border border-red-400/50 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="w-4 h-4 mr-1" />
                        {actionLoading === application._id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Members */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-6">
            Current Members ({club.members?.length || 0})
          </h3>
          
          {!club.members || club.members.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No approved members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {club.members.map((member) => (
                <div
                  key={member._id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <h4 className="text-white font-semibold mb-1">
                    {member.firstName && member.lastName ? 
                      `${member.firstName} ${member.lastName}` : 
                      'Unknown User'
                    }
                  </h4>
                  <div className="flex items-center text-gray-300 text-sm mb-2">
                    <EnvelopeIcon className="w-4 h-4 mr-1" />
                    {member.email || 'No email available'}
                  </div>
                  <div className="text-gray-400 text-sm mb-3">
                    Member since: {new Date(member.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                  {currentUser && member._id !== currentUser.id ? (
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={removeLoading === member._id}
                      className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-200 px-3 py-2 rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
                    >
                      {removeLoading === member._id ? 'Removing...' : 'Remove Member'}
                    </button>
                  ) : (
                    <div className="w-full bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 py-2 rounded-lg text-sm text-center">
                      Club Creator
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageClub;
