import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, CheckIcon, XMarkIcon, CameraIcon, UserCircleIcon, AcademicCapIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import { useTheme } from '../contexts/ThemeContext';

const UserProfile = () => {
  const { getThemeClasses, getCardClasses, getInputClasses, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    department: '',
    year: '',
    studentId: ''
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserProfile();
      setUser(userData);
      setFormData({
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        bio: userData?.bio || '',
        department: userData?.department || '',
        year: userData?.year || '',
        studentId: userData?.studentId || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await userService.updateUserProfile(formData);
      setUser({ ...user, ...formData });
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      department: user?.department || '',
      year: user?.year || '',
      studentId: user?.studentId || ''
    });
    setError('');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const updatedUser = await userService.uploadProfilePicture(formData);
      setUser(updatedUser);
      setSuccess('Profile picture updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${getThemeClasses()} flex items-center justify-center`}>
        <div className={`${getCardClasses()} rounded-2xl p-8 shadow-xl`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={getThemeClasses()}>
      {/* Header with Navigation */}
      <div className={`${getCardClasses()} border-b ${isDark ? 'border-gray-700' : 'border-purple-200'} sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className={`${getCardClasses()} rounded-3xl shadow-xl border overflow-hidden`}>
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-12">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center space-x-6">
              {/* Profile Picture */}
              <div className="relative group">
                <div className={`w-24 h-24 ${isDark ? 'bg-gray-700/50' : 'bg-white/20'} rounded-full flex items-center justify-center backdrop-blur-sm border-2 ${isDark ? 'border-gray-600' : 'border-white/30'} overflow-hidden`}>
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:8000${user.profilePicture}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  {!user?.profilePicture && (
                    <UserCircleIcon className="w-16 h-16 text-white" />
                  )}
                  {user?.profilePicture && (
                    <UserCircleIcon 
                      className="w-16 h-16 text-white hidden" 
                      style={{ display: 'none' }}
                    />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 group-hover:scale-110 transform cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <CameraIcon className="w-4 h-4 text-purple-600" />
                  )}
                </label>
                {uploading && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded whitespace-nowrap">
                    Uploading...
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User Profile'}
                </h2>
                <p className="text-purple-100 text-lg">
                  {user?.email || 'user@example.com'}
                </p>
                {user?.department && (
                  <p className="text-purple-200 mt-1">
                    {user.department} • Year {user.year || 'N/A'}
                  </p>
                )}
              </div>

              {/* Edit Button */}
              <div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:scale-105"
                  >
                    <PencilIcon className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
                    >
                      <CheckIcon className="w-5 h-5" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors duration-200"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold flex items-center space-x-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  <UserCircleIcon className="w-6 h-6 text-purple-600" />
                  <span>Personal Information</span>
                </h3>

                <div className="space-y-4">
                  {/* First Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      First Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.firstName || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.lastName || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                        placeholder="Enter your email"
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.email || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`text-sm font-medium mb-2 flex items-center space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <PhoneIcon className="w-4 h-4 text-purple-600" />
                      <span>Phone Number</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.phone || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold flex items-center space-x-2 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                  <span>Academic Information</span>
                </h3>

                <div className="space-y-4">
                  {/* Student ID */}
                  <div>
                    <label className={`text-sm font-medium mb-2 flex items-center space-x-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <IdentificationIcon className="w-4 h-4 text-purple-600" />
                      <span>Student ID</span>
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="studentId"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                        placeholder="Enter your student ID"
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.studentId || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Department
                    </label>
                    {isEditing ? (
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Business">Business</option>
                        <option value="Arts">Arts</option>
                        <option value="Science">Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.department || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Year of Study
                    </label>
                    {isEditing ? (
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${getInputClasses()}`}
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    ) : (
                      <div className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                        {user?.year ? `${user.year}${user.year === 'Graduate' ? '' : getOrdinalSuffix(user.year)} Year` : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-8">
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>About Me</h3>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none ${getInputClasses()}`}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className={`px-6 py-4 rounded-xl border min-h-[100px] ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                  {user?.bio || 'No bio provided yet. Click "Edit Profile" to add one!'}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {!isEditing && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="text-2xl font-bold">{user?.stats?.clubsJoined || 0}</div>
                  <div className="text-purple-100">Clubs Joined</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="text-2xl font-bold">{user?.stats?.eventsHosted || 0}</div>
                  <div className="text-blue-100">Events Hosted</div>
                </div>
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="text-2xl font-bold">{user?.stats?.leadershipRoles || 0}</div>
                  <div className="text-indigo-100">Leadership Roles</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for ordinal suffixes
const getOrdinalSuffix = (num) => {
  const numStr = num.toString();
  const lastDigit = numStr[numStr.length - 1];
  const secondLastDigit = numStr[numStr.length - 2];
  
  if (secondLastDigit === '1') {
    return 'th';
  }
  
  switch (lastDigit) {
    case '1': return 'st';
    case '2': return 'nd';
    case '3': return 'rd';
    default: return 'th';
  }
};

export default UserProfile;
