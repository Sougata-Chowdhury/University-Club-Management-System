import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CreateEvent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get clubId from URL params if coming from MyClubs
  const urlParams = new URLSearchParams(location.search);
  const preselectedClubId = urlParams.get('clubId');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    clubId: preselectedClubId || '',
    maxAttendees: '',
    isPaid: false,
    price: '',
    currency: 'BDT'
  });
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserClubs();
  }, []);

  const fetchUserClubs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/clubs/my-clubs`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClubs(response.data.createdClubs || []);
    } catch (error) {
      setError('Failed to fetch your clubs');
    }
  };

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

    // Additional validation: check if the selected date is in the future
    const selectedDate = new Date(formData.date);
    const now = new Date();
    if (selectedDate <= now) {
      setError('Event date must be in the future. Please select a valid date and time.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        price: formData.isPaid ? parseFloat(formData.price) : undefined
      };

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/events`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Show success message and navigate with success state
      alert('✅ Event created successfully!');
      navigate('/my-events', { 
        state: { 
          message: 'Event created successfully!', 
          type: 'success',
          newEventId: response.data._id 
        } 
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date();
  const minDate = today.toISOString().slice(0, 16);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-white text-xl font-bold">
              University Clubs
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/my-events" className="text-white hover:text-gray-300 transition-colors">
                My Events
              </Link>
              <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">🎉 Create New Event</h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">Plan an amazing event for your club members</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6 text-red-200 text-center">
            {error}
          </div>
        )}

        {clubs.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <InformationCircleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-4">No Clubs Found</h3>
            <p className="text-gray-300 mb-6">You need to create a club before you can create events.</p>
            <Link
              to="/create-club"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              Create a Club First
            </Link>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Club Selection */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  🏛️ Select Club
                </label>
                <select
                  name="clubId"
                  value={formData.clubId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="" className="bg-gray-800">Select a club...</option>
                  {clubs.map((club) => (
                    <option key={club._id} value={club._id} className="bg-gray-800">
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Name */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  ✨ Event Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Amazing Club Event"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  📝 Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="Describe what makes this event special..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  📅 Date & Time
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={minDate}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-yellow-300 flex items-center">
                  <InformationCircleIcon className="w-4 h-4 mr-1" />
                  Event must be scheduled for a future date and time
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  📍 Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Main Auditorium, Building A"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Max Attendees */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  👥 Maximum Attendees (Optional)
                </label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min="1"
                  placeholder="100"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Payment Options */}
              <div className="border border-white/20 rounded-xl p-6 bg-white/5">
                <h3 className="text-white text-lg font-semibold mb-4">💰 Payment Settings</h3>
                
                {/* Free/Paid Toggle */}
                <div className="mb-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({
                        ...formData,
                        isPaid: e.target.checked,
                        price: e.target.checked ? formData.price : '',
                        currency: e.target.checked ? formData.currency : 'BDT'
                      })}
                      className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-white font-medium">This is a paid event</span>
                  </label>
                  <p className="text-gray-300 text-sm mt-1">
                    {formData.isPaid ? 'Attendees will need to pay to register' : 'Event is free to attend'}
                  </p>
                </div>

                {/* Price and Currency (only show if paid) */}
                {formData.isPaid && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">
                        💵 Price
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required={formData.isPaid}
                        placeholder="25.00"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-semibold mb-2">
                        🌍 Currency
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        required={formData.isPaid}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="BDT" className="bg-gray-800">BDT (৳) - Bangladeshi Taka</option>
                        <option value="USD" className="bg-gray-800">USD ($)</option>
                        <option value="EUR" className="bg-gray-800">EUR (€)</option>
                        <option value="GBP" className="bg-gray-800">GBP (£)</option>
                        <option value="INR" className="bg-gray-800">INR (₹)</option>
                        <option value="PKR" className="bg-gray-800">PKR (Rs)</option>
                        <option value="CAD" className="bg-gray-800">CAD (C$)</option>
                        <option value="AUD" className="bg-gray-800">AUD (A$)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link
                  to="/my-events"
                  className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : '🎉 Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEvent;
