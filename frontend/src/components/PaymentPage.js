import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { paymentService } from '../services/paymentService';
import { eventService } from '../services/eventService';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DocumentPlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer',
    transactionId: '',
    notes: ''
  });
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    console.log('PaymentPage mounted with eventId:', eventId);
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(eventId);
      setEvent(response);
      
      // Check if user is already registered
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentUser = userResponse.data;
          const userId = currentUser._id || currentUser.id;
          
          const isAlreadyRegistered = response.attendees?.some(attendee => {
            const attendeeId = typeof attendee === 'string' ? attendee : (attendee._id || attendee.id);
            return String(attendeeId) === String(userId);
          });
          
          console.log('Payment page - checking registration:', {
            userId,
            attendees: response.attendees,
            isAlreadyRegistered
          });
          
          if (isAlreadyRegistered) {
            setError('You are already registered for this event');
            setTimeout(() => {
              navigate(`/events/${eventId}`);
            }, 2000);
          }
        } catch (userErr) {
          console.error('Failed to fetch user:', userErr);
        }
      }
    } catch (err) {
      setError('Failed to fetch event details');
      console.error('Error fetching event:', err);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG) or PDF file');
        return;
      }

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setProofFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!proofFile) {
      setError('Please upload proof of payment');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const paymentData = new FormData();
      paymentData.append('eventId', eventId);
      paymentData.append('paymentMethod', formData.paymentMethod);
      paymentData.append('transactionId', formData.transactionId);
      paymentData.append('notes', formData.notes);
      paymentData.append('proofOfPayment', proofFile);

      console.log('Submitting payment data:', {
        eventId,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        notes: formData.notes,
        proofFile: proofFile.name
      });

      await paymentService.createPayment(paymentData);
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit payment';
      setError(errorMessage);
      console.error('Error submitting payment:', err);
      
      // If already registered, redirect to event details
      if (errorMessage.includes('already registered') || errorMessage.includes('already paid')) {
        setTimeout(() => {
          navigate(`/events/${eventId}`);
        }, 2000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-gray-400">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-md">
          <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Payment Submitted Successfully!</h2>
          <p className="text-gray-300 mb-4">
            Your payment has been submitted and is pending approval from the club organizers.
          </p>
          <p className="text-sm text-gray-400">
            You will be redirected to the dashboard shortly...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold">Event Payment</h1>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold mb-4">{event.name}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Event Date</p>
                <p className="text-white">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Location</p>
                <p className="text-white">{event.location}</p>
              </div>
              <div>
                <p className="text-gray-400">Club</p>
                <p className="text-white">{event.club?.name}</p>
              </div>
              <div>
                <p className="text-gray-400">Amount</p>
                <p className="text-emerald-400 text-lg font-bold">
                  {formatCurrency(event.price, event.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="digital_wallet">Digital Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={formData.transactionId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter transaction ID or reference number"
                />
              </div>

              {/* Proof of Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Proof of Payment *
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <DocumentPlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="flex flex-col items-center">
                      <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors">
                        Choose File
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          className="hidden"
                          required
                        />
                      </label>
                      <p className="text-sm text-gray-400 mt-2">
                        Upload receipt, screenshot, or payment confirmation
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supported formats: JPEG, PNG, PDF (Max 5MB)
                      </p>
                    </div>
                  </div>
                  {proofFile && (
                    <div className="mt-4 p-3 bg-emerald-900/20 rounded-lg">
                      <p className="text-emerald-300 text-sm">
                        Selected: {proofFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Any additional information about the payment..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting Payment...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <BanknotesIcon className="w-5 h-5" />
                    <span>Submit Payment</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Payment Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Payment Instructions</h3>
          <div className="text-sm text-blue-200 space-y-1">
            <p>• Make the payment using your preferred method</p>
            <p>• Upload a clear photo/screenshot of your payment receipt</p>
            <p>• Include transaction ID or reference number if available</p>
            <p>• Your payment will be reviewed by club organizers</p>
            <p>• You'll receive confirmation once payment is approved</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
