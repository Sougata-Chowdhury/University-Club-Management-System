import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Rating,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  LinearProgress,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingIcon,
  Assessment as AssessmentIcon,
  RateReview as ReviewIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as PendingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  MoreVert as MoreIcon,
  Star as StarIcon,
  Comment as CommentIcon,
  ThumbUp as ThumbUpIcon,
  Filter as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';
import adminService from '../../services/adminService';
import feedbackService from '../../services/feedbackService';

// Styled components for glass morphism effect
const StyledCard = styled(Card)(({ theme, priority = 'default' }) => {
  const getCardColors = () => {
    switch (priority) {
      case 'high':
        return {
          primary: 'rgba(255, 82, 82, 0.15)',
          secondary: 'rgba(255, 82, 82, 0.08)',
          border: 'rgba(255, 82, 82, 0.2)',
          hover: 'rgba(255, 82, 82, 0.25)',
        };
      case 'medium':
        return {
          primary: 'rgba(255, 193, 7, 0.15)',
          secondary: 'rgba(255, 193, 7, 0.08)',
          border: 'rgba(255, 193, 7, 0.2)',
          hover: 'rgba(255, 193, 7, 0.25)',
        };
      case 'low':
        return {
          primary: 'rgba(76, 175, 80, 0.15)',
          secondary: 'rgba(76, 175, 80, 0.08)',
          border: 'rgba(76, 175, 80, 0.2)',
          hover: 'rgba(76, 175, 80, 0.25)',
        };
      default:
        return {
          primary: 'rgba(102, 126, 234, 0.15)',
          secondary: 'rgba(102, 126, 234, 0.08)',
          border: 'rgba(102, 126, 234, 0.2)',
          hover: 'rgba(102, 126, 234, 0.25)',
        };
    }
  };

  const colors = getCardColors();

  return {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${colors.border}`,
    borderRadius: theme.spacing(2),
    boxShadow: `0 8px 32px rgba(31, 38, 135, 0.37)`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      background: `linear-gradient(135deg, ${colors.hover} 0%, ${colors.primary} 100%)`,
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px rgba(31, 38, 135, 0.5)`,
    },
  };
});

const GlassPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.15)',
    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
  },
}));

const AdminFeedback = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    targetType: '',
    rating: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0,
  });

  const tabs = [
    { label: 'All Feedback', value: 'all', icon: <DashboardIcon /> },
    { label: 'Pending Review', value: 'pending', icon: <PendingIcon /> },
    { label: 'Under Review', value: 'under_review', icon: <ReviewIcon /> },
    { label: 'Approved', value: 'approved', icon: <ApprovedIcon /> },
    { label: 'Rejected', value: 'rejected', icon: <RejectedIcon /> },
  ];

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [activeTab, pagination.page, pagination.rowsPerPage, filters]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      console.log('AdminFeedback: Fetching feedback with params:', {
        page: pagination.page + 1,
        limit: pagination.rowsPerPage,
        status: tabs[activeTab].value !== 'all' ? tabs[activeTab].value : undefined,
        ...filters
      });

      const params = {
        page: pagination.page + 1,
        limit: pagination.rowsPerPage,
        ...filters,
      };

      if (tabs[activeTab].value !== 'all') {
        params.status = tabs[activeTab].value;
      }

      const response = await adminService.getAllFeedback(params);
      console.log('AdminFeedback: Received feedback data:', response);

      if (response && response.feedback) {
        setFeedback(response.feedback);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
        }));
      } else {
        setFeedback([]);
        setPagination(prev => ({ ...prev, total: 0 }));
      }

    } catch (error) {
      console.error('AdminFeedback: Error fetching feedback:', error);
      setError(error.message || 'Failed to fetch feedback');
      setFeedback([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('AdminFeedback: Fetching feedback stats...');
      const response = await feedbackService.getFeedbackStats();
      console.log('AdminFeedback: Received stats data:', response);
      
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('AdminFeedback: Error fetching stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleMenuOpen = (event, feedback) => {
    console.log('AdminFeedback: handleMenuOpen called with feedback:', feedback);
    setMenuAnchor(event.currentTarget);
    setSelectedFeedback(feedback);
    console.log('AdminFeedback: Menu opened, selectedFeedback set to:', feedback);
  };

  const handleMenuClose = () => {
    console.log('AdminFeedback: Menu closed');
    setMenuAnchor(null);
    // Don't clear selectedFeedback here - it's needed for status update
  };

  const clearSelectedFeedback = () => {
    console.log('AdminFeedback: Clearing selected feedback');
    setSelectedFeedback(null);
  };

  const handleStatusUpdate = () => {
    console.log('AdminFeedback: handleStatusUpdate called with selectedFeedback:', selectedFeedback);
    if (!selectedFeedback) {
      console.error('AdminFeedback: No feedback selected');
      setError('No feedback selected');
      return;
    }
    setSelectedStatus(selectedFeedback.status);
    setAdminResponse(selectedFeedback.adminResponse || '');
    setStatusDialogOpen(true);
    // Close menu but keep selectedFeedback for the dialog
    setMenuAnchor(null);
    console.log('AdminFeedback: Status dialog opened');
  };

  const confirmStatusUpdate = async () => {
    try {
      console.log('AdminFeedback: confirmStatusUpdate started');
      console.log('AdminFeedback: selectedFeedback:', selectedFeedback);
      console.log('AdminFeedback: selectedStatus:', selectedStatus);
      console.log('AdminFeedback: adminResponse:', adminResponse);
      
      if (!selectedFeedback) {
        console.error('AdminFeedback: No feedback selected for status update');
        setError('No feedback selected');
        return;
      }

      if (!selectedStatus) {
        console.error('AdminFeedback: No status selected');
        setError('Please select a status');
        return;
      }

      setUpdateLoading(true);
      setError(''); // Clear previous errors

      console.log('AdminFeedback: Updating feedback status:', {
        feedbackId: selectedFeedback._id,
        status: selectedStatus,
        adminResponse: adminResponse.trim() || undefined
      });

      const statusData = {
        status: selectedStatus,
        adminResponse: adminResponse.trim() || undefined,
      };

      const response = await adminService.updateFeedbackStatus(selectedFeedback._id, statusData);
      console.log('AdminFeedback: Status update response:', response);

      // Refresh the data to show updated status
      console.log('AdminFeedback: Refreshing data after status update...');
      await Promise.all([fetchFeedback(), fetchStats()]);
      
      setStatusDialogOpen(false);
      setAdminResponse('');
      setSelectedStatus('');
      clearSelectedFeedback();
      
      console.log('AdminFeedback: Status update completed successfully');
    } catch (error) {
      console.error('AdminFeedback: Error updating status:', error);
      setError(error.message || 'Failed to update feedback status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff6f00',    // Brighter orange
      approved: '#2e7d32',   // Darker green 
      rejected: '#c62828',   // Darker red
      under_review: '#1565c0', // Darker blue
    };
    return colors[status] || '#424242';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      under_review: 'Under Review',
    };
    return labels[status] || status;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#4caf50';
    if (rating >= 3) return '#ff9800';
    return '#f44336';
  };

  const StatsCard = ({ title, value, icon, color, subtitle, percentage }) => (
    <Zoom in={true} timeout={300}>
      <StyledCard>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: color }}>
                {value}
              </Typography>
              <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar sx={{ 
              bgcolor: alpha(color, 0.2), 
              color: color,
              border: `2px solid ${alpha(color, 0.3)}`,
            }}>
              {icon}
            </Avatar>
          </Box>
          
          {percentage !== undefined && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(color, 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.8)})`,
                  },
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', fontWeight: 'medium' }}>
                {percentage.toFixed(1)}% of total
              </Typography>
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </Zoom>
  );

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #4c63d2 50%, #667eea 75%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 85% 75%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography 
          variant="h3" 
          fontWeight="bold" 
          gutterBottom
          sx={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          Feedback Management
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }} gutterBottom>
          Review and manage user feedback
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => { fetchFeedback(); fetchStats(); }}
          sx={{
            mt: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
            color: '#4c63d2',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
              boxShadow: '0 6px 25px rgba(255, 255, 255, 0.4)',
              transform: 'translateY(-1px)',
            },
          }}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Statistics */}
      {stats && (
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatsCard
                title="Total Feedback"
                value={stats.totalFeedback}
                icon={<CommentIcon />}
                color="#667eea"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatsCard
                title="Average Rating"
                value={stats.averageRating.toFixed(1)}
                icon={<StarIcon />}
                color="#f093fb"
                subtitle="out of 5 stars"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatsCard
                title="Pending Review"
                value={stats.pendingReview}
                icon={<PendingIcon />}
                color="#ff9800"
                percentage={stats.totalFeedback > 0 ? (stats.pendingReview / stats.totalFeedback) * 100 : 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatsCard
                title="High Rated"
                value={stats.highRatedFeedback}
                icon={<TrendingIcon />}
                color="#4caf50"
                subtitle="4-5 stars"
                percentage={stats.totalFeedback > 0 ? (stats.highRatedFeedback / stats.totalFeedback) * 100 : 0}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <StatsCard
                title="Recent Feedback"
                value={stats.recentFeedback}
                icon={<AssessmentIcon />}
                color="#4facfe"
                subtitle="last 30 days"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#d32f2f',
            borderLeft: '4px solid #d32f2f',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <GlassPaper elevation={0} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: `1px solid ${alpha('#667eea', 0.2)}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: '#667eea',
                fontWeight: 'bold',
              },
            },
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {/* Filters */}
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="organization">Organization</MenuItem>
                  <MenuItem value="communication">Communication</MenuItem>
                  <MenuItem value="facilities">Facilities</MenuItem>
                  <MenuItem value="content">Content</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={filters.targetType}
                  label="Target Type"
                  onChange={(e) => handleFilterChange('targetType', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="club">Club</MenuItem>
                  <MenuItem value="event">Event</MenuItem>
                  <MenuItem value="announcement">Announcement</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="course">Course</MenuItem>
                  <MenuItem value="instructor">Instructor</MenuItem>
                  <MenuItem value="facility">Facility</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Rating</InputLabel>
                <Select
                  value={filters.rating}
                  label="Rating"
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(102, 126, 234, 0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <MenuItem value="">All Ratings</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                  <MenuItem value="4">4 Stars</MenuItem>
                  <MenuItem value="3">3 Stars</MenuItem>
                  <MenuItem value="2">2 Stars</MenuItem>
                  <MenuItem value="1">1 Star</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ category: '', targetType: '', rating: '' })}
                fullWidth
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'text.primary',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: '#667eea',
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </GlassPaper>

      {/* Feedback Table */}
      <GlassPaper elevation={0}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Comment</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Helpful</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress sx={{ color: '#667eea' }} />
                  </TableCell>
                </TableRow>
              ) : feedback.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No feedback found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                feedback.map((item) => (
                  <TableRow 
                    key={item._id} 
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.08)',
                        backdropFilter: 'blur(10px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: item.isAnonymous ? alpha('#757575', 0.2) : '#667eea',
                            width: 32, 
                            height: 32,
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.isAnonymous ? '?' : (
                            (item.userId?.name || (item.userId?.firstName && item.userId?.lastName ? 
                              `${item.userId.firstName} ${item.userId.lastName}` : null))?.charAt(0).toUpperCase() || 'U'
                          )}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {item.isAnonymous ? 'Anonymous' : 
                              item.userId?.name || 
                              (item.userId?.firstName && item.userId?.lastName ? 
                                `${item.userId.firstName} ${item.userId.lastName}` : 
                                'Unknown')
                            }
                          </Typography>
                          {!item.isAnonymous && (
                            <Typography variant="caption" color="text.secondary">
                              {item.userId?.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={item.rating} readOnly size="small" />
                        <Chip
                          label={item.rating}
                          size="small"
                          sx={{
                            bgcolor: alpha(getRatingColor(item.rating), 0.1),
                            color: getRatingColor(item.rating),
                            minWidth: 40,
                          }}
                        />
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={item.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.targetType}
                        </Typography>
                        {item.targetInfo && (
                          <Typography variant="caption" color="text.secondary">
                            {item.targetInfo.name || item.targetInfo.title}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title={item.comment} arrow>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.comment}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={getStatusLabel(item.status)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getStatusColor(item.status), 0.9),
                          color: 'white',
                          fontWeight: 'bold',
                          border: `2px solid ${getStatusColor(item.status)}`,
                          '& .MuiChip-label': {
                            color: 'white',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {formatDistanceToNow(new Date(item.createdAt))} ago
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Badge badgeContent={item.helpfulVotes || 0} color="primary">
                        <ThumbUpIcon color="action" />
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          console.log('AdminFeedback: Menu button clicked for feedback:', item);
                          console.log('AdminFeedback: Feedback ID:', item._id);
                          console.log('AdminFeedback: Feedback status:', item.status);
                          handleMenuOpen(e, item);
                        }}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={(event, newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
          rowsPerPage={pagination.rowsPerPage}
          onRowsPerPageChange={(event) => setPagination(prev => ({ 
            ...prev, 
            rowsPerPage: parseInt(event.target.value, 10),
            page: 0
          }))}
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiTablePagination-toolbar': {
              color: 'text.primary',
            },
            '& .MuiTablePagination-select': {
              color: 'text.primary',
            },
            '& .MuiTablePagination-actions button': {
              color: '#667eea',
            },
          }}
        />
      </GlassPaper>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          handleMenuClose();
          // Clear selected feedback if dialog is not opening
          setTimeout(() => {
            if (!statusDialogOpen) {
              clearSelectedFeedback();
            }
          }, 100);
        }}
      >
        <MenuItem onClick={handleStatusUpdate}>
          <EditIcon sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
        <MenuItem onClick={() => {
          console.log('AdminFeedback: View Details clicked');
          // TODO: Implement view details functionality
          handleMenuClose();
          clearSelectedFeedback();
        }}>
          <ViewIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={() => {
          console.log('AdminFeedback: Status dialog closed');
          setStatusDialogOpen(false);
          setAdminResponse('');
          setSelectedStatus('');
          setError('');
          setUpdateLoading(false);
          clearSelectedFeedback();
        }} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          Update Feedback Status
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#d32f2f',
                borderLeft: '4px solid #d32f2f',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(102, 126, 234, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              >
                <MenuItem value="pending">Pending Review</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Admin Response (Optional)"
              multiline
              rows={4}
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              placeholder="Provide feedback or explanation..."
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => {
              console.log('AdminFeedback: Cancel button clicked');
              setStatusDialogOpen(false);
              setAdminResponse('');
              setSelectedStatus('');
              setError('');
              setUpdateLoading(false);
              clearSelectedFeedback();
            }}
            disabled={updateLoading}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                color: 'rgba(255, 255, 255, 1)',
              },
              '&:disabled': {
                opacity: 0.5,
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmStatusUpdate} 
            variant="contained"
            disabled={updateLoading || !selectedStatus}
            startIcon={updateLoading ? <CircularProgress size={16} /> : null}
            sx={{
              background: updateLoading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%)',
              color: '#4c63d2',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)',
              '&:hover': {
                background: updateLoading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
                boxShadow: '0 6px 25px rgba(255, 255, 255, 0.4)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {updateLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default AdminFeedback;
