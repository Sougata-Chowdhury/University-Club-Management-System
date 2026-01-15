import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Grid,
  Paper,
  Fade,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Reply as ReplyIcon,
  Flag as FlagIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Verified as VerifiedIcon,
  Person as AnonymousIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { formatDistanceToNow } from 'date-fns';

const FeedbackCard = ({ 
  feedback, 
  currentUser, 
  isAdmin = false, 
  onVote, 
  onStatusUpdate, 
  onDelete,
  showActions = true 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(feedback.status);

  const isOwner = currentUser && feedback.userId && feedback.userId._id === currentUser.id;
  const hasVoted = feedback.votedUsers?.some(userId => userId === currentUser?.id);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleVote = async () => {
    if (voteLoading || hasVoted) return;

    setVoteLoading(true);
    try {
      await onVote(feedback._id, { helpful: true });
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleAdminUpdate = async () => {
    try {
      await onStatusUpdate(feedback._id, {
        status: selectedStatus,
        adminResponse: adminResponse.trim() || undefined,
      });
      setAdminDialogOpen(false);
      setAdminResponse('');
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      approved: '#4caf50',
      rejected: '#f44336',
      under_review: '#2196f3',
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      under_review: 'Under Review',
    };
    return labels[status] || status;
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: '#667eea',
      organization: '#f093fb',
      communication: '#4facfe',
      facilities: '#43e97b',
      content: '#fa709a',
      instructor: '#ffecd2',
      other: '#a8edea',
    };
    return colors[category] || '#667eea';
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#4caf50';
    if (rating >= 3) return '#ff9800';
    return '#f44336';
  };

  return (
    <Fade in={true} timeout={300}>
      <Card 
        sx={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          mb: 2,
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
        }}
      >
        {/* Rating Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: 20,
            background: `linear-gradient(135deg, ${getRatingColor(feedback.rating)} 0%, ${alpha(getRatingColor(feedback.rating), 0.8)} 100%)`,
            color: 'white',
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1,
          }}
        >
          <StarIcon fontSize="small" />
          <Typography variant="body2" fontWeight="bold">
            {feedback.rating}
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {feedback.isAnonymous ? (
                <Avatar sx={{ bgcolor: alpha('#667eea', 0.2), color: '#667eea' }}>
                  <AnonymousIcon />
                </Avatar>
              ) : (
                <Avatar
                  sx={{
                    bgcolor: '#667eea',
                    color: 'white',
                  }}
                >
                  {feedback.userId?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              )}
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {feedback.isAnonymous ? 'Anonymous User' : feedback.userId?.name || 'Unknown User'}
                  </Typography>
                  {feedback.isVerified && (
                    <Tooltip title="Verified Feedback">
                      <VerifiedIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                    </Tooltip>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={getStatusLabel(feedback.status)}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(feedback.status), 0.1),
                      color: getStatusColor(feedback.status),
                      fontWeight: 'bold',
                    }}
                  />
                  
                  <Chip
                    label={feedback.category}
                    size="small"
                    sx={{
                      bgcolor: alpha(getCategoryColor(feedback.category), 0.1),
                      color: getCategoryColor(feedback.category),
                    }}
                  />
                  
                  {feedback.targetType && (
                    <Chip
                      label={feedback.targetType}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: alpha('#667eea', 0.3) }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            {showActions && (
              <IconButton onClick={handleMenuOpen} size="small">
                <MoreIcon />
              </IconButton>
            )}
          </Box>

          {/* Target Info */}
          {feedback.targetInfo && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 2, 
                background: alpha('#667eea', 0.05),
                border: `1px solid ${alpha('#667eea', 0.1)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Feedback about:
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold">
                {feedback.targetInfo.name || feedback.targetInfo.title}
              </Typography>
            </Paper>
          )}

          {/* Comment */}
          <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
            {feedback.comment}
          </Typography>

          {/* Admin Response */}
          {feedback.adminResponse && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 2, 
                background: alpha('#4caf50', 0.05),
                border: `1px solid ${alpha('#4caf50', 0.2)}`,
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Admin Response:
              </Typography>
              <Typography variant="body2">
                {feedback.adminResponse}
              </Typography>
              {feedback.respondedAt && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Responded {formatDistanceToNow(new Date(feedback.respondedAt))} ago
                </Typography>
              )}
            </Paper>
          )}

          {/* Footer */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(feedback.createdAt))} ago
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showActions && onVote && (
                <Button
                  size="small"
                  startIcon={hasVoted ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                  onClick={handleVote}
                  disabled={voteLoading || hasVoted}
                  sx={{
                    color: hasVoted ? '#4caf50' : 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha('#4caf50', 0.1),
                    },
                  }}
                >
                  {feedback.helpfulVotes || 0}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {isAdmin && (
            <MenuItem onClick={() => { setAdminDialogOpen(true); handleMenuClose(); }}>
              <EditIcon sx={{ mr: 1 }} />
              Update Status
            </MenuItem>
          )}
          
          {(isOwner || isAdmin) && (
            <MenuItem 
              onClick={() => { onDelete(feedback._id); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          )}
          
          {!isOwner && (
            <MenuItem onClick={handleMenuClose}>
              <FlagIcon sx={{ mr: 1 }} />
              Report
            </MenuItem>
          )}
        </Menu>

        {/* Admin Status Update Dialog */}
        <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Feedback Status</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                select
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                fullWidth
              >
                <MenuItem value="pending">Pending Review</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </TextField>
              
              <TextField
                label="Admin Response (Optional)"
                multiline
                rows={3}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Provide feedback or explanation..."
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminUpdate} variant="contained">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Fade>
  );
};

export default FeedbackCard;
