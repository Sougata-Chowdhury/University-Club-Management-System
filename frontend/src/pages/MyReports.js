import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import reportService from '../services/reportService';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    category: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedReports, setExpandedReports] = useState({});
  const navigate = useNavigate();

  const toggleReport = (reportId) => {
    setExpandedReports(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  useEffect(() => {
    fetchReports();
  }, [filters, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportService.getUserReports(page, 20, filters);
      setReports(response.reports);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: '', status: '', category: '' });
    setPage(1);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Compact Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-white/80 hover:text-white transition-colors text-sm flex items-center space-x-1"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-white/20 hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-lg p-1.5">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-white text-base font-bold hidden sm:block">My Reports</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 mb-4">
          <div className="flex items-center mb-3">
            <FunnelIcon className="w-5 h-5 mr-2 text-purple-300" />
            <h2 className="text-white text-base font-semibold">Filters</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-white text-xs font-medium mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-gray-800">All Types</option>
                {reportService.getReportTypes().map((type) => (
                  <option key={type.value} value={type.value} className="bg-gray-800">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white text-xs font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-gray-800">All Statuses</option>
                {reportService.getReportStatuses().map((status) => (
                  <option key={status.value} value={status.value} className="bg-gray-800">
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white text-xs font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-gray-800">All Categories</option>
                {reportService.getReportCategories().map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-gray-800">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button 
              onClick={clearFilters}
              className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Clear Filters
            </button>
            <button 
              onClick={fetchReports}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors text-sm flex items-center space-x-1"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 text-center">
            <h3 className="text-white text-lg font-semibold mb-2">📝 No reports found</h3>
            <p className="text-gray-300 text-sm">You haven't submitted any reports yet.</p>
          </div>
        ) : (
          <>
          {/* Reports List */}
          <div className="space-y-3 mb-4">
            {reports.map((report) => {
              const getStatusColor = (status) => {
                switch(status) {
                  case 'pending': return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300';
                  case 'in_review': return 'bg-blue-500/20 border-blue-400/50 text-blue-300';
                  case 'resolved': return 'bg-green-500/20 border-green-400/50 text-green-300';
                  case 'rejected': return 'bg-red-500/20 border-red-400/50 text-red-300';
                  default: return 'bg-gray-500/20 border-gray-400/50 text-gray-300';
                }
              };

              return (
                <div key={report.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-white font-semibold text-sm sm:text-base">
                          {reportService.getTypeIcon(report.type)} {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {reportService.getStatusIcon(report.status)} {report.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm mb-1">
                        {reportService.getCategoryIcon(report.category)} {report.category.replace('_', ' ')} • Submitted {getTimeAgo(report.createdAt)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Priority: {'⭐'.repeat(report.priority)} Level {report.priority}
                      </p>
                    </div>
                    {report.priority >= 4 && (
                      <span className="bg-red-500/20 border border-red-400/50 text-red-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                        HIGH PRIORITY
                      </span>
                    )}
                  </div>

                  {/* Accordion */}
                  <div className="border-t border-white/10 pt-3">
                    <button
                      onClick={() => toggleReport(report.id)}
                      className="w-full flex items-center justify-between text-white hover:text-purple-300 transition-colors"
                    >
                      <span className="text-sm font-medium">View Details</span>
                      {expandedReports[report.id] ? (
                        <ChevronUpIcon className="w-5 h-5" />
                      ) : (
                        <ChevronDownIcon className="w-5 h-5" />
                      )}
                    </button>

                    {expandedReports[report.id] && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-white text-sm font-semibold mb-1">Description:</p>
                          <p className="text-gray-200 text-sm">{report.description}</p>
                        </div>

                        {report.additionalInfo && (
                          <div>
                            <p className="text-white text-sm font-semibold mb-1">Additional Information:</p>
                            <p className="text-gray-200 text-sm">{report.additionalInfo}</p>
                          </div>
                        )}

                        {report.attachments && report.attachments.length > 0 && (
                          <div>
                            <p className="text-white text-sm font-semibold mb-1">Attachments: ({report.attachments.length})</p>
                            <div className="flex gap-2 flex-wrap">
                              {report.attachments.map((attachment, index) => (
                                <span key={index} className="bg-white/10 border border-white/20 px-2 py-1 rounded text-xs text-gray-200">
                                  📎 Attachment {index + 1}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {report.reviewedBy && (
                          <div>
                            <div className="border-t border-white/10 my-3"></div>
                            <p className="text-white text-sm font-semibold mb-1">Admin Response:</p>
                            <p className="text-gray-300 text-sm mb-2">
                              Reviewed by {report.reviewedBy.name} on {reportService.formatDate(report.reviewedAt)}
                            </p>
                            
                            {report.actionTaken && (
                              <div className="mb-2">
                                <p className="text-gray-200 text-sm font-medium">
                                  Action Taken: {report.actionTaken}
                                </p>
                              </div>
                            )}
                            
                            {report.adminNotes && (
                              <div className="p-3 bg-purple-500/10 border border-purple-400/20 rounded-lg">
                                <p className="text-gray-200 text-sm">
                                  <strong>Admin Notes:</strong> {report.adminNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                          <span>Report ID: {report.id}</span>
                          <span>Last updated: {reportService.formatDate(report.updatedAt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="text-white font-semibold text-sm px-3">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyReports;
