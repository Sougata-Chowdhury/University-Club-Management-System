import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  SparklesIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    maxAttendees: ''
  });
  const [originalEvent, setOriginalEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/events/${id}`);
      const event = response.data;
      setOriginalEvent(event);
      
      // Format date for datetime-local input
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toISOString().slice(0, 16);
      
      setFormData({
        name: event.name,
        description: event.description,
        date: formattedDate,
        location: event.location,
        maxAttendees: event.maxAttendees || ''
      });
      setFetchLoading(false);
    } catch (error) {
      setError('Failed to fetch event details');
      setFetchLoading(false);
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
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined
      };

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/events/${id}`,
        eventData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate(`/events/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date();
  const minDate = today.toISOString().slice(0, 16);

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading event...</div>
      </div>
    );
  }

  if (error && !originalEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">{error}</div>
          <Link
            to="/my-events"
            className="inline-flex items-center px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

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
        {/* Back Button */}
        <Link
          to={`/events/${id}`}
          className="inline-flex items-center text-white hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Event Details
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">✏️ Edit Event</h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300">Update your event details</p>
          {originalEvent && (
            <p className="text-gray-400 mt-2">
              Editing: <span className="text-white font-medium">{originalEvent.name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6 text-red-200 text-center">
            {error}
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Leave empty for unlimited"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {originalEvent && originalEvent.attendees && originalEvent.attendees.length > 0 && (
                <p className="text-yellow-200 text-sm mt-2">
                  ⚠️ Currently {originalEvent.attendees.length} people are registered. 
                  Setting a limit below this number will not remove existing attendees.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Link
                to={`/events/${id}`}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : '💾 Update Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
