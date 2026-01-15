import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  styled,
} from '@mui/material';
import {
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  MoreVert,
  Refresh,
  Dashboard,
  FilterList,
  Assignment,
  Gavel,
  Block,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import reportService from '../services/reportService';

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(240,245,255,0.25) 50%, rgba(255,255,255,0.1) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.2)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(240,245,255,0.3) 50%, rgba(255,255,255,0.15) 100%)',
  },
}));

const PriorityCard = styled(Card)(({ priority }) => {
  const getColor = () => {
    if (priority >= 5) return '#f44336'; // Red
    if (priority >= 4) return '#ff9800'; // Orange
    if (priority >= 3) return '#ffc107'; // Yellow
    return '#4caf50'; // Green
  };

  const getGradientColors = () => {
    if (priority >= 5) return 'rgba(244,67,54,0.15), rgba(255,255,255,0.1), rgba(244,67,54,0.08)'; // Red tint
    if (priority >= 4) return 'rgba(255,152,0,0.15), rgba(255,255,255,0.1), rgba(255,152,0,0.08)'; // Orange tint
    if (priority >= 3) return 'rgba(255,193,7,0.15), rgba(255,255,255,0.1), rgba(255,193,7,0.08)'; // Yellow tint
    return 'rgba(76,175,80,0.15), rgba(255,255,255,0.1), rgba(76,175,80,0.08)'; // Green tint
  };

  return {
    borderLeft: `4px solid ${getColor()}`,
    borderRadius: 16,
    background: `linear-gradient(135deg, ${getGradientColors()})`,
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      background: `linear-gradient(135deg, ${getGradientColors().replace(/0\.15/g, '0.2').replace(/0\.1/g, '0.15').replace(/0\.08/g, '0.12')})`,
    },
  };
});

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    category: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuReport, setMenuReport] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filters, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let queryFilters = { ...filters };
      
      // Apply tab-based filtering
      switch (selectedTab) {
        case 0: // All
          break;
        case 1: // Pending
          queryFilters.status = 'pending';
          break;
        case 2: // Under Review
          queryFilters.status = 'under_review';
          break;
        case 3: // High Priority
          // Will filter on frontend
          break;
      }

      const response = await reportService.getAllReports(page, 20, queryFilters);
      let filteredReports = response.reports;

      // Filter high priority on frontend
      if (selectedTab === 3) {
        filteredReports = response.reports.filter(report => report.priority >= 4);
      }

      setReports(filteredReports);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await reportService.getReportStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setPage(1);
    // Reset status filter when changing tabs
    if (newValue === 0 || newValue === 3) {
      setFilters(prev => ({ ...prev, status: '' }));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleMenuOpen = (event, report) => {
    setAnchorEl(event.currentTarget);
    setMenuReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReport(null);
  };

  const openActionDialog = (report, type) => {
    setSelectedReport(report);
    setActionType(type);
    setActionDialog(true);
    setActionNotes('');
    handleMenuClose();
  };

  const handleStatusUpdate = async () => {
    if (!selectedReport || !actionType) return;

    try {
      let status = actionType;
      let notes = actionNotes;

      await reportService.updateReportStatus(selectedReport.id, status, notes, notes);
      
      setActionDialog(false);
      setSelectedReport(null);
      setActionNotes('');
      fetchReports();
      fetchStats();
      
      // Show success message
      setError('');
    } catch (error) {
      console.error('Error updating report:', error);
      setError('Failed to update report status. Please try again.');
    }
  };

  const handleTakeAction = async (report) => {
    try {
      const result = await reportService.takeActionOnReportedItem(report.id);
      
      if (result.success) {
        fetchReports();
        fetchStats();
        setError('');
      }
    } catch (error) {
      console.error('Error taking action:', error);
      setError('Failed to take action. Please try again.');
    }
  };

  const handleDeleteReport = async (report) => {
    if (window.confirm('Are you sure you want to delete this report? This will notify the user that the report was investigated and found to be incorrect.')) {
      try {
        await reportService.deleteReport(report.id);
        fetchReports();
        fetchStats();
        setError('');
      } catch (error) {
        console.error('Error deleting report:', error);
        setError('Failed to delete report. Please try again.');
      }
    }
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

  const tabCounts = stats ? {
    0: stats.totalReports,
    1: stats.reportsByStatus?.pending || 0,
    2: stats.reportsByStatus?.under_review || 0,
    3: reports.filter(r => r.priority >= 4).length,
  } : {};

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 4,
      pb: 8
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
          {/* Dashboard Button - Positioned top right */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            right: 0,
            display: { xs: 'none', md: 'block' }
          }}>
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="contained"
              startIcon={<Dashboard />}
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(240,245,255,0.25) 50%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: 3,
                px: 3,
                py: 1,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(240,245,255,0.3) 50%, rgba(255,255,255,0.15) 100%)',
                },
              }}
            >
              Admin Dashboard
            </Button>
          </Box>

          {/* Mobile Dashboard Button */}
          <Box sx={{ 
            display: { xs: 'block', md: 'none' },
            mb: 2
          }}>
            <Button
              onClick={() => navigate('/admin/dashboard')}
              variant="contained"
              startIcon={<Dashboard />}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(240,245,255,0.25) 50%, rgba(255,255,255,0.1) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%)',
                },
              }}
            >
              Admin Dashboard
            </Button>
          </Box>

          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #ffffff 100%)',
              backgroundSize: '300% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '3rem' },
              textShadow: '0 4px 20px rgba(255,255,255,0.3)',
              mb: 2,
            }}
          >
            🛡️ Reports Management
          </Typography>
          <Typography 
            variant="h6" 
            color="rgba(255,255,255,0.85)"
            sx={{ 
              fontWeight: 400,
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            Review and manage community reports
          </Typography>
        </Box>

        {/* Stats Overview */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {stats.totalReports}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Total Reports
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {stats.pendingReports}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Pending Review
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {stats.resolvedReports}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Resolved
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 'bold', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    {Math.round(stats.averageResolutionTime)}h
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    Avg Resolution
                  </Typography>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <StyledCard sx={{ mb: 4 }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ 
              '& .MuiTab-root': { 
                fontWeight: 600,
                textTransform: 'none',
                color: 'rgba(255,255,255,0.8)',
              },
              '& .Mui-selected': {
                color: '#ffffff !important',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#ffffff',
              }
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={tabCounts[0]} color="primary">
                  All Reports
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts[1]} color="warning">
                  Pending
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts[2]} color="info">
                  Under Review
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={tabCounts[3]} color="error">
                  High Priority
                </Badge>
              } 
            />
          </Tabs>
        </StyledCard>

        {/* Filters */}
        <StyledCard sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterList sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                Filters
              </Typography>
              <Box sx={{ ml: 'auto' }}>
                <Button 
                  onClick={fetchReports}
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {reportService.getReportTypes().map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {reportService.getTypeIcon(type.value)} {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {reportService.getReportCategories().map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {reportService.getCategoryIcon(cat.value)} {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    size="small"
                    disabled={selectedTab === 1 || selectedTab === 2}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    {reportService.getReportStatuses().map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {reportService.getStatusIcon(status.value)} {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </StyledCard>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : reports.length === 0 ? (
          <StyledCard>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }} gutterBottom>
                📝 No reports found
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                No reports match the current filters.
              </Typography>
            </CardContent>
          </StyledCard>
        ) : (
          <>
            {/* Reports List */}
            <Box sx={{ mb: 4 }}>
              {reports.map((report) => (
                <PriorityCard key={report.id} priority={report.priority} sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                            {reportService.getTypeIcon(report.type)} {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                          </Typography>
                          <Chip 
                            label={reportService.getStatusIcon(report.status) + ' ' + report.status.replace('_', ' ')}
                            color={report.status === 'pending' ? 'warning' : report.status === 'resolved' ? 'success' : 'default'}
                            size="small"
                          />
                          {report.priority >= 4 && (
                            <Chip 
                              label={`🚨 Priority ${report.priority}`}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                          {reportService.getCategoryIcon(report.category)} {report.category.replace('_', ' ')} • 
                          Reported by {report.reportedBy.name} • {getTimeAgo(report.createdAt)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.9)' }}>
                          {report.description}
                        </Typography>
                        {report.targetInfo && !report.targetInfo.deleted && (
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(103, 126, 234, 0.1)', 
                            borderRadius: 2,
                            mb: 2
                          }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ffffff' }}>
                              Reported Item: {report.targetInfo.title || report.targetInfo.name || report.targetInfo.id}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton onClick={(e) => handleMenuOpen(e, report)}>
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Quick Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {report.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Assignment />}
                            onClick={() => openActionDialog(report, 'under_review')}
                          >
                            Start Review
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Gavel />}
                            onClick={() => handleTakeAction(report)}
                          >
                            Take Action
                          </Button>
                        </>
                      )}
                      {report.status === 'under_review' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => openActionDialog(report, 'action_taken')}
                          >
                            Mark Resolved
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<Cancel />}
                            onClick={() => openActionDialog(report, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>
                </PriorityCard>
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Button 
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  variant="outlined"
                >
                  Previous
                </Button>
                <Typography sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  px: 2,
                  color: 'white',
                  fontWeight: 600
                }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button 
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  variant="outlined"
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => openActionDialog(menuReport, 'under_review')}>
            <ListItemIcon><Assignment /></ListItemIcon>
            <ListItemText>Start Review</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => openActionDialog(menuReport, 'action_taken')}>
            <ListItemIcon><CheckCircle /></ListItemIcon>
            <ListItemText>Mark as Resolved</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => openActionDialog(menuReport, 'dismissed')}>
            <ListItemIcon><Cancel /></ListItemIcon>
            <ListItemText>Dismiss Report</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleTakeAction(menuReport)} sx={{ color: 'error.main' }}>
            <ListItemIcon><Gavel sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>Take Direct Action</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDeleteReport(menuReport)} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete sx={{ color: 'error.main' }} /></ListItemIcon>
            <ListItemText>Delete Report</ListItemText>
          </MenuItem>
        </Menu>

        {/* Action Dialog */}
        <Dialog 
          open={actionDialog} 
          onClose={() => setActionDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Update Report Status
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Report: {selectedReport?.type} - {selectedReport?.category}
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {selectedReport?.description}
              </Typography>
              
              <TextField
                label="Admin Notes / Action Details"
                multiline
                rows={4}
                fullWidth
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Describe the action taken or reason for status change..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} variant="contained">
              Update Status
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AdminReports;
