import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PhotoIcon, TagIcon, MapPinIcon, CalendarIcon, UsersIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const CreateClub = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    meetingTime: '',
    tags: '',
    requirements: '',
    maxMembers: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Academic', 'Sports', 'Arts', 'Technology', 'Cultural', 'Social', 'Professional', 'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const clubData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : undefined
      };

      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/clubs`,
        clubData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Club created successfully! It will be pending admin approval.');
      navigate('/my-clubs');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

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
              <Link to="/dashboard" className="text-white hover:text-purple-100 transition-colors">
                Dashboard
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
                className="bg-purple-500 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <CogIcon className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <PlusIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Club</h1>
          <p className="text-xl text-gray-600">Start your own university club and build a community</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Name */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Club Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your club name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your club's purpose, activities, and goals"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Category *
                </label>
                <div className="relative">
                  <TagIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                  >
                    <option value="" className="bg-white">Select category</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-white">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Meeting location"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Meeting Time and Max Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Meeting Time
                </label>
                <div className="relative">
                  <CalendarIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    name="meetingTime"
                    value={formData.meetingTime}
                    onChange={handleChange}
                    placeholder="e.g., Wednesdays 6:00 PM"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Max Members
                </label>
                <div className="relative">
                  <UsersIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="number"
                    name="maxMembers"
                    value={formData.maxMembers}
                    onChange={handleChange}
                    placeholder="Leave empty for unlimited"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Tags
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas (e.g., programming, web development, coding)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <p className="text-gray-600 text-sm mt-1">Separate multiple tags with commas</p>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Membership Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                placeholder="Any specific requirements or qualifications for joining (optional)"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Submission Notice */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-purple-900">
                    Admin Approval Required
                  </h3>
                  <p className="mt-1 text-sm text-purple-700">
                    Your club will be pending approval after submission. An admin will review and approve it before it becomes visible to other students.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="flex-1 px-6 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateClub;
