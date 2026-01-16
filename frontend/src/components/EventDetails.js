import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { eventService } from '../services/eventService';
import { authService } from '../services/authService';
import { getUser } from '../utils/localStorage';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon, 
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  UserPlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ReportButton from './ReportButton';
import FeedbackButton from './feedback/FeedbackButton';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (id) {
      // Fetch user and event in sequence to ensure currentUser is available
      const loadData = async () => {
        await fetchCurrentUser();
        await fetchEventDetails();
      };
      loadData();
    }
    
    // Refresh event details when page becomes visible (e.g., after returning from payment)
    const handleVisibilityChange = async () => {
      if (!document.hidden && id) {
        console.log('Page became visible, refreshing event details');
        await fetchCurrentUser();
        await fetchEventDetails();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, user not logged in');
        setCurrentUser(null);
        return;
      }

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetched current user from API:', response.data);
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Error fetching current user:', err);
      setCurrentUser(null);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(id);
      setEvent(response);
      
      // Wait a bit to ensure currentUser state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('=== EVENT DETAILS DEBUG ===');
      console.log('Full event response:', response);
      console.log('Event attendees:', response.attendees);
      console.log('Current user from state:', currentUser);
      
      // Re-check current user from state after waiting
      setIsEnrolled(false); // Reset first
      
    } catch (err) {
      setError('Failed to fetch event details');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Separate effect to check enrollment when currentUser or event changes
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No currentUser - cannot check enrollment');
      setIsEnrolled(false);
      return;
    }

    if (!event) {
      console.log('❌ No event - cannot check enrollment');
      setIsEnrolled(false);
      return;
    }

    if (!event.attendees || !Array.isArray(event.attendees)) {
      console.log('❌ No attendees array - setting isEnrolled to false');
      setIsEnrolled(false);
      return;
    }

    console.log('\n=== 🔍 CHECKING ENROLLMENT ===');
    console.log('Current user ID:', currentUser.id);
    console.log('Current user _id:', currentUser._id);
    console.log('Event name:', event.name);
    console.log('Number of attendees:', event.attendees.length);
    console.log('Attendees array:', JSON.stringify(event.attendees, null, 2));
    
    const userId = currentUser._id || currentUser.id;
    console.log('Using user ID for comparison:', userId);
    
    if (!userId) {
      console.log('❌ Could not extract user ID');
      setIsEnrolled(false);
      return;
    }

    const isUserEnrolled = event.attendees.some(attendee => {
      // Handle both populated (object) and unpopulated (ObjectId string) attendees
      const attendeeId = typeof attendee === 'string' 
        ? attendee 
        : (attendee._id || attendee.id);
      
      const match = String(attendeeId) === String(userId);
      
      console.log('Comparing attendee:', {
        attendeeType: typeof attendee,
        attendeeId,
        userId,
        match
      });
      
      return match;
    });
    
    console.log('\n✅ Final enrollment result:', isUserEnrolled);
    console.log('=== END ENROLLMENT CHECK ===\n');
    
    setIsEnrolled(isUserEnrolled);
  }, [currentUser, event]);

  const handleEnrollment = async () => {
    console.log('handleEnrollment called', { event, currentUser, isEnrolled });
    
    // Check if user is logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Double-check enrollment directly from event data (don't rely on state)
    const userId = currentUser._id || currentUser.id;
    const isActuallyEnrolled = event.attendees?.some(attendee => {
      const attendeeId = typeof attendee === 'string' ? attendee : (attendee._id || attendee.id);
      return String(attendeeId) === String(userId);
    });
    
    if (isEnrolled || isActuallyEnrolled) {
      console.log('User is already enrolled (state or direct check), blocking action');
      setError('You are already registered for this event');
      return;
    }
    
    // If it's a paid event, redirect to payment page
    if (event.isPaid) {
      console.log('Navigating to payment page for event:', event._id);
      navigate(`/payment/${event._id}`);
      return;
    }

    // For free events, try to register directly
    try {
      setEnrolling(true);
      setError('');
      const response = await eventService.joinEvent(event._id);
      console.log('Registration successful:', response);
      setIsEnrolled(true);
      // Refresh event details to update attendee count
      await fetchEventDetails();
    } catch (err) {
      // Only redirect to login for authentication errors (invalid token)
      // Don't redirect for authorization errors (already registered, past event, etc.)
      if (err.response?.status === 401 && 
          (err.response?.data?.message?.includes('Unauthorized') || 
           err.response?.data?.message?.includes('token'))) {
        navigate('/login');
        return;
      }
      
      setError(err.response?.data?.message || err.message || 'Failed to register for event');
      console.error('Error registering for event:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  // Debug render state
  console.log('🎨 RENDER STATE:', {
    hasCurrentUser: !!currentUser,
    currentUserId: currentUser?._id || currentUser?.id,
    hasEvent: !!event,
    eventName: event?.name,
    attendeesCount: event?.attendees?.length,
    isEnrolled,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 text-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 text-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 text-gray-900">
      <div className="max-w-4xl mx-auto p-8">
        {/* Event Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-4xl font-bold flex-1">{event.name}</h1>
                  {currentUser && (
                    <ReportButton
                      reportType="event"
                      reportTargetId={event._id}
                      reportTargetInfo={{ 
                        title: event.name,
                        description: event.description,
                        club: event.club?.name 
                      }}
                      variant="icon"
                      size="medium"
                      tooltip="Report this event"
                    />
                  )}
                </div>
                <p className="text-gray-700 text-lg mb-4">{event.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-700 mb-4">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    {event.club?.name}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                </div>
              </div>

              {/* Price Display */}
              {event.isPaid && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg p-4 text-center lg:ml-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CurrencyDollarIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">Event Fee</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(event.price, event.currency)}
                  </div>
                </div>
              )}

              {!event.isPaid && (
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-4 text-center lg:ml-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    <span className="text-sm font-medium">Free Event</span>
                  </div>
                  <div className="text-xl font-bold">
                    No Cost
                  </div>
                </div>
              )}
            </div>

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(event.date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ClockIcon className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold text-gray-900">{formatTime(event.date)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Attendees</p>
                  <p className="font-semibold text-gray-900">
                    {event.attendees?.length || 0} / {event.maxAttendees || '∞'}
                  </p>
                </div>
              </div>
            </div>

            {/* Registration Status */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center space-x-4">
              {isEnrolled ? (
                <div className="flex items-center space-x-2 bg-green-50 text-green-800 px-8 py-3 rounded-lg font-semibold border-2 border-green-200">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Already Registered ✓</span>
                </div>
              ) : (
                <>
                  {event.isPaid ? (
                    <button
                      onClick={handleEnrollment}
                      disabled={enrolling || isEnrolled}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <BanknotesIcon className="w-5 h-5" />
                      <span>Pay & Register</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleEnrollment}
                      disabled={enrolling || isEnrolled}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {enrolling ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Registering...</span>
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="w-5 h-5" />
                          <span>Register</span>
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
              
              {/* Feedback Button - Show for enrolled users or after event */}
              {currentUser && (isEnrolled || new Date() > new Date(event.dateTime)) && (
                <FeedbackButton
                  targetType="event"
                  targetId={event._id}
                  targetInfo={{
                    title: event.name,
                    description: event.description,
                    club: event.club?.name
                  }}
                  text="Rate Event"
                  buttonVariant="outlined"
                  sx={{ 
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Event Content */}
        {event.content && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Details</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{event.content}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;