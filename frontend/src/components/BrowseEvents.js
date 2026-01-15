import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  FireIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  UserPlusIcon,
  UserMinusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { eventService } from '../services/eventService';
import ReportButton from './ReportButton';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed
  const [registering, setRegistering] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/events/browse`);
      setEvents(response.data);
    } catch (error) {
      setError('Failed to fetch events');
    } finally {
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

      // Refresh events to get updated attendee count
      await fetchEvents();
      
    } catch (error) {
      console.error(`Failed to ${action} event:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} event`;
      setError(errorMessage);
      
      // If already registered error, still refresh to sync UI
      if (errorMessage.includes('already registered')) {
        await fetchEvents();
      }
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const isUserRegistered = (event) => {
    if (!user || !event.attendees) return false;
    
    const userId = user._id || user.id;
    return event.attendees.some(attendee => {
      const attendeeId = typeof attendee === 'string' ? attendee : (attendee._id || attendee.id);
      return attendeeId === userId;
    });
  };

  const isEventFull = (event) => {
    return event.maxAttendees > 0 && event.attendees?.length >= event.maxAttendees;
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'upcoming') return event.status === 'upcoming';
    if (filter === 'completed') return event.status === 'completed';
    return true;
  });

  const getStatusBadge = (status, timeUntil) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-500/20 border border-gray-400/30 text-gray-300">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Completed
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 animate-pulse">
        <SparklesIcon className="w-4 h-4 mr-1" />
        {timeUntil}
      </span>
    );
  };

  const getEventCardStyle = (status) => {
    if (status === 'completed') {
      return "bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 opacity-75 hover:opacity-90 transition-all duration-300";
    }
    
    return "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-purple-400/50 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="text-white text-xl font-bold flex items-center">
              <FireIcon className="w-8 h-8 mr-2 text-purple-300" />
              University Events
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/browse-clubs" className="text-white hover:text-purple-300 transition-colors">
                Browse Clubs
              </Link>
              <Link to="/my-clubs" className="text-white hover:text-purple-300 transition-colors">
                My Clubs
              </Link>
              <Link to="/my-events" className="text-white hover:text-purple-300 transition-colors">
                My Events
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join exciting events happening across campus. From workshops to social gatherings, 
            find your next adventure here.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Events', icon: CalendarIcon },
                { key: 'upcoming', label: 'Upcoming', icon: SparklesIcon },
                { key: 'completed', label: 'Completed', icon: CheckCircleIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    filter === key
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Events Found</h3>
            <p className="text-gray-300">
              {filter === 'all' 
                ? 'No events are currently available.' 
                : `No ${filter} events found.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div key={event._id} className={getEventCardStyle(event.status)}>
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(event.status, event.timeUntil)}
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {event.clubId?.name || 'Unknown Club'}
                    </p>
                  </div>
                </div>

                {/* Event Title */}
                <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
                  {event.name}
                </h3>

                {/* Event Description */}
                <p className="text-gray-300 mb-4 line-clamp-3">
                  {event.description}
                </p>

                {/* Event Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-300">
                    <CalendarIcon className="w-5 h-5 mr-3 text-purple-400" />
                    <span>{new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-300">
                    <ClockIcon className="w-5 h-5 mr-3 text-purple-400" />
                    <span>{new Date(event.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center text-gray-300">
                      <MapPinIcon className="w-5 h-5 mr-3 text-purple-400" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-3 text-purple-400" />
                      <span>{event.attendees?.length || 0} attending</span>
                    </div>
                    {event.maxAttendees > 0 && (
                      <span className={`text-sm ${isEventFull(event) ? 'text-red-400' : 'text-gray-400'}`}>
                        / {event.maxAttendees} max
                        {isEventFull(event) && (
                          <span className="ml-2 text-red-400">
                            <ExclamationTriangleIcon className="w-4 h-4 inline" />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Registration Button */}
                  {user && event.status === 'upcoming' && (
                    <div>
                      {isUserRegistered(event) ? (
                        <button
                          onClick={() => handleEventRegistration(event._id, 'leave')}
                          disabled={registering[event._id]}
                          className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transform hover:scale-105 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {registering[event._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <UserMinusIcon className="w-5 h-5 mr-2" />
                              Cancel Registration
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEventRegistration(event._id, 'join')}
                          disabled={registering[event._id] || isEventFull(event)}
                          className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            isEventFull(event)
                              ? 'bg-gray-600/50 text-gray-300 cursor-not-allowed'
                              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg hover:shadow-green-500/25'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {registering[event._id] ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Registering...
                            </>
                          ) : isEventFull(event) ? (
                            <>
                              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                              Event Full
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="w-5 h-5 mr-2" />
                              Register for Event
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Past Event Message */}
                  {event.status === 'completed' && (
                    <div className="w-full px-6 py-3 rounded-xl bg-gray-600/30 border border-gray-500/50 text-gray-300 text-center">
                      <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                      Event Has Ended
                    </div>
                  )}

                  {/* View Details Button */}
                  <Link
                    to={`/events/${event._id}`}
                    className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      event.status === 'completed'
                        ? 'bg-gray-600/50 text-gray-300'
                        : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-purple-400/50'
                    }`}
                  >
                    View Details
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Floating Report Button for General Issues */}
        <ReportButton
          reportType="event"
          reportTargetId=""
          reportTargetInfo={{ 
            title: "General Event System Report",
            description: "Report issues with the event browsing system or inappropriate content"
          }}
          variant="floating"
          tooltip="Report an issue with the event system"
          showPulse={false}
        />
      </div>
    </div>
  );
};

export default BrowseEvents;
