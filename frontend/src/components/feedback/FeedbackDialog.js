import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Select,
  MenuItem,
  Rating,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Fade,
  Zoom,
  Autocomplete,
  IconButton,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { clubService } from '../../services/clubService';
import { eventService } from '../../services/eventService';

const FeedbackDialog = ({ 
  open, 
  onClose, 
  targetType = 'general', 
  targetId = null, 
  targetName = '',
  onFeedbackSubmitted 
}) => {
  const [formData, setFormData] = useState({
    targetType,
    targetId,
    rating: 0,
    comment: '',
    category: 'general',
    isAnonymous: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const categories = {
    general: 'General Feedback',
    organization: 'Organization & Structure',
    communication: 'Communication',
    facilities: 'Facilities',
    content: 'Content Quality',
    instructor: 'Instructor/Leader',
    other: 'Other',
  };

  const targetTypes = {
    general: 'General',
    club: 'Club',
    event: 'Event',
  };

  useEffect(() => {
    if (open) {
      setFormData({
        targetType,
        targetId,
        rating: 0,
        comment: '',
        category: 'general',
        isAnonymous: false,
      });
      setError('');
      setSuccess(false);
      setSelectedTarget(null);
      fetchUserData();
    }
  }, [open, targetType, targetId]);

  const fetchUserData = async () => {
    try {
      setLoadingData(true);
      const [clubsResponse, eventsResponse] = await Promise.all([
        clubService.getMyClubs(),
        eventService.getRegisteredEvents(),
      ]);

      // Combine created and joined clubs
      const createdClubs = clubsResponse.createdClubs || [];
      const joinedClubs = clubsResponse.joinedClubs || [];
      const allClubs = [...createdClubs];
      joinedClubs.forEach(joinedClub => {
        const isAlreadyIncluded = createdClubs.some(createdClub => 
          createdClub._id === joinedClub._id
        );
        if (!isAlreadyIncluded) {
          allClubs.push(joinedClub);
        }
      });
      setUserClubs(allClubs);

      // Filter past attended events
      const now = new Date();
      const pastEvents = (eventsResponse.data || []).filter(event => {
        const eventDate = new Date(event.date);
        return eventDate < now;
      });
      setUserEvents(pastEvents);
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      setError('Please provide a rating');
      return;
    }
    
    if (!formData.comment.trim()) {
      setError('Please provide your feedback comment');
      return;
    }

    // Validate target selection for club/event feedback
    if (formData.targetType === 'club' && !selectedTarget) {
      setError('Please select a club');
      return;
    }

    if (formData.targetType === 'event' && !selectedTarget) {
      setError('Please select a past event');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const submitData = {
        ...formData,
        targetId: selectedTarget?._id || formData.targetId,
      };

      const response = await fetch('http://localhost:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      setSuccess(true);
      
      // Call callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(data.data);
      }

      // Auto close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (value) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent',
    };
    return labels[value] || '';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          background: '#fff',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
              <FeedbackIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.25rem' }}>
                Share Your Feedback
              </Typography>
              {targetName && (
                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                  About: {targetName}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: '#999' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Alerts */}
        {success && (
          <Zoom in={success}>
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { color: '#4caf50' }
              }}
            >
              Feedback submitted successfully! Thank you.
            </Alert>
          </Zoom>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Target Type */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
              Feedback Type <span style={{ color: '#e74c3c' }}>*</span>
            </Typography>
            <Select
              value={formData.targetType}
              onChange={(e) => {
                handleInputChange('targetType', e.target.value);
                setSelectedTarget(null);
              }}
              fullWidth
              disabled={loadingData}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }}
            >
              {Object.entries(targetTypes).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Club Selection */}
          {formData.targetType === 'club' && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                Select Club <span style={{ color: '#e74c3c' }}>*</span>
              </Typography>
              <Autocomplete
                value={selectedTarget}
                onChange={(event, newValue) => setSelectedTarget(newValue)}
                options={userClubs}
                getOptionLabel={(option) => option.name || ''}
                loading={loadingData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choose a club you're member of"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingData ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description?.substring(0, 60)}...
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="No clubs available"
              />
            </Box>
          )}

          {/* Event Selection */}
          {formData.targetType === 'event' && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                Select Event <span style={{ color: '#e74c3c' }}>*</span>
              </Typography>
              <Autocomplete
                value={selectedTarget}
                onChange={(event, newValue) => setSelectedTarget(newValue)}
                options={userEvents}
                getOptionLabel={(option) => option.title || ''}
                loading={loadingData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Choose a past event you attended"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingData ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': { borderColor: '#e0e0e0' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                      },
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(option.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="No past events available"
              />
            </Box>
          )}

          {/* Category */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
              Category
            </Typography>
            <Select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              fullWidth
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e0e0e0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea', borderWidth: 2 },
              }}
            >
              {Object.entries(categories).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </Box>

          {/* Rating */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1.5 }}>
              Rating <span style={{ color: '#e74c3c' }}>*</span>
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e0e0e0',
              background: '#fafafa',
            }}>
              <Rating
                value={formData.rating}
                onChange={(event, newValue) => handleInputChange('rating', newValue)}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#ffd700' },
                  '& .MuiRating-iconHover': { color: '#ffd700' },
                }}
              />
              {formData.rating > 0 && (
                <Chip 
                  label={getRatingLabel(formData.rating)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Comment */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
              Your Feedback <span style={{ color: '#e74c3c' }}>*</span>
            </Typography>
            <TextField
              multiline
              rows={4}
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Share your thoughts and experience..."
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#e0e0e0' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea', borderWidth: 2 },
                },
              }}
            />
          </Box>

          {/* Anonymous */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.isAnonymous}
                onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#667eea' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#667eea' },
                }}
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Submit anonymously</Typography>}
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid #f0f0f0' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              borderColor: '#e0e0e0',
              color: '#666',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#999',
                background: '#fafafa',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || formData.rating === 0 || !formData.comment.trim()}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 6px 16px rgba(102,126,234,0.4)',
              },
              '&:disabled': {
                background: '#e0e0e0',
                color: '#999',
                boxShadow: 'none',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default FeedbackDialog;
