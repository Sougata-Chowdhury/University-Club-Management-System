import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserGroupIcon, PlusIcon, CogIcon, CalendarIcon, SparklesIcon, CreditCardIcon, UserIcon, FolderIcon, ChevronDownIcon, ArrowRightOnRectangleIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { dashboardService } from '../services/dashboardService';
import NotificationBell from './NotificationBell';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const [stats, setStats] = useState({
    availableClubs: 0,
    clubsOwned: 0,
    registeredEvents: 0,
    loading: true,
    error: null
  });

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const userMenuRef = useRef(null);
  const quickMenuRef = useRef(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
        setShowQuickMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Dashboard: Starting to fetch statistics...');
      setStats(prev => ({ ...prev, loading: true, error: null }));
      const dashboardData = await dashboardService.getDashboardStats();
      
      console.log('Dashboard: Received dashboard data:', dashboardData);
      
      setStats({
        availableClubs: dashboardData.availableClubs,
        clubsOwned: dashboardData.clubsOwned,
        registeredEvents: dashboardData.registeredEvents,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Dashboard: Failed to fetch dashboard stats:', error);
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to load statistics' 
      }));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800">
      {/* Compact Navigation Bar */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 rounded-lg p-1.5">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-white text-base font-bold hidden sm:block">Club Portal</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <NotificationBell />

              {/* Quick Actions */}
              <div className="relative" ref={quickMenuRef}>
                <button
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-white/20 text-sm"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Quick</span>
                </button>
                
                {showQuickMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <Link to="/create-club" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <PlusIcon className="h-4 w-4 text-blue-500" />
                      <span>Create Club</span>
                    </Link>
                    <Link to="/create-event" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <CalendarIcon className="h-4 w-4 text-purple-500" />
                      <span>Create Event</span>
                    </Link>
                    <Link to="/announcements" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-pink-50 transition-colors items-center space-x-2" onClick={() => setShowQuickMenu(false)}>
                      <SparklesIcon className="h-4 w-4 text-pink-500" />
                      <span>Announcements</span>
                    </Link>
                  </div>
                )}
              </div>

              {user && user.role === 'admin' && (
                <Link to="/admin" className="bg-yellow-500/90 hover:bg-yellow-500 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 font-semibold shadow-lg text-sm">
                  <CogIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border border-white/20 text-sm"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden md:inline max-w-[100px] truncate">{user?.firstName || 'User'}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-xs font-semibold text-gray-900 truncate">{user?.email || 'Loading...'}</p>
                    </div>
                    <Link to="/profile" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors items-center space-x-2" onClick={() => setShowUserMenu(false)}>
                      <UserIcon className="h-4 w-4 text-blue-500" />
                      <span>Profile</span>
                    </Link>
                    <Link to="/payment-history" className="flex px-3 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors items-center space-x-2" onClick={() => setShowUserMenu(false)}>
                      <CreditCardIcon className="h-4 w-4 text-green-500" />
                      <span>Payments</span>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2">
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
        {/* Compact Welcome */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Welcome, {user?.firstName || 'User'}!</h1>
          <p className="text-sm text-gray-200">Explore clubs and events</p>
        </div>

        {/* Compact Stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 border border-white/20 mb-4">
          {stats.error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-2 mb-3 text-red-200 text-center text-xs">
              {stats.error}
              <button onClick={fetchDashboardStats} className="ml-2 text-red-300 hover:text-red-100 underline">Retry</button>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-purple-500/20 rounded-lg p-2 text-center border border-purple-400/30">
              <div className="text-xl font-bold text-purple-300">{stats.loading ? '...' : stats.availableClubs}</div>
              <div className="text-purple-200 text-xs">Clubs</div>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-2 text-center border border-blue-400/30">
              <div className="text-xl font-bold text-blue-300">{stats.loading ? '...' : stats.clubsOwned}</div>
              <div className="text-blue-200 text-xs">My Clubs</div>
            </div>
            <div className="bg-green-500/20 rounded-lg p-2 text-center border border-green-400/30">
              <div className="text-xl font-bold text-green-300">{stats.loading ? '...' : stats.registeredEvents}</div>
              <div className="text-green-200 text-xs">Events</div>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-2 text-center border border-yellow-400/30">
              <div className="text-xl font-bold text-yellow-300">{new Date().getDate()}</div>
              <div className="text-yellow-200 text-xs">{new Date().toLocaleDateString('en-US', { month: 'short' })}</div>
            </div>
          </div>
        </div>

        {/* Creative Asymmetric Layout */}
        <div className="grid grid-cols-6 gap-3 auto-rows-fr">
          {/* Large Feature: Browse Clubs */}
          <Link to="/browse-clubs" className="col-span-6 sm:col-span-3 lg:col-span-2 row-span-2 group bg-gradient-to-br from-purple-500/30 to-blue-600/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-400/40 hover:border-purple-400/80 transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="bg-purple-500/30 rounded-xl p-3 w-fit mb-3">
                <UserGroupIcon className="w-8 h-8 text-purple-200" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Browse Clubs</h3>
              <p className="text-sm text-purple-100 mb-4">Discover amazing communities</p>
              <div className="inline-flex items-center text-purple-200 text-sm font-semibold group-hover:text-white transition-colors">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Medium: My Clubs */}
          <Link to="/my-clubs" className="col-span-3 sm:col-span-3 lg:col-span-2 group bg-gradient-to-br from-blue-500/25 to-cyan-500/25 backdrop-blur-lg rounded-xl p-4 border border-blue-400/30 hover:border-blue-400/60 transition-all hover:scale-105">
            <div className="bg-blue-500/20 rounded-lg p-2 w-fit mb-2">
              <CogIcon className="w-6 h-6 text-blue-300" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">My Clubs</h3>
            <p className="text-xs text-blue-100">Manage & grow</p>
          </Link>

          {/* Medium: Create Event */}
          <Link to="/create-event" className="col-span-3 sm:col-span-3 lg:col-span-2 group bg-gradient-to-br from-amber-500/25 to-orange-500/25 backdrop-blur-lg rounded-xl p-4 border border-amber-400/30 hover:border-amber-400/60 transition-all hover:scale-105">
            <div className="bg-amber-500/20 rounded-lg p-2 w-fit mb-2">
              <PlusIcon className="w-6 h-6 text-amber-300" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Create Event</h3>
            <p className="text-xs text-amber-100">Start something new</p>
          </Link>

          {/* Large Feature: Browse Events */}
          <Link to="/browse-events" className="col-span-6 sm:col-span-3 lg:col-span-2 row-span-2 group bg-gradient-to-br from-indigo-500/30 to-purple-600/30 backdrop-blur-lg rounded-2xl p-6 border border-indigo-400/40 hover:border-indigo-400/80 transition-all hover:scale-[1.02] hover:shadow-2xl relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="bg-indigo-500/30 rounded-xl p-3 w-fit mb-3">
                <CalendarIcon className="w-8 h-8 text-indigo-200" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Browse Events</h3>
              <p className="text-sm text-indigo-100 mb-4">Find exciting activities</p>
              <div className="inline-flex items-center text-indigo-200 text-sm font-semibold group-hover:text-white transition-colors">
                <span>Discover</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Small: Announcements */}
          <Link to="/announcements" className="col-span-2 group bg-gradient-to-br from-pink-500/25 to-rose-500/25 backdrop-blur-lg rounded-xl p-3 border border-pink-400/30 hover:border-pink-400/60 transition-all hover:scale-105">
            <div className="bg-pink-500/20 rounded-lg p-2 w-fit mb-2">
              <SparklesIcon className="w-5 h-5 text-pink-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Updates</h3>
          </Link>

          {/* Small: Payments */}
          <Link to="/payment-history" className="col-span-2 group bg-gradient-to-br from-emerald-500/25 to-teal-500/25 backdrop-blur-lg rounded-xl p-3 border border-emerald-400/30 hover:border-emerald-400/60 transition-all hover:scale-105">
            <div className="bg-emerald-500/20 rounded-lg p-2 w-fit mb-2">
              <CreditCardIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Payments</h3>
          </Link>

          {/* Small: Feedback */}
          <Link to="/feedback" className="col-span-2 group bg-gradient-to-br from-cyan-500/25 to-blue-500/25 backdrop-blur-lg rounded-xl p-3 border border-cyan-400/30 hover:border-cyan-400/60 transition-all hover:scale-105">
            <div className="bg-cyan-500/20 rounded-lg p-2 w-fit mb-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-cyan-300" />
            </div>
            <h3 className="text-sm font-bold text-white">Feedback</h3>
          </Link>

          {/* Wide: My Feedback */}
          <Link to="/my-feedback" className="col-span-3 lg:col-span-2 group bg-gradient-to-r from-violet-500/25 to-purple-500/25 backdrop-blur-lg rounded-xl p-4 border border-violet-400/30 hover:border-violet-400/60 transition-all hover:scale-105 flex items-center space-x-3">
            <div className="bg-violet-500/20 rounded-lg p-2 flex-shrink-0">
              <DocumentTextIcon className="w-6 h-6 text-violet-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">My Feedback</h3>
              <p className="text-xs text-violet-100">Track responses</p>
            </div>
          </Link>

          {/* Wide: My Reports */}
          <Link to="/my-reports" className="col-span-3 lg:col-span-2 group bg-gradient-to-r from-red-500/25 to-pink-500/25 backdrop-blur-lg rounded-xl p-4 border border-red-400/30 hover:border-red-400/60 transition-all hover:scale-105 flex items-center space-x-3">
            <div className="bg-red-500/20 rounded-lg p-2 flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6 text-red-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">My Reports</h3>
              <p className="text-xs text-red-100">Monitor status</p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-white/60 text-xs">
          <p>© 2026 University Club Portal</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
