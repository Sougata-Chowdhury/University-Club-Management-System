import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { clubService } from '../services/clubService';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  DocumentIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const ManagePayments = () => {
  const { clubId } = useParams();
  const [payments, setPayments] = useState([]);
  const [allClubPayments, setAllClubPayments] = useState([]);
  const [userClubs, setUserClubs] = useState([]);
  const [currentClub, setCurrentClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);
  const [showAllClubs, setShowAllClubs] = useState(false);

  console.log('ManagePayments component loaded with clubId:', clubId);

  useEffect(() => {
    console.log('useEffect triggered with clubId:', clubId);
    fetchUserClubs();
    if (clubId) {
      fetchCurrentClub();
      fetchClubPayments();
    } else {
      console.error('No clubId found in URL params');
      setError('Invalid club ID');
      setLoading(false);
    }
  }, [clubId]);

  const fetchCurrentClub = async () => {
    try {
      const response = await clubService.getClubById(clubId);
      setCurrentClub(response);
    } catch (err) {
      console.error('Error fetching current club:', err);
    }
  };

  const fetchUserClubs = async () => {
    try {
      const response = await clubService.getMyClubs();
      // Combine created clubs and joined clubs
      const allClubs = [
        ...(response.createdClubs || []),
        ...(response.joinedClubs || [])
      ];
      setUserClubs(allClubs);
    } catch (err) {
      console.error('Error fetching user clubs:', err);
    }
  };

  const fetchAllClubsPayments = async () => {
    try {
      setLoading(true);
      const allPayments = [];
      
      for (const club of userClubs) {
        try {
          const response = await paymentService.getClubPayments(club._id);
          const clubPayments = (response.payments || []).map(payment => ({
            ...payment,
            clubInfo: club
          }));
          allPayments.push(...clubPayments);
        } catch (err) {
          console.error(`Error fetching payments for club ${club.name}:`, err);
        }
      }
      
      setAllClubPayments(allPayments);
      setShowAllClubs(true);
    } catch (err) {
      setError('Failed to fetch all payments');
      console.error('Error fetching all club payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubPayments = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching payments for clubId:', clubId);
      const response = await paymentService.getClubPayments(clubId);
      console.log('Payments response:', response);
      console.log('Payments array:', response.payments);
      console.log('Payments count:', response.payments ? response.payments.length : 0);
      setPayments(response.payments || []);
    } catch (err) {
      setError('Failed to fetch payments');
      console.error('Error fetching payments:', err);
      setPayments([]); // Ensure payments is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      setProcessingPayment(paymentId);
      await paymentService.approvePayment(paymentId);
      // Update the payment status in the local state
      setPayments((prevPayments) => 
        (prevPayments || []).map(payment => 
          payment._id === paymentId 
            ? { ...payment, status: 'approved', paidAt: new Date().toISOString() }
            : payment
        )
      );
    } catch (err) {
      setError('Failed to approve payment');
      console.error('Error approving payment:', err);
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleRejectPayment = async (paymentId) => {
    try {
      setProcessingPayment(paymentId);
      await paymentService.rejectPayment(paymentId);
      // Update the payment status in the local state
      setPayments((prevPayments) => 
        (prevPayments || []).map(payment => 
          payment._id === paymentId 
            ? { ...payment, status: 'rejected' }
            : payment
        )
      );
    } catch (err) {
      setError('Failed to reject payment');
      console.error('Error rejecting payment:', err);
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const currentPayments = showAllClubs ? allClubPayments : payments;
  const pendingPayments = (currentPayments || []).filter(payment => payment.status === 'pending');
  const approvedPayments = (currentPayments || []).filter(payment => payment.status === 'approved');
  const rejectedPayments = (currentPayments || []).filter(payment => payment.status === 'rejected');

  console.log('Debug payment filtering:', {
    currentPayments: currentPayments?.length || 0,
    pendingCount: pendingPayments.length,
    approvedCount: approvedPayments.length,
    rejectedCount: rejectedPayments.length,
    paymentStatuses: currentPayments?.map(p => p.status) || []
  });

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-8">
      {/* Navigation */}
      <nav className="bg-white rounded-lg mb-8 p-4 border border-gray-200 shadow-lg">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-gray-900 text-xl font-bold">
            University Clubs
          </Link>
          <div className="flex items-center space-x-4">
            {clubId && (
              <Link 
                to={`/manage-club/${clubId}`} 
                className="text-purple-600 hover:text-purple-700 transition-colors"
              >
                ← Back to Manage Club
              </Link>
            )}
            <Link to="/my-clubs" className="text-gray-700 hover:text-purple-600 transition-colors">
              My Clubs
            </Link>
            <Link to="/dashboard" className="text-gray-700 hover:text-purple-600 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-emerald-400 mr-3" />
            <div>
              <h1 className="text-4xl font-bold">Manage Payments</h1>
              {currentClub && (
                <p className="text-emerald-300 mt-1">
                  For club: {currentClub.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {clubId && (
              <Link
                to={`/clubs/${clubId}/payment-history`}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Payment History</span>
              </Link>
            )}
            
            {!showAllClubs && userClubs.length > 1 && (
              <button
                onClick={fetchAllClubsPayments}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                View All Club Payments
              </button>
            )}
            
            {showAllClubs && (
              <button
                onClick={() => {
                  setShowAllClubs(false);
                  fetchClubPayments();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                View This Club Only
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded mb-6">
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
            {error.includes('Invalid club ID') && (
              <p className="mt-2 text-sm text-red-300">
                Please make sure you accessed this page through a valid club management link.
              </p>
            )}
            {error.includes('permissions') && (
              <p className="mt-2 text-sm text-red-300">
                You must be the club creator or a member to manage payments for this club.
              </p>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-medium">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-400">{pendingPayments.length}</p>
              </div>
              <ClockIcon className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-400">{approvedPayments.length}</p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-400">{rejectedPayments.length}</p>
              </div>
              <XCircleIcon className="w-12 h-12 text-red-400" />
            </div>
          </div>
        </div>

        {(!payments || payments.length === 0) ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments yet</h3>
            <p className="text-gray-600">No payment submissions have been received for your club events.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Payments Section */}
            {pendingPayments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">⏳ Pending Approval</h2>
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <PaymentCard 
                      key={payment._id}
                      payment={payment}
                      onApprove={handleApprovePayment}
                      onReject={handleRejectPayment}
                      isProcessing={processingPayment === payment._id}
                      showActions={true}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Approved Payments Section */}
            {approvedPayments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-green-400 mb-4">✅ Approved Payments</h2>
                <div className="space-y-4">
                  {approvedPayments.map((payment) => (
                    <PaymentCard 
                      key={payment._id}
                      payment={payment}
                      showActions={false}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Payments Section */}
            {rejectedPayments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">❌ Rejected Payments</h2>
                <div className="space-y-4">
                  {rejectedPayments.map((payment) => (
                    <PaymentCard 
                      key={payment._id}
                      payment={payment}
                      showActions={false}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusIcon={getStatusIcon}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Separate PaymentCard component for better organization
const PaymentCard = ({ 
  payment, 
  onApprove, 
  onReject, 
  isProcessing, 
  showActions, 
  formatCurrency, 
  formatDate, 
  getStatusIcon, 
  getStatusColor 
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className="flex-shrink-0">
            {getStatusIcon(payment.status)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">
              {payment.eventId?.name || payment.event?.name || 'Event Not Found'}
            </h3>
            {payment.clubInfo && (
              <p className="text-emerald-400 text-sm font-medium mb-2">
                Club: {payment.clubInfo.name}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-gray-700">
                <UserIcon className="w-4 h-4" />
                <span>{payment.userId?.firstName} {payment.userId?.lastName} ({payment.userId?.email})</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(payment.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right ml-4">
          <div className="text-2xl font-bold text-emerald-400 mb-2">
            {formatCurrency(payment.amount, payment.currency)}
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Payment Method</p>
          <p className="text-gray-900 font-semibold text-base">
            {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1).replace('_', ' ')}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Transaction ID</p>
          <p className="text-gray-900 font-mono text-sm font-medium">{payment.transactionId || 'N/A'}</p>
        </div>
      </div>

      {payment.proofOfPayment && (
        <div className="flex items-center space-x-3 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <DocumentIcon className="w-5 h-5 text-blue-600" />
          <span className="text-gray-900 font-medium">Payment proof available</span>
          <a 
            href={`${process.env.REACT_APP_BACKEND_URL}/uploads/payments/${payment.proofOfPayment}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline font-bold"
          >
            View
          </a>
        </div>
      )}

      {payment.notes && (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide mb-2">Notes</p>
          <p className="text-gray-900 font-medium">{payment.notes}</p>
        </div>
      )}

      {showActions && payment.status === 'pending' && (
        <div className="flex space-x-4">
          <button
            onClick={() => onApprove(payment._id)}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Approve Payment'}
          </button>
          <button
            onClick={() => onReject(payment._id)}
            disabled={isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Reject Payment'}
          </button>
        </div>
      )}

      {payment.status === 'approved' && payment.paidAt && (
        <div className="text-sm bg-green-50 border border-green-200 rounded-lg p-3">
          <span className="text-green-700 font-bold">Payment approved on: {formatDate(payment.paidAt)}</span>
        </div>
      )}
    </div>
  );
};

export default ManagePayments;
