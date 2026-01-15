import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, FunnelIcon, UserGroupIcon, CalendarIcon, MapPinIcon, UserIcon, CogIcon } from '@heroicons/react/24/outline';
import { clubService } from '../services/clubService';

const BrowseClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [filteredClubs, setFilteredClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categories = [
    'all', 'Academic', 'Sports', 'Arts', 'Technology', 'Cultural', 'Social', 'Professional', 'Other'
  ];

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubs, searchTerm, selectedCategory]);

  const fetchClubs = async () => {
    try {
      const data = await clubService.getAllClubs();
      setClubs(data);
      setLoading(false);
    } catch (error) {
      setError(error.message || 'Failed to fetch clubs');
      setLoading(false);
    }
  };

  const filterClubs = () => {
    let filtered = clubs;

    if (searchTerm) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(club => club.category === selectedCategory);
    }

    setFilteredClubs(filtered);
  };

  const handleJoinClub = async (clubId) => {
    try {
      await clubService.applyToJoinClub(clubId);
      alert('Application submitted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to apply');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading clubs...</div>
      </div>
    );
  }

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
              <Link 
                to="/profile" 
                className="text-white hover:text-gray-300 transition-colors flex items-center space-x-1"
              >
                <UserIcon className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link 
                to="/settings" 
                className="text-white hover:text-gray-300 transition-colors flex items-center space-x-1"
              >
                <CogIcon className="h-4 w-4" />
                <span>Settings</span>
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
          <h1 className="text-4xl font-bold text-white mb-4">Discover University Clubs</h1>
          <p className="text-xl text-gray-300">Find and join clubs that match your interests</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clubs, descriptions, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-10 pr-8 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
              >
                {categories.map(category => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div
              key={club._id}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transform transition-all duration-300 hover:scale-105 hover:bg-white/15"
            >
              {/* Club Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full text-purple-200 text-sm">
                    {club.category}
                  </span>
                  <div className="flex items-center text-gray-300 text-sm">
                    <UserGroupIcon className="w-4 h-4 mr-1" />
                    {club.members?.length || 0} members
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{club.name}</h3>
                <p className="text-gray-300 text-sm line-clamp-3">{club.description}</p>
              </div>

              {/* Club Details */}
              <div className="space-y-2 mb-4">
                {club.meetingTime && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {club.meetingTime}
                  </div>
                )}
                {club.location && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    {club.location}
                  </div>
                )}
              </div>

              {/* Tags */}
              {club.tags && club.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {club.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded text-blue-200 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {club.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-500/20 border border-gray-400/30 rounded text-gray-300 text-xs">
                      +{club.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleJoinClub(club._id)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-4 rounded-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Apply to Join
                </button>
                <Link
                  to={`/clubs/${club._id}`}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredClubs.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No clubs found</h3>
            <p className="text-gray-300">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseClubs;
