import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './components/Login';
import Register from './pages/Register';
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import AdminClubManagement from './components/AdminClubManagement';
import AdminPaymentManagement from './components/AdminPaymentManagement';
import AdminAnnouncements from './components/AdminAnnouncements';
import AdminReports from './pages/AdminReports';
import MyReports from './pages/MyReports';
import BrowseClubs from './components/BrowseClubs';
import CreateClub from './components/CreateClub';
import MyClubs from './components/MyClubs';
import ManageClub from './components/ManageClub';
import ClubDetails from './components/ClubDetails';
import BrowseEvents from './components/BrowseEvents';
import MyEvents from './components/MyEvents';
import CreateEvent from './components/CreateEvent';
import EventDetails from './components/EventDetails';
import EditEvent from './components/EditEvent';
import Announcements from './components/Announcements';
import CreateAnnouncement from './components/CreateAnnouncement';
import PaymentPage from './components/PaymentPage';
import PaymentHistory from './components/PaymentHistory';
import ManagePayments from './components/ManagePayments';
import ClubEvents from './components/ClubEvents';
import UserProfile from './components/UserProfile';
import UserSettings from './components/UserSettings';
import NotificationPage from './components/NotificationPage';
import FileManagement from './pages/FileManagement';
import FeedbackList from './components/feedback/FeedbackList';
import UserFeedback from './components/feedback/UserFeedback';
import AdminFeedback from './components/feedback/AdminFeedback';
import FeedbackPage from './pages/FeedbackPage';
import MyFeedback from './pages/MyFeedback';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Protected Route Component using AuthContext
const ProtectedRoute = ({ children, adminRequired = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminRequired && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* Protected User Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/browse-clubs" 
              element={
                <ProtectedRoute>
                  <BrowseClubs />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-club" 
              element={
                <ProtectedRoute>
                  <CreateClub />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-clubs" 
              element={
                <ProtectedRoute>
                  <MyClubs />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/manage-club/:clubId" 
              element={
                <ProtectedRoute>
                  <ManageClub />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clubs/:id" 
              element={
                <ProtectedRoute>
                  <ClubDetails />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/club-events/:clubId" 
              element={
                <ProtectedRoute>
                  <ClubEvents />
                </ProtectedRoute>
              } 
            />
          
            
            {/* Event Routes */}
            <Route 
              path="/browse-events" 
              element={
                <ProtectedRoute>
                  <BrowseEvents />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-events" 
              element={
                <ProtectedRoute>
                  <MyEvents />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-event" 
              element={
                <ProtectedRoute>
                  <CreateEvent />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/events/:id" 
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/events/:id/edit" 
              element={
                <ProtectedRoute>
                  <EditEvent />
                </ProtectedRoute>
              } 
            />
            
            {/* Announcement Routes */}
            <Route 
              path="/announcements" 
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/create-announcement" 
              element={
                <ProtectedRoute>
                  <CreateAnnouncement />
                </ProtectedRoute>
              } 
            />
            
            {/* Payment Routes */}
            <Route 
              path="/payment/:eventId" 
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/payment-history" 
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clubs/:clubId/payment-history" 
              element={
                <ProtectedRoute>
                  <PaymentHistory />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/clubs/:clubId/manage-payments" 
              element={
                <ProtectedRoute>
                  <ManagePayments />
                </ProtectedRoute>
              } 
            />
            
            {/* User Profile and Settings Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <UserSettings />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <NotificationPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-reports" 
              element={
                <ProtectedRoute>
                  <MyReports />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/files" 
              element={
                <ProtectedRoute>
                  <FileManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/feedback" 
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-feedback" 
              element={
                <ProtectedRoute>
                  <MyFeedback />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminUserManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/clubs" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminClubManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/announcements" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminAnnouncements />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/payments" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminPaymentManagement />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminReports />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/feedback" 
              element={
                <ProtectedRoute adminRequired={true}>
                  <AdminFeedback />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}const AppWithProviders = () => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render of entire app when language changes
      setKey(prevKey => prevKey + 1);
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div key={key}>
          <App />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default AppWithProviders;
