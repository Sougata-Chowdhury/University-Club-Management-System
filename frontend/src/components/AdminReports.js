import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  HomeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import adminService from '../services/adminService';

const AdminReports = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [systemReport, setSystemReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSystemStats();
    generateReport();
  }, []);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSystemStats();
      setSystemStats(response.data || response);
      setError('');
    } catch (err) {
      setError('Failed to fetch system statistics');
      console.error('Error fetching system stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setReportLoading(true);
      const response = await adminService.generateSystemReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setSystemReport(response.data || response);
    } catch (err) {
      setError('Failed to generate system report');
      console.error('Error generating report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
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
                className="flex items-center text-gray-900 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-gray-900 text-xl font-bold">Reports & Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="flex items-center text-gray-900 hover:text-gray-600"
              >
                <HomeIcon className="w-5 h-5 mr-1" />
                Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/admin/users'}
                className="text-gray-900 hover:text-gray-600"
              >
                Users
              </button>
              <button
                onClick={() => window.location.href = '/admin/clubs'}
                className="text-gray-900 hover:text-gray-600"
              >
                Clubs
              </button>
              <button
                onClick={() => window.location.href = '/admin/payments'}
                className="text-gray-900 hover:text-gray-600"
              >
                Payments
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className="bg-red-500 hover:bg-red-600 text-gray-900 px-4 py-2 rounded-lg transition-colors"
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Reports & Analytics</h1>
          <p className="text-xl text-gray-600">System insights and performance metrics</p>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Report Period</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-gray-200 shadow-lg rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-gray-200 shadow-lg rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-gray-900 rounded-lg transition-colors"
            >
              {reportLoading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* System Statistics */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-900 text-xl">Loading system statistics...</div>
          </div>
        ) : systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-blue-300">{systemStats.totalUsers}</p>
                  <p className="text-sm text-gray-500">
                    +{systemStats.newUsersLast30Days} this month
                  </p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Clubs</p>
                  <p className="text-3xl font-bold text-purple-300">{systemStats.totalClubs}</p>
                  <p className="text-sm text-gray-500">
                    +{systemStats.newClubsLast30Days} this month
                  </p>
                </div>
                <BuildingOfficeIcon className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Events</p>
                  <p className="text-3xl font-bold text-green-300">{systemStats.totalEvents}</p>
                  <p className="text-sm text-gray-500">
                    +{systemStats.newEventsLast30Days} this month
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-yellow-300">
                    {formatCurrency(systemStats.totalRevenue)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {systemStats.totalPayments} payments
                  </p>
                </div>
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* System Report */}
        {systemReport && (
          <div className="space-y-8">
            {/* Growth Analytics */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2" />
                Growth Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">User Growth</h3>
                  <div className="space-y-2">
                    {systemReport.userGrowth.slice(-7).map((data, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{data._id}</span>
                        <span className="text-blue-300">+{data.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Club Growth</h3>
                  <div className="space-y-2">
                    {systemReport.clubGrowth.slice(-7).map((data, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{data._id}</span>
                        <span className="text-purple-300">+{data.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Growth</h3>
                  <div className="space-y-2">
                    {systemReport.eventGrowth.slice(-7).map((data, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{data._id}</span>
                        <span className="text-green-300">+{data.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Clubs by Members</h2>
                <div className="space-y-3">
                  {systemReport.topClubs.slice(0, 5).map((club, index) => (
                    <div key={club._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-purple-500 text-gray-900 rounded-full flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-gray-900 font-medium">{club.name}</p>
                          <p className="text-gray-500 text-sm">{club.memberCount} members</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Events by Registrations</h2>
                <div className="space-y-3">
                  {systemReport.topEvents.slice(0, 5).map((event, index) => (
                    <div key={event._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-6 h-6 bg-green-500 text-gray-900 rounded-full flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-gray-900 font-medium">{event.title}</p>
                          <p className="text-gray-500 text-sm">{event.registrationCount} registrations</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Analytics */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-300">
                    {formatCurrency(systemReport.paymentStats.totalAmount)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Total Payments</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {systemReport.paymentStats.totalCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Average Payment</p>
                  <p className="text-2xl font-bold text-purple-300">
                    {formatCurrency(systemReport.paymentStats.averageAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
