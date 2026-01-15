import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { eventService } from '../services/eventService';

const MyEvents = () => {
  const location = useLocation();
  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('created'); // 'created' or 'registered'
  const [registering, setRegistering] = useState({});
  const navigate = useNavigate();
  
  // Get clubId from URL params if filtering by specific club
  const urlParams = new URLSearchParams(location.search);
  const filterClubId = urlParams.get('clubId');

  useEffect(() => {
    fetchData();
    
    // Handle success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
      // Clear the navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [createdEventsResponse, registeredEventsData, clubsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/events/my-events`, { headers }),
        eventService.getRegisteredEvents(),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/clubs/my-clubs`, { headers })
      ]);

      console.log('Created events fetched:', createdEventsResponse.data);
      console.log('Registered events fetched:', registeredEventsData);
      console.log('Clubs fetched:', clubsResponse.data.createdClubs);

      setCreatedEvents(createdEventsResponse.data || []);
      setRegisteredEvents(registeredEventsData || []);
      setClubs(clubsResponse.data.createdClubs || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to fetch events');
      setLoading(false);
    }
  };

  const handleEventRegistration = async (eventId, action) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to register for events');
      return;
    }

    setRegistering(prev => ({ ...prev, [eventId]: true }));
    setError('');

    try {
      if (action === 'join') {
        const response = await eventService.joinEvent(eventId);
        console.log('Registration successful:', response);
      } else {
        const response = await eventService.leaveEvent(eventId);
        console.log('Unregistration successful:', response);
      }

      // Refresh data to get updated attendee lists
      await fetchData();
      
      // Show success message
      setSuccessMessage(action === 'join' ? 'Successfully registered for event!' : 'Successfully cancelled registration!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error(`Failed to ${action} event:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} event`;
      setError(errorMessage);
      
      // If already registered error, still refresh to sync UI
      if (errorMessage.includes('already registered')) {
        await fetchData();
      }
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCreatedEvents(createdEvents.filter(event => event._id !== eventId));
    } catch (error) {
      setError('Failed to delete event');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (eventDate) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    
    if (eventDateTime < now) {
      return { status: 'past', color: 'gray', text: 'Past Event' };
    } else if (eventDateTime <= new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      return { status: 'today', color: 'green', text: 'Today/Tomorrow' };
    } else {
      return { status: 'upcoming', color: 'blue', text: 'Upcoming' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading your events...</div>
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
          <div className="flex items-center justify-center mb-4">
            <SparklesIcon className="w-8 h-8 text-yellow-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">🎉 My Events</h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          <p className="text-xl text-gray-300 mb-6">
            {filterClubId 
              ? `Events for ${[...createdEvents, ...registeredEvents].find(e => e.clubId?._id === filterClubId)?.clubId?.name || 'Selected Club'}`
              : 'Manage events for your clubs'
            }
          </p>
          
          {/* Filter indicator */}
          {filterClubId && (
            <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-3 mb-6 max-w-md mx-auto">
              <div className="text-yellow-200 text-sm text-center">
                🔍 Showing events for specific club - <Link to="/my-events" className="underline hover:text-yellow-100">View all events</Link>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4 mb-6 max-w-md mx-auto animate-pulse">
              <div className="flex items-center justify-center text-green-200">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {successMessage}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-red-200 text-center">{error}</p>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3">
              <div className="text-green-200 text-lg font-bold">
                {createdEvents.filter(event => getEventStatus(event.date).status === 'upcoming').length}
              </div>
              <div className="text-green-300 text-sm">🚀 Created Events</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
              <div className="text-blue-200 text-lg font-bold">
                {registeredEvents.filter(event => getEventStatus(event.date).status === 'upcoming').length}
              </div>
              <div className="text-blue-300 text-sm">🎫 Registered For</div>
            </div>
            <div className="bg-orange-500/20 border border-orange-400/50 rounded-lg p-3">
              <div className="text-orange-200 text-lg font-bold">
                {createdEvents.reduce((sum, event) => sum + (event.attendees?.length || 0), 0)}
              </div>
              <div className="text-orange-300 text-sm">👥 Total Attendees</div>
            </div>
            <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-3">
              <div className="text-purple-200 text-lg font-bold">{clubs.length}</div>
              <div className="text-purple-300 text-sm">🏛️ Your Clubs</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('created')}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'created'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  Created Events ({createdEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('registered')}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === 'registered'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Registered Events ({registeredEvents.length})
                </button>
              </div>
            </div>
          </div>

          {/* Create Event Button */}
          {clubs.length > 0 && (
            <Link
              to="/create-event"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Event
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 mb-6 text-red-200 text-center">
            {error}
          </div>
        )}

        {/* Events Grid */}
        {activeTab === 'created' ? (
          createdEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-24 h-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">No Created Events Yet</h3>
              <p className="text-gray-300 mb-6">Create your first event to get started!</p>
              {clubs.length > 0 ? (
                <Link
                  to="/create-event"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  <PlusIcon className="w-6 h-6 mr-3" />
                  Create Your First Event
                </Link>
              ) : (
                <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-200 text-sm">
                    💡 You need to create a club first before you can create events
                  </p>
                  <Link
                    to="/create-club"
                    className="inline-block mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Create a Club
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdEvents
                .filter(event => !filterClubId || event.clubId?._id === filterClubId)
                .map((event) => {
                const eventStatus = getEventStatus(event.date);
                return (
                  <div
                    key={event._id}
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border transform transition-all duration-300 hover:scale-105 border-${eventStatus.color}-400/50 shadow-${eventStatus.color}-500/20 shadow-lg`}
                  >
                    {/* Event Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-${eventStatus.color}-500/20 border border-${eventStatus.color}-400/50 text-${eventStatus.color}-200`}>
                        {eventStatus.text}
                      </span>
                      <span className="text-gray-300 text-sm bg-white/10 px-2 py-1 rounded-lg">
                        🏛️ {event.clubId?.name}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-blue-200">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center text-green-200">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-purple-200">
                          <UserGroupIcon className="w-4 h-4 mr-2" />
                          {event.attendees?.length || 0} attendee{(event.attendees?.length || 0) !== 1 ? 's' : ''}
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/events/${event._id}`}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View
                      </Link>
                      <Link
                        to={`/events/${event._id}/edit`}
                        className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // Registered Events Tab
          registeredEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-24 h-24 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">No Registered Events</h3>
              <p className="text-gray-300 mb-6">Browse events and register for some exciting activities!</p>
              <Link
                to="/browse-events"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <SparklesIcon className="w-6 h-6 mr-3" />
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map((event) => {
                const eventStatus = getEventStatus(event.date);
                return (
                  <div
                    key={event._id}
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl p-6 border transform transition-all duration-300 hover:scale-105 border-${eventStatus.color}-400/50 shadow-${eventStatus.color}-500/20 shadow-lg`}
                  >
                    {/* Event Status Badge */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-${eventStatus.color}-500/20 border border-${eventStatus.color}-400/50 text-${eventStatus.color}-200`}>
                        {eventStatus.text}
                      </span>
                      <span className="text-gray-300 text-sm bg-green-500/20 px-2 py-1 rounded-lg border border-green-400/30">
                        ✅ Registered
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-blue-200">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(event.date)}
                        </div>
                        <div className="flex items-center text-green-200">
                          <MapPinIcon className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-purple-200">
                          <UserGroupIcon className="w-4 h-4 mr-2" />
                          {event.attendees?.length || 0} attendee{(event.attendees?.length || 0) !== 1 ? 's' : ''}
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </div>
                        <div className="flex items-center text-orange-200">
                          <span className="w-4 h-4 mr-2">🏛️</span>
                          {event.clubId?.name}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/events/${event._id}`}
                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                      {eventStatus.status !== 'past' && (
                        <button
                          onClick={() => handleEventRegistration(event._id, 'leave')}
                          disabled={registering[event._id]}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                          {registering[event._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-200 mr-1"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <TrashIcon className="w-4 h-4 mr-1" />
                              Cancel
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MyEvents;
