import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  CircularProgress,
  Fade,
  Zoom,
  Stack,
  Fab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  LinearProgress,
  Badge,
  Avatar,
  Pagination
} from '@mui/material';
import { PhotoLibrary, VideoLibrary, Description, InsertDriveFile, Visibility, Download, MoreVert, ViewModule, ViewList, Add, Search, Close, Delete, FilterList, CloudUpload, Folder, Image, PlayCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import fileService from '../services/fileService';
import FileUpload from './FileUpload';
import { styled } from '@mui/material/styles';
// Styled components for gallery UI
const GalleryCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: `0 20px 40px ${theme.palette.primary.main}20, 0 8px 16px ${theme.palette.primary.main}10`,
    border: `1px solid ${theme.palette.primary.light}`,
    '& .overlay': {
      opacity: 1,
      backdropFilter: 'blur(8px)',
    },
    '& .media-image': {
      transform: 'scale(1.1)',
    },
  },
  '&:active': {
    transform: 'translateY(-6px) scale(1.01)',
  },
}));

const MediaOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}80, 
    ${theme.palette.secondary.main}60)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  borderRadius: theme.spacing(2, 2, 0, 0),
  backdropFilter: 'blur(0px)',
  '& .MuiIconButton-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    margin: theme.spacing(0.5),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      transform: 'scale(1.1)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
    },
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2.5),
  textAlign: 'center',
  background: `linear-gradient(135deg, 
    ${theme.palette.primary.main}, 
    ${theme.palette.primary.dark}, 
    ${theme.palette.secondary.main})`,
  backgroundSize: '200% 200%',
  animation: 'gradientShift 8s ease infinite',
  color: 'white',
  borderRadius: theme.spacing(2.5),
  border: `1px solid rgba(255, 255, 255, 0.1)`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)',
    transform: 'translateX(-100%)',
    transition: 'transform 1s ease',
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: `0 16px 48px rgba(0, 0, 0, 0.15), 
                inset 0 1px 0 rgba(255, 255, 255, 0.2),
                0 0 0 1px rgba(255, 255, 255, 0.1)`,
    '&:before': {
      transform: 'translateX(100%)',
    },
  },
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const MediaGallery = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [contextFile, setContextFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [stats, setStats] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const limit = 20;

  const fetchFiles = useCallback(async (searchTerm = '', type = 'all', pageNum = 1) => {
    setLoading(true);
    try {
      let response;
      
      if (searchTerm.trim()) {
        response = await fileService.searchFiles(searchTerm, pageNum, limit);
      } else {
        // Use public gallery endpoint for browsing
        response = await fileService.getGallery(pageNum, limit);
        
        // Filter by type if needed
        if (type !== 'all' && response.files) {
          response.files = response.files.filter(file => {
            if (type === 'images' && fileService.isImage(file.filename)) return true;
            if (type === 'videos' && fileService.isVideo(file.filename)) return true;
            if (type === 'documents' && fileService.isDocument(file.filename)) return true;
            if (type === 'audio' && fileService.isAudio(file.filename)) return true;
            return false;
          });
        }
      }

      setFiles(response.files || []);
      setTotalPages(Math.ceil((response.total || 0) / limit));
    } catch (error) {
      console.error('Error fetching files:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch files: ${error.response?.data?.message || error.message}`,
        severity: 'error',
      });
      // Set empty state on error
      setFiles([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await fileService.getFileStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchFiles(searchQuery, filterType, page);
  }, [fetchFiles, searchQuery, filterType, page]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setPage(1);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleMenuOpen = (event, file) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setContextFile(file);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setContextFile(null);
  };

  const handleDownload = async (file) => {
    try {
      console.log('Downloading file:', file); // Debug log
      const filename = file.originalname || file.originalName || file.name || 'file';
      const fileId = file.id || file._id;
      console.log('File ID:', fileId, 'Filename:', filename); // Debug log
      await fileService.downloadFile(fileId, filename);
      setSnackbar({
        open: true,
        message: 'Download started',
        severity: 'success',
      });
    } catch (error) {
      console.error('Download error details:', error); // Enhanced error log
      setSnackbar({
        open: true,
        message: `Download failed: ${error?.response?.data?.message || error?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
    handleMenuClose();
  };

  const handleDeleteClick = (file) => {
    console.log('Delete button clicked for file:', file);
    setFileToDelete(file);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      console.log('Attempting to delete file:', fileToDelete.originalName);
      
      const fileId = fileToDelete._id || fileToDelete.id;
      if (!fileId) {
        throw new Error('File ID is missing');
      }
      
      await fileService.deleteFile(fileId);
      
      // Remove from local state immediately
      setFiles(prev => prev.filter(f => (f._id || f.id) !== fileId));
      
      setSnackbar({
        open: true,
        message: 'File deleted successfully',
        severity: 'success',
      });
      
      // Refresh stats and file list
      fetchStats();
      setTimeout(() => {
        fetchFiles(searchQuery, filterType, page);
      }, 500);
      
    } catch (error) {
      console.error('Delete failed:', error);
      
      // If delete fails, show error but don't prevent retry
      setSnackbar({
        open: true,
        message: `Delete failed: ${error?.response?.data?.message || error?.message || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const handleUploadComplete = (uploadedFiles) => {
    setSnackbar({
      open: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      severity: 'success',
    });
    setUploadDialogOpen(false);
    // Add delay to ensure backend processing is complete
    setTimeout(() => {
      fetchFiles(searchQuery, filterType, page);
      fetchStats();
    }, 1500);
  };

  const getFileIcon = (file) => {
    if (fileService.isImage(file.originalName)) return <PhotoLibrary color="primary" />;
    if (fileService.isVideo(file.originalName)) return <VideoLibrary color="secondary" />;
    if (fileService.isDocument(file.originalName)) return <Description color="action" />;
    return <InsertDriveFile color="action" />;
  };

  // Helper function to check if current user can delete a file
  // Simplified: Allow deletion attempts, let the API handle authorization
  const canDeleteFile = (file) => {
    // Always return true, let the backend handle the authorization
    return true;
  };

  const renderFileCard = (file, index) => (
    <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} lg={viewMode === 'grid' ? 3 : 12} key={file._id}>
      <Zoom in timeout={300 * (index % 8 + 1)}>
        <GalleryCard onClick={() => handleFileClick(file)}>
          {fileService.isImage(file.originalName) ? (
            <CardMedia
              component="img"
              height={viewMode === 'grid' ? 200 : 120}
              image={fileService.getThumbnail(file._id, 400, 300)}
              alt={file.originalName}
              className="media-image"
              sx={{
                transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                height: viewMode === 'grid' ? 200 : 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'grey.100',
              }}
            >
              {getFileIcon(file)}
            </Box>
          )}
          
          <MediaOverlay className="overlay">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View">
                <IconButton 
                  color="inherit" 
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileClick(file);
                  }}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton 
                  color="inherit" 
                  sx={{ color: 'white' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                >
                  <Download />
                </IconButton>
              </Tooltip>
              <Tooltip title="More">
                <IconButton 
                  color="inherit" 
                  sx={{ color: 'white' }}
                  onClick={(e) => handleMenuOpen(e, file)}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
          </MediaOverlay>

          <CardContent sx={{ pb: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {file.originalName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {fileService.formatFileSize(file.size)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {file.uploadDate && !isNaN(new Date(file.uploadDate))
                ? format(new Date(file.uploadDate), 'MMM dd, yyyy')
                : '-'}
            </Typography>
            
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label={file.type} size="small" color="primary" variant="outlined" />
              {file.isPublic && (
                <Chip label="Public" size="small" color="success" variant="outlined" />
              )}
            </Box>
          </CardContent>
          
          <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Download">
                <IconButton 
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              {/* Only show delete button for files owned by current user */}
              {canDeleteFile(file) && (
                <Tooltip title="Delete">
                  <IconButton 
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(file);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {format(new Date(file.createdAt), 'MMM dd')}
            </Typography>
          </CardActions>
        </GalleryCard>
      </Zoom>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 5, justifyContent: 'center' }}>
          <Grid item xs={12} sm={5} md={3} lg={2.5}>
            <StatsCard elevation={0}>
              <Folder sx={{ fontSize: 32, mb: 1.5, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '2rem' }}>
                {stats.totalFiles}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9, fontSize: '0.95rem' }}>
                Total Files
              </Typography>
            </StatsCard>
          </Grid>
          <Grid item xs={12} sm={5} md={3} lg={2.5}>
            <StatsCard 
              elevation={0} 
              sx={{ 
                background: `linear-gradient(135deg, #4caf50, #66bb6a, #43a047)`,
              }}
            >
              <CloudUpload sx={{ fontSize: 32, mb: 1.5, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: '2rem' }}>
                {fileService.formatFileSize(stats.totalSize)}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, opacity: 0.9, fontSize: '0.95rem' }}>
                Total Size
              </Typography>
            </StatsCard>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          },
        }} 
        elevation={0}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5, position: 'relative', zIndex: 1 }}>
          <FilterList sx={{ mr: 2, color: 'primary.main', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Search & Filter
          </Typography>
        </Box>
        
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search files by name..."
              value={searchQuery}
              onChange={handleSearch}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 24px rgba(25,118,210,0.12)',
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.4)',
                  },
                },
                '& .MuiInputBase-input': {
                  fontWeight: 500,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" sx={{ fontSize: 22 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: 600, fontSize: '1rem' }}>Filter by Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                label="Filter by Type"
                sx={{
                  borderRadius: 2.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.4)',
                  },
                }}
              >
                <MenuItem value="all">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Folder sx={{ mr: 2, fontSize: 22, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 500 }}>All Files</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="image">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Image sx={{ mr: 2, fontSize: 22, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 500 }}>Images</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="document">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 2, fontSize: 22, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 500 }}>Documents</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="video">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PlayCircle sx={{ mr: 2, fontSize: 22, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 500 }}>Videos</Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="audio">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Description sx={{ mr: 2, fontSize: 22, color: 'text.secondary' }} />
                    <Typography sx={{ fontWeight: 500 }}>Audio</Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexWrap: 'wrap' }}>
              <Tooltip title="Grid View" arrow>
                <IconButton 
                  color={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                  sx={{
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    border: viewMode === 'grid' ? '2px solid' : '2px solid transparent',
                    borderColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                    backgroundColor: viewMode === 'grid' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      backgroundColor: viewMode === 'grid' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.95)',
                    },
                  }}
                >
                  <ViewModule sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="List View" arrow>
                <IconButton 
                  color={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                  sx={{
                    borderRadius: 2,
                    width: 48,
                    height: 48,
                    border: viewMode === 'list' ? '2px solid' : '2px solid transparent',
                    borderColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                    backgroundColor: viewMode === 'list' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      backgroundColor: viewMode === 'list' ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.95)',
                    },
                  }}
                >
                  <ViewList sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 18 }} />}
                onClick={() => setUploadDialogOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.5,
                  px: 3,
                  minWidth: 140,
                  height: 48,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6c42a0 100%)',
                  },
                  '&:active': {
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                Upload Files
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>


      {/* File Grid */}
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 12,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3,
          }}>
            <CircularProgress 
              size={60} 
              thickness={4}
              sx={{
                color: 'primary.main',
                animationDuration: '1.5s',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <CloudUpload sx={{ fontSize: 24, color: 'primary.main', opacity: 0.7 }} />
            </Box>
          </Box>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
            Loading your files...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we fetch your media
          </Typography>
        </Box>
      ) : files.length === 0 ? (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '2px dashed rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02), rgba(118, 75, 162, 0.02))',
              pointerEvents: 'none',
            },
            '&:hover': {
              borderColor: 'primary.main',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.12)',
            },
          }} 
          elevation={0}
        >
          <Avatar
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontSize: '3rem',
            }}
          >
            <PhotoLibrary fontSize="large" />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Your gallery is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            {searchQuery 
              ? 'No files match your search criteria. Try different keywords or clear the search.' 
              : 'Start building your media collection by uploading your first files. Drag and drop or click to browse.'}
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              borderRadius: 3,
              py: 1.5,
              px: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1.1rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)',
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6c42a0 100%)',
              },
            }}
          >
            Upload Your First Files
          </Button>
        </Paper>
      ) : (
        <Fade in timeout={600}>
          <Grid container spacing={3}>
            {files.map((file, index) => renderFileCard(file, index))}
          </Grid>
        </Fade>
      )}

      {/* Pagination */}
      {!loading && files.length > 0 && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(event, value) => {
                setPage(value);
                fetchFiles(searchQuery, filterType, value);
              }}
              color="primary"
              size="large"
              showFirstButton 
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: 2,
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  },
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6c42a0 100%)',
                    },
                  },
                },
              }}
            />
          </Paper>
        </Box>
      )}

  {/* Preview dialog is handled above. */}

      {/* File Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {selectedFile?.originalName || 'File Preview'}
          </Typography>
          <IconButton onClick={() => setPreviewOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedFile && (
            <Box sx={{ textAlign: 'center' }}>
              {fileService.isImage(selectedFile.originalName) ? (
                <Box
                  component="img"
                  src={fileService.serveFile(selectedFile._id || selectedFile.id)}
                  alt={selectedFile.originalName}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: 1,
                  }}
                />
              ) : fileService.isVideo(selectedFile.originalName) ? (
                <Box
                  component="video"
                  controls
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    borderRadius: 1,
                  }}
                >
                  <source src={fileService.serveFile(selectedFile._id || selectedFile.id)} />
                  Your browser does not support the video tag.
                </Box>
              ) : (
                <Box sx={{ py: 4 }}>
                  <Box sx={{ fontSize: 64, mb: 2 }}>
                    {getFileIcon(selectedFile)}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedFile.originalName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    File size: {fileService.formatFileSize(selectedFile.size)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This file type cannot be previewed. Use the download button to view it.
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  onClick={() => handleDownload(selectedFile)}
                >
                  Download
                </Button>
                {canDeleteFile(selectedFile) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => {
                      setPreviewOpen(false);
                      handleDeleteClick(selectedFile);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Upload Files</DialogTitle>
        <DialogContent>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB for Upload */}
      <Fab
        color="primary"
        aria-label="upload"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MediaGallery;
