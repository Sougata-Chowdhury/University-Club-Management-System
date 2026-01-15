import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Fab,
  Tooltip,
  Badge,
  Box,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Star as StarIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import FeedbackForm from './FeedbackForm';

const StyledFeedbackButton = styled(Button)(({ theme, variant: buttonVariant }) => ({
  borderRadius: '20px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.3s ease',
  ...(buttonVariant === 'contained' && {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
    },
  }),
  ...(buttonVariant === 'outlined' && {
    border: '2px solid #667eea',
    color: '#667eea',
    '&:hover': {
      background: 'rgba(102, 126, 234, 0.1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.2)',
    },
  }),
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
  },
}));

const FeedbackButton = ({
  targetType = 'general',
  targetId = null,
  targetInfo = null,
  variant = 'button', // 'button', 'icon', 'fab'
  size = 'medium',
  buttonVariant = 'contained', // 'contained', 'outlined'
  text = 'Give Feedback',
  tooltip = 'Share your feedback',
  showBadge = false,
  badgeCount = 0,
  onSubmit = null,
  sx = {},
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (feedbackData) => {
    if (onSubmit) {
      await onSubmit(feedbackData);
    }
    // Default submission is handled by FeedbackForm
  };

  const getIcon = () => {
    switch (targetType) {
      case 'event':
        return <StarIcon />;
      case 'club':
        return <ReviewIcon />;
      default:
        return <FeedbackIcon />;
    }
  };

  const renderButton = () => {
    const icon = getIcon();
    
    switch (variant) {
      case 'icon':
        return (
          <Tooltip title={tooltip}>
            <StyledIconButton size={size} onClick={handleOpen} sx={sx}>
              {showBadge ? (
                <Badge badgeContent={badgeCount} color="error">
                  {icon}
                </Badge>
              ) : (
                icon
              )}
            </StyledIconButton>
          </Tooltip>
        );
        
      case 'fab':
        return (
          <Tooltip title={tooltip}>
            <StyledFab size={size} onClick={handleOpen} sx={sx}>
              {showBadge ? (
                <Badge badgeContent={badgeCount} color="error">
                  {icon}
                </Badge>
              ) : (
                icon
              )}
            </StyledFab>
          </Tooltip>
        );
        
      default:
        return (
          <StyledFeedbackButton
            variant={buttonVariant}
            size={size}
            startIcon={showBadge ? (
              <Badge badgeContent={badgeCount} color="error">
                {icon}
              </Badge>
            ) : icon}
            onClick={handleOpen}
            sx={sx}
          >
            {text}
          </StyledFeedbackButton>
        );
    }
  };

  return (
    <Box>
      {renderButton()}
      <FeedbackForm
        open={open}
        onClose={handleClose}
        targetType={targetType}
        targetId={targetId}
        targetInfo={targetInfo}
        onSubmit={handleSubmit}
      />
    </Box>
  );
};

export default FeedbackButton;
