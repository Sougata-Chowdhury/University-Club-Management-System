import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { clubService } from '../services/clubService';
import { 
  CheckCircleIcon, 
  DocumentIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  ArrowLeftIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const PaymentHistory = () => {
  const { clubId } = useParams();
  const [payments, setPayments] = useState([]);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (clubId) {
      fetchClubInfo();
      fetchPaymentHistory();
    } else {
      fetchUserPaymentHistory();
    }
  }, [clubId, currentPage]);

  const fetchClubInfo = async () => {
    try {
      const response = await clubService.getClubById(clubId);
      setClub(response);
    } catch (err) {
      console.error('Error fetching club info:', err);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await paymentService.getClubPaymentHistory(clubId, currentPage, 10);
      setPayments(response.payments || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError('Failed to fetch payment history');
      console.error('Error fetching payment history:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await paymentService.getUserPayments(currentPage, 10);
      // Filter only approved payments for user history
      const approvedPayments = (response.payments || []).filter(p => p.status === 'approved');
      setPayments(approvedPayments);
      setPagination(response.pagination || {});
    } catch (err) {
      setError('Failed to fetch payment history');
      console.error('Error fetching payment history:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            {clubId && (
              <Link
                to={`/clubs/${clubId}/manage-payments`}
                className="mr-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
            )}
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-emerald-400 mr-3" />
              <div>
                <h1 className="text-4xl font-bold">Payment History</h1>
                {club && (
                  <p className="text-emerald-400 text-lg font-medium">{club.name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm font-medium">Total Approved Payments</p>
              <p className="text-3xl font-bold text-green-400">{payments.length}</p>
            </div>
            <div>
              <p className="text-green-200 text-sm font-medium">Total Transactions</p>
              <p className="text-3xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
            </div>
            <CheckCircleIcon className="w-16 h-16 text-green-400" />
          </div>
        </div>

        {/* Payment History List */}
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No approved payments yet</h3>
            <p className="text-gray-600">Approved payments will appear here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-400 mb-6">✅ Approved Payments</h2>
            <div className="space-y-4">
              {payments.map((payment) => (
                <PaymentHistoryCard 
                  key={payment._id}
                  payment={payment}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate PaymentHistoryCard component for better organization
const PaymentHistoryCard = ({ payment, formatCurrency, formatDate }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {payment.eventId?.name || 'Event Deleted'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <UserIcon className="w-4 h-4" />
                <span>{payment.userId?.firstName} {payment.userId?.lastName} ({payment.userId?.email})</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <CalendarIcon className="w-4 h-4" />
                <span>Paid: {formatDate(payment.approvedAt || payment.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-emerald-400 mb-2">
            {formatCurrency(payment.amount, payment.currency)}
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
            Approved
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">Payment Method</p>
          <p className="text-gray-900 font-medium">
            {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">Transaction ID</p>
          <p className="text-gray-900 font-mono text-sm">{payment.transactionId || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium mb-1">Approved By</p>
          <p className="text-gray-900 text-sm">
            {payment.approvedBy && payment.approvedBy.firstName && payment.approvedBy.lastName ? 
              `${payment.approvedBy.firstName} ${payment.approvedBy.lastName}` : 
              payment.approvedBy && (payment.approvedBy.firstName || payment.approvedBy.lastName) ?
                `${payment.approvedBy.firstName || ''} ${payment.approvedBy.lastName || ''}`.trim() :
                'Club Administrator'
            }
          </p>
        </div>
      </div>

      {payment.eventId?.date && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-medium mb-1">Event Date</p>
          <p className="text-gray-900">{formatDate(payment.eventId.date)}</p>
        </div>
      )}

      {payment.eventId?.location && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-medium mb-1">Event Location</p>
          <p className="text-gray-900">{payment.eventId.location}</p>
        </div>
      )}

      {payment.proofOfPayment && (
        <div className="flex items-center space-x-2 text-sm text-blue-700 mb-4">
          <DocumentIcon className="w-4 h-4" />
          <span>Payment proof available</span>
          <a 
            href={`${process.env.REACT_APP_BACKEND_URL}${payment.proofOfPayment}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline font-medium flex items-center space-x-1"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View</span>
          </a>
        </div>
      )}

      {payment.notes && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-1">Notes</p>
          <p className="text-gray-900">{payment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
