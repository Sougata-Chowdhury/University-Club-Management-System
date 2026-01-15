import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  SparklesIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { eventService } from '../services/eventService';
import { clubService } from '../services/clubService';
import axios from 'axios';

const ClubEvents = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registering, setRegistering] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchClubEvents();
    fetchClubDetails();
    fetchUserInfo();
  }, [clubId]);

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

  const fetchClubEvents = async () => {
    try {
      const eventsData = await eventService.getEventsByClub(clubId);
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Failed to fetch club events:', error);
      setError('Failed to fetch club events');
    } finally {
      setLoading(false);
    }
  };

  const fetchClubDetails = async () => {
    try {
      const clubData = await clubService.getClubById(clubId);
      setClub(clubData);
    } catch (error) {
      console.error('Failed to fetch club details:', error);
      setError('Failed to fetch club details');
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
        setSuccessMessage('Successfully registered for event!');
      } else {
        const response = await eventService.leaveEvent(eventId);
        console.log('Unregistration successful:', response);
        setSuccessMessage('Successfully unregistered from event!');
      }

      // Refresh events to get updated attendee lists
      await fetchClubEvents();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} event`;
      setError(errorMessage);
      
      // If already registered error, still refresh to sync UI
      if (errorMessage.includes('already registered')) {
        await fetchClubEvents();
      }
    } finally {
      setRegistering(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await eventService.deleteEvent(eventId);
      setEvents(events.filter(event => event._id !== eventId));
      setSuccessMessage('Event deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Failed to delete event');
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

  const isClubOwner = () => {
    return user && club && (club.createdBy === user._id || club.createdBy._id === user._id);
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
        <div className="text-white text-xl">Loading club events...</div>
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
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-1" />
                Back
              </button>
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
            <h1 className="text-4xl font-bold text-white">
              {club ? `🎉 ${club.name} Events` : '🎉 Club Events'}
            </h1>
            <SparklesIcon className="w-8 h-8 text-yellow-400 ml-3" />
          </div>
          
          {club && (
            <div className="max-w-2xl mx-auto mb-6">
              <p className="text-xl text-gray-300 mb-4">{club.description}</p>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center text-blue-200">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {club.members?.length || 0} member{(club.members?.length || 0) !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center text-green-200">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </div>
                <div className="text-purple-200">
                  📅 {club.category}
                </div>
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

          {/* Create Event Button for Club Owners */}
          {isClubOwner() && (
            <Link
              to={`/create-event?clubId=${clubId}`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl mb-6"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Event for {club?.name}
            </Link>
          )}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-24 h-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">No Events Yet</h3>
            <p className="text-gray-300 mb-6">
              {isClubOwner() 
                ? 'Create the first event for your club!' 
                : 'This club hasn\'t created any events yet. Check back later!'
              }
            </p>
            {isClubOwner() && (
              <Link
                to={`/create-event?clubId=${clubId}`}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <PlusIcon className="w-6 h-6 mr-3" />
                Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventStatus = getEventStatus(event.date);
              const isRegistered = isUserRegistered(event);
              const isFull = isEventFull(event);
              const isPastEvent = eventStatus.status === 'past';
              
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
                    {event.isPaid && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-500/20 border border-yellow-400/50 text-yellow-200">
                        <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                        {event.currency} {event.price}
                      </span>
                    )}
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
                        {isFull && <span className="ml-2 text-red-300">(Full)</span>}
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
                    
                    {isClubOwner() && (
                      <>
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
                      </>
                    )}
                    
                    {/* Registration Button for Non-owners */}
                    {!isClubOwner() && !isPastEvent && (
                      <div className="w-full mt-2">
                        {isRegistered ? (
                          <button
                            onClick={() => handleEventRegistration(event._id, 'leave')}
                            disabled={registering[event._id]}
                            className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                          >
                            {registering[event._id] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-200 mr-2"></div>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Cancel Registration
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEventRegistration(event._id, 'join')}
                            disabled={registering[event._id] || isFull}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 ${
                              isFull 
                                ? 'bg-gray-500/20 text-gray-400' 
                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-200'
                            }`}
                          >
                            {registering[event._id] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-200 mr-2"></div>
                                Registering...
                              </>
                            ) : isFull ? (
                              <>
                                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                Event Full
                              </>
                            ) : (
                              <>
                                <UserPlusIcon className="w-4 h-4 mr-1" />
                                Register
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubEvents;
