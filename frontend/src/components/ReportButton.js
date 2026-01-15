import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  styled,
  Zoom,
  Fab,
  Box,
} from '@mui/material';
import { Flag, Report } from '@mui/icons-material';
import ReportDialog from './ReportDialog';

const StyledReportButton = styled(IconButton)(({ theme, variant = 'icon' }) => ({
  position: 'relative',
  borderRadius: variant === 'fab' ? '50%' : '12px',
  background: variant === 'fab' 
    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
    : 'linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(238, 90, 36, 0.1) 100%)',
  color: variant === 'fab' ? '#fff' : '#ff6b6b',
  border: variant === 'fab' ? 'none' : '1px solid rgba(255, 107, 107, 0.3)',
  backdropFilter: 'blur(10px)',
  boxShadow: variant === 'fab' 
    ? '0 8px 32px rgba(255, 107, 107, 0.4)'
    : '0 4px 16px rgba(255, 107, 107, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px) scale(1.05)',
    boxShadow: variant === 'fab'
      ? '0 12px 40px rgba(255, 107, 107, 0.5)'
      : '0 8px 24px rgba(255, 107, 107, 0.3)',
    background: variant === 'fab'
      ? 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)'
      : 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(238, 90, 36, 0.15) 100%)',
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
  },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
  color: '#fff',
  boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-3px) scale(1.1)',
    boxShadow: '0 12px 40px rgba(255, 107, 107, 0.5)',
    background: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)',
  },
  '&:active': {
    transform: 'translateY(-1px) scale(1.05)',
  },
}));

const PulseEffect = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255, 107, 107, 0.3) 0%, transparent 70%)',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'translate(-50%, -50%) scale(1.4)',
      opacity: 0,
    },
  },
}));

const ReportButton = ({ 
  reportType, 
  reportTargetId, 
  reportTargetInfo = {},
  variant = 'icon', // 'icon', 'fab', 'floating'
  size = 'medium',
  tooltip = 'Report this content',
  showPulse = false,
  position = { bottom: 16, right: 16 },
  className,
  style,
  ...props 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const getTargetTitle = () => {
    if (!reportTargetInfo) return 'Content';
    
    // If title is explicitly provided, use it
    if (reportTargetInfo.title) return reportTargetInfo.title;
    
    // Try different property names based on type
    if (reportType === 'club') {
      return reportTargetInfo.name || reportTargetInfo.clubName || 'Club';
    } else if (reportType === 'event') {
      return reportTargetInfo.name || reportTargetInfo.eventName || reportTargetInfo.title || 'Event';
    } else if (reportType === 'announcement') {
      // For announcements, try to create a meaningful title
      if (reportTargetInfo.message) {
        return reportTargetInfo.message.length > 50 
          ? `"${reportTargetInfo.message.substring(0, 50)}..."` 
          : `"${reportTargetInfo.message}"`;
      }
      return `Announcement${reportTargetInfo.author ? ` by ${reportTargetInfo.author}` : ''}`;
    }
    
    return reportTargetInfo.name || reportTargetInfo.title || 'Content';
  };

  const handleReportSubmitted = () => {
    setDialogOpen(false);
  };

  // Floating FAB variant
  if (variant === 'floating') {
    return (
      <>
        <StyledFab
          onClick={handleOpenDialog}
          style={{
            bottom: position.bottom,
            right: position.right,
            ...style,
          }}
          className={className}
          {...props}
        >
          {showPulse && <PulseEffect />}
          <Report />
        </StyledFab>

        <ReportDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          type={reportType}
          targetId={reportTargetId}
          targetTitle={getTargetTitle()}
          onReportSubmitted={handleReportSubmitted}
        />
      </>
    );
  }

  // Regular FAB variant
  if (variant === 'fab') {
    return (
      <>
        <Tooltip title={tooltip} arrow TransitionComponent={Zoom}>
          <StyledReportButton
            variant="fab"
            size={size}
            onClick={handleOpenDialog}
            className={className}
            style={style}
            {...props}
          >
            {showPulse && <PulseEffect />}
            <Flag />
          </StyledReportButton>
        </Tooltip>

        <ReportDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          type={reportType}
          targetId={reportTargetId}
          targetTitle={getTargetTitle()}
          onReportSubmitted={handleReportSubmitted}
        />
      </>
    );
  }

  // Icon button variant (default)
  return (
    <>
      <Tooltip title={tooltip} arrow TransitionComponent={Zoom}>
        <StyledReportButton
          variant="icon"
          size={size}
          onClick={handleOpenDialog}
          className={className}
          style={style}
          {...props}
        >
          {showPulse && <PulseEffect />}
          <Flag fontSize={size === 'small' ? 'small' : 'medium'} />
        </StyledReportButton>
      </Tooltip>

      <ReportDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        type={reportType}
        targetId={reportTargetId}
        targetTitle={getTargetTitle()}
        onReportSubmitted={handleReportSubmitted}
      />
    </>
  );
};

export default ReportButton;
