import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Fade,
  Zoom,
  IconButton,
  Avatar,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Feedback as FeedbackIcon,
  Category as CategoryIcon,
  Comment as CommentIcon,
  Group as ClubIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { clubService } from '../../services/clubService';

// Styled components for modern glassmorphism effect
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '24px',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    },
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '24px 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& .MuiTypography-root': {
    fontWeight: 600,
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
}));

const StyledRating = styled(Rating)(({ theme }) => ({
  fontSize: '2.5rem',
  '& .MuiRating-iconFilled': {
    color: '#ffd700',
    filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))',
  },
  '& .MuiRating-iconEmpty': {
    color: alpha('#ffd700', 0.3),
  },
  '& .MuiRating-iconHover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s ease-in-out',
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.9)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    },
    '&.Mui-focused': {
      background: 'white',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.25)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const StyledButton = styled(Button)(({ theme, variant: buttonVariant }) => ({
  borderRadius: '16px',
  fontWeight: 600,
  textTransform: 'none',
  padding: '12px 24px',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  ...(buttonVariant === 'contained' && {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.35)',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 35px rgba(102, 126, 234, 0.45)',
    },
  }),
}));

const CategoryChip = styled(Chip)(({ theme, selected }) => ({
  borderRadius: '20px',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  ...(selected ? {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    transform: 'translateY(-2px)',
  } : {
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    border: '1px solid rgba(102, 126, 234, 0.3)',
    '&:hover': {
      background: 'rgba(102, 126, 234, 0.2)',
      transform: 'translateY(-1px)',
    },
  }),
}));

const FeedbackForm = ({ 
  open, 
  onClose, 
  targetType = 'general', 
  targetId = null, 
  targetInfo = null,
  onSubmit 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rating: 5,
    category: 'general',
    comment: '',
    isAnonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [feedbackType, setFeedbackType] = useState('general'); // 'general' or 'club'
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingClubs, setLoadingClubs] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCurrentUser();
      fetchUserClubs();
    }
  }, [open]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchUserClubs = async (retryCount = 0) => {
    try {
      setLoadingClubs(true);
      console.log('FeedbackForm: Fetching user clubs...');
      
      // Debug authentication
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('FeedbackForm: Authentication debug:');
      console.log('- Token exists:', !!token);
      console.log('- Token length:', token ? token.length : 0);
      console.log('- User data:', user);
      
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('- Decoded token:', decoded);
          console.log('- User ID from token:', decoded.userId);
          console.log('- Token expiry:', new Date(decoded.exp * 1000));
          console.log('- Is token expired:', Date.now() >= decoded.exp * 1000);
        } catch (e) {
          console.error('- Token decode error:', e);
        }
      }
      
      const response = await clubService.getMyClubs();
      console.log('FeedbackForm: User clubs response:', response);
      console.log('FeedbackForm: Response type:', typeof response);
      console.log('FeedbackForm: Response keys:', Object.keys(response || {}));
      
      // Handle response directly like MyClubs does
      if (response && typeof response === 'object') {
        console.log('FeedbackForm: Processing response directly');
        
        // Combine created clubs and joined clubs into one array
        const createdClubs = response.createdClubs || [];
        const joinedClubs = response.joinedClubs || [];
        
        console.log('FeedbackForm: Created clubs array:', createdClubs);
        console.log('FeedbackForm: Joined clubs array:', joinedClubs);
        console.log('FeedbackForm: Created clubs length:', createdClubs.length);
        console.log('FeedbackForm: Joined clubs length:', joinedClubs.length);
        
        // Log each created club for debugging
        createdClubs.forEach((club, index) => {
          console.log(`FeedbackForm: Created Club ${index + 1}:`, {
            name: club.name,
            id: club._id,
            status: club.status,
            members: club.members?.length
          });
        });
        
        // Log each joined club for debugging
        joinedClubs.forEach((club, index) => {
          console.log(`FeedbackForm: Joined Club ${index + 1}:`, {
            name: club.name,
            id: club._id,
            status: club.status,
            members: club.members?.length
          });
        });

        // Merge both arrays and remove duplicates (in case user is both creator and member)
        const allClubs = [...createdClubs];
        
        // Add joined clubs if they're not already in the created clubs array
        joinedClubs.forEach(joinedClub => {
          const isAlreadyIncluded = createdClubs.some(createdClub => 
            createdClub._id === joinedClub._id
          );
          if (!isAlreadyIncluded) {
            allClubs.push(joinedClub);
          }
        });

        console.log('FeedbackForm: Total clubs found:', allClubs.length);
        console.log('FeedbackForm: All clubs:', allClubs);
        
        // Additional debugging - log each club individually
        if (allClubs.length === 0) {
          console.warn('⚠️ No clubs found for user. This could be due to:');
          console.warn('1. User has not created or joined any clubs');
          console.warn('2. API response is empty');
          console.warn('3. Data processing error');
          console.warn('4. Authentication issue');
        } else {
          console.log('✅ Found clubs for user:');
          allClubs.forEach((club, index) => {
            console.log(`  Club ${index + 1}: ${club.name} (${club.status})`);
          });
        }
        
        setUserClubs(allClubs);
      } else {
        console.log('FeedbackForm: No club data received - response is null/undefined or not an object');
        console.log('FeedbackForm: Full response:', response);
        setUserClubs([]);
      }
    } catch (error) {
      console.error('FeedbackForm: Error fetching user clubs:', error);
      console.error('FeedbackForm: Error details:', error.message);
      console.error('FeedbackForm: Error response:', error.response);
      console.error('FeedbackForm: Error status:', error.response?.status);
      console.error('FeedbackForm: Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        console.error('🔒 Authentication error - user might not be logged in or token expired');
      } else if (error.response?.status === 403) {
        console.error('🔒 Authorization error - user might not have permission');
      } else if (error.response?.status === 500) {
        console.error('💥 Server error - backend issue');
      }
      
      // Retry logic for network errors
      if (retryCount < 2 && (error.code === 'NETWORK_ERROR' || !error.response)) {
        console.log(`FeedbackForm: Retrying... (attempt ${retryCount + 1})`);
        setTimeout(() => fetchUserClubs(retryCount + 1), 1000);
        return;
      }
      
      setUserClubs([]);
    } finally {
      setLoadingClubs(false);
    }
  };  const categories = [
    { value: 'general', label: 'General', icon: '💬' },
    { value: 'facilities', label: 'Facilities', icon: '🏢' },
    { value: 'content', label: 'Content', icon: '📚' },
    { value: 'organization', label: 'Organization', icon: '📋' },
    { value: 'communication', label: 'Communication', icon: '📞' },
  ];

  const ratingLabels = {
    1: 'Very Poor',
    2: 'Poor', 
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  const handleSubmit = async () => {
    if (!formData.comment.trim()) {
      setError('Please provide your feedback comment');
      return;
    }

    // If feedback type is club but no club is selected
    if (feedbackType === 'club' && !selectedClub) {
      setError('Please select a club to give feedback for');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const feedbackData = {
        ...formData,
        targetType: feedbackType === 'club' ? 'club' : targetType,
        targetId: feedbackType === 'club' ? selectedClub?._id : targetId,
      };

      console.log('FeedbackForm: Submitting feedback:', feedbackData);

      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // Default API call
        const response = await fetch('http://localhost:8000/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(feedbackData),
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          rating: 5,
          category: 'general',
          comment: '',
          isAnonymous: false,
        });
        setSelectedClub(null);
        setFeedbackType('general');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const getTargetTitle = () => {
    if (feedbackType === 'club' && selectedClub) {
      return selectedClub.name;
    }
    if (targetInfo?.title || targetInfo?.name) {
      return targetInfo.title || targetInfo.name;
    }
    if (feedbackType === 'club') {
      return 'Club';
    }
    return targetType.charAt(0).toUpperCase() + targetType.slice(1);
  };

  if (success) {
    return (
      <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <Zoom in={success}>
            <Box>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 3,
                  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                }}
              >
                <SendIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="success.main" gutterBottom>
                Thank You!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your feedback has been submitted successfully and will be reviewed by our team.
              </Typography>
            </Box>
          </Zoom>
        </DialogContent>
      </StyledDialog>
    );
  }

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FeedbackIcon />
          Share Your Feedback
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Feedback Type Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              label="General Feedback"
              variant={feedbackType === 'general' ? 'filled' : 'outlined'}
              onClick={() => {
                setFeedbackType('general');
                setSelectedClub(null);
              }}
              sx={{ mr: 1, cursor: 'pointer' }}
              color={feedbackType === 'general' ? 'primary' : 'default'}
            />
            <Chip
              label="Club Feedback"
              variant={feedbackType === 'club' ? 'filled' : 'outlined'}
              onClick={() => setFeedbackType('club')}
              sx={{ cursor: 'pointer' }}
              color={feedbackType === 'club' ? 'primary' : 'default'}
              icon={<ClubIcon />}
            />
          </Box>

          {/* Club Selection Section - Only show when feedback type is 'club' */}
          {feedbackType === 'club' && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ClubIcon sx={{ mr: 1 }} />
                Select a Club
              </Typography>
              
              {loadingClubs ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography>Loading your clubs...</Typography>
                </Box>
              ) : userClubs.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    You are not a member of any clubs yet. To provide club feedback, you need to either:
                  </Typography>
                  {/* Debug info - remove in production */}
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontStyle: 'italic', color: 'gray' }}>
                    Debug: Found {userClubs.length} clubs. Loading: {loadingClubs ? 'Yes' : 'No'}. API Response logged to console.
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                    <li>Create your own club</li>
                    <li>Join an existing club</li>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => fetchUserClubs()}
                      disabled={loadingClubs}
                    >
                      {loadingClubs ? 'Refreshing...' : 'Refresh Clubs'}
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => {
                        onClose(); // Close the feedback dialog first
                        navigate('/browse-clubs');
                      }}
                    >
                      Browse Clubs
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained" 
                      onClick={() => {
                        onClose(); // Close the feedback dialog first
                        navigate('/create-club');
                      }}
                    >
                      Create Club
                    </Button>
                  </Box>
                </Alert>
              ) : (
                <Autocomplete
                  options={userClubs}
                  getOptionLabel={(option) => option.name}
                  value={selectedClub}
                  onChange={(event, newValue) => setSelectedClub(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Choose a club"
                      placeholder="Select the club you want to give feedback for"
                      variant="outlined"
                      required
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center' }}>
                      <ClubIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description || 'No description available'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  isOptionEqualToValue={(option, value) => option._id === value._id}
                  sx={{ mb: 2 }}
                />
              )}
            </Box>
          )}

          {/* Target Info */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              How was your experience with{' '}
              <strong style={{ color: '#667eea' }}>{getTargetTitle()}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your feedback helps us improve our services
            </Typography>
          </Box>

          {/* Rating */}
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <StarIcon color="primary" />
              Rate Your Experience
            </Typography>
            <Box sx={{ mb: 2 }}>
              <StyledRating
                value={formData.rating}
                onChange={(event, newValue) => {
                  setFormData(prev => ({ ...prev, rating: newValue || 1 }));
                }}
                size="large"
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={<StarBorderIcon fontSize="inherit" />}
              />
            </Box>
            <Typography variant="body2" color="primary" fontWeight="medium">
              {ratingLabels[formData.rating]}
            </Typography>
          </Box>

          {/* Category */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CategoryIcon color="primary" />
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {categories.map((category) => (
                <CategoryChip
                  key={category.value}
                  label={`${category.icon} ${category.label}`}
                  selected={formData.category === category.value}
                  onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                />
              ))}
            </Box>
          </Box>

          {/* Comment */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CommentIcon color="primary" />
              Your Feedback
            </Typography>
            <StyledFormControl fullWidth>
              <TextField
                multiline
                rows={4}
                placeholder="Tell us about your experience. What went well? What could be improved?"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.1rem',
                    lineHeight: 1.6,
                  },
                }}
              />
            </StyledFormControl>
          </Box>

          {/* Anonymous Option */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#667eea',
                      '& + .MuiSwitch-track': {
                        backgroundColor: '#667eea',
                      },
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Submit anonymously (your name will not be shown)
                </Typography>
              }
            />
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <StyledButton onClick={onClose} disabled={loading}>
          Cancel
        </StyledButton>
        <StyledButton
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.comment.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default FeedbackForm;
