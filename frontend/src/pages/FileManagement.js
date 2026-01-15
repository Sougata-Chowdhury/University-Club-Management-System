import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Fade,
  keyframes,
  Button,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  PhotoLibrary,
  Settings,
  Dashboard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import MediaGallery from '../components/MediaGallery';

const sparkle = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

const gradientMove = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`file-tabpanel-${index}`}
      aria-labelledby={`file-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Fade in timeout={500}>
          <Box sx={{ py: 4 }}>
            {children}
          </Box>
        </Fade>
      )}
    </div>
  );
}

const FileManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadComplete = (uploadedFiles) => {
    // Switch to gallery tab after successful upload
    setTabValue(1);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pt: 4,
      pb: 8,
      position: 'relative'
    }}>
      {/* Dashboard Button - Floating */}
      <IconButton
        onClick={handleDashboardClick}
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,245,255,0.8) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'rgba(103, 126, 234, 0.9)',
          width: 56,
          height: 56,
          boxShadow: '0 8px 32px rgba(255,255,255,0.15), 0 4px 16px rgba(103, 126, 234, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(230,240,255,0.9) 100%)',
            boxShadow: '0 12px 40px rgba(255,255,255,0.25), 0 6px 20px rgba(103, 126, 234, 0.3)',
            transform: 'translateY(-2px) scale(1.05)',
            borderColor: 'rgba(255,255,255,0.5)',
          }
        }}
      >
        <Dashboard sx={{ fontSize: 28 }} />
      </IconButton>

      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ffd700 50%, #ffffff 100%)',
              backgroundSize: '300% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              fontSize: { xs: '1.8rem', md: '2.8rem' },
              fontFamily: '"Poppins", "Arial", sans-serif',
              textShadow: '0 0 30px rgba(255,215,0,0.5), 0 4px 20px rgba(255,255,255,0.3)',
              mb: 1.5,
              animation: `${sparkle} 3s ease-in-out infinite, ${gradientMove} 4s ease-in-out infinite`,
              letterSpacing: '0.5px',
              filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.2))',
            }}
          >
            ✨ File Management Center ✨
          </Typography>
          <Typography 
            variant="h6" 
            color="rgba(255,255,255,0.85)"
            sx={{ 
              fontWeight: 400,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              fontFamily: '"Roboto", sans-serif',
            }}
          >
            Upload, manage, and organize your files with magical ease
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Paper 
          sx={{ 
            mb: 4,
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          }} 
          elevation={0}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'centered'}
            sx={{
              '& .MuiTab-root': {
                minHeight: 80,
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(25, 118, 210, 0.1)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(156, 39, 176, 0.1))',
                  color: '#1976d2',
                },
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
              },
            }}
          >
            <Tab
              icon={<CloudUpload sx={{ fontSize: 32, mb: 1 }} />}
              label="🚀 Upload Files"
              sx={{ flexDirection: 'column', gap: 1 }}
            />
            <Tab
              icon={<PhotoLibrary sx={{ fontSize: 32, mb: 1 }} />}
              label="📱 Media Gallery"
              sx={{ flexDirection: 'column', gap: 1 }}
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Paper 
            sx={{ 
              p: 4,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            }} 
            elevation={0}
          >
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                mb: 4,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2, #9c27b0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textAlign: 'center'
              }}
            >
              🎯 Upload Your Amazing Files
            </Typography>
            <FileUpload 
              onUploadComplete={handleUploadComplete}
              acceptedFileTypes={{
                'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
                'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
                'application/pdf': ['.pdf'],
                'application/msword': ['.doc'],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                'text/*': ['.txt', '.csv'],
              }}
              maxFiles={10}
              maxFileSize={50 * 1024 * 1024} // 50MB
            />
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <MediaGallery />
        </TabPanel>
      </Container>
    </Box>
  );
};

export default FileManagement;
