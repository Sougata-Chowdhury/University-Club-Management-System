import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';

const AdminPaymentManagement = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingPayments();
      // Ensure response is an array
      setPendingPayments(Array.isArray(response) ? response : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch pending payments');
      console.error('Error fetching pending payments:', err);
      setPendingPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    setActionLoading(paymentId);
    try {
      let reason = '';
      if (action === 'reject') {
        reason = prompt('Please provide a reason for rejection:');
        if (!reason) {
          setActionLoading(null);
          return;
        }
      }

      if (action === 'approve') {
        await adminService.approvePayment(paymentId);
      } else {
        await adminService.rejectPayment(paymentId, reason);
      }
      
      await fetchPendingPayments(); // Refresh data
      alert(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} payment`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Navigation */}
      <nav className="bg-purple-600 border-b border-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-white text-xl font-bold">Payment Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center text-white hover:text-gray-300"
              >
                <HomeIcon className="w-5 h-5 mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="text-white hover:text-gray-300"
              >
                Users
              </button>
              <button
                onClick={() => window.location.href = '/admin/clubs'}
                className="text-white hover:text-gray-300"
              >
                Clubs
              </button>
              <button
                onClick={() => window.location.href = '/admin/reports'}
                className="text-white hover:text-gray-300"
              >
                Reports
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Management</h1>
          <p className="text-xl text-gray-700">Review and process payment requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingPayments.length}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(Array.isArray(pendingPayments) ? pendingPayments.reduce((sum, payment) => sum + payment.amount, 0) : 0)}
                </p>
              </div>
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pending Payments */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-900 text-xl">Loading pending payments...</div>
          </div>
        ) : !Array.isArray(pendingPayments) || pendingPayments.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending payments</h3>
            <p className="text-gray-600">All payments have been processed</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Payment Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.eventId?.title || 'Event Payment'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.clubId?.name || 'Club Payment'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Payment ID: {payment._id.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {payment.userId?.firstName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.userId?.firstName} {payment.userId?.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {payment.userId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.paymentMethod || 'Card'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePaymentAction(payment._id, 'approve')}
                            disabled={actionLoading === payment._id}
                            className="flex items-center px-3 py-1 bg-green-600 border border-green-700 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            {actionLoading === payment._id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handlePaymentAction(payment._id, 'reject')}
                            disabled={actionLoading === payment._id}
                            className="flex items-center px-3 py-1 bg-red-600 border border-red-700 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            {actionLoading === payment._id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentManagement;
