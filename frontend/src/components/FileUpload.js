import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import fileService from '../services/fileService';

// File type to icon mapping
const getFileIcon = (filename) => {
  if (fileService.isImage(filename)) return "📷";
  if (fileService.isVideo(filename)) return "🎥";
  if (fileService.isDocument(filename)) return "📄";
  return "📁";
};

const FileUpload = ({ onUploadComplete, acceptedFileTypes, maxFiles = 10, maxFileSize = 10485760 }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [fileType, setFileType] = useState('document');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const newFiles = selectedFiles.slice(0, maxFiles).map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      error: null,
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    try {
      // Check authentication first
      const token = localStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: '🔒 Please log in to upload files',
          severity: 'warning',
        });
        return;
      }

      setFiles(prev => prev.map(file =>
        file.status === 'pending'
          ? { ...file, status: 'uploading', progress: 0 }
          : file
      ));

      // Prepare files to upload
      const filesToUpload = files.filter(file => file.status === 'pending');
      const formData = new FormData();
      filesToUpload.forEach(fileItem => {
        formData.append('files', fileItem.file);
      });
      formData.append('type', fileType);

      const response = await fetch('http://localhost:8000/files/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
    setSnackbar({
      open: true,
      message: '✅ Files uploaded successfully!',
      severity: 'success',
    });

  // Clear files after successful upload
  setTimeout(() => {
    setFiles([]);
    setUploadProgress({});
  }, 2000);

} catch (error) {
    console.error('Upload error:', error);
    setFiles(prev => prev.map(file => {
      if (file.status === 'uploading') {
        return {
          ...file,
          status: 'error',
          error: error.message || 'Upload failed',
          progress: 0
        };
      }
      return file;
    }));

    setSnackbar({
      open: true,
      message: `❌ Upload failed: ${error.message || 'Unknown error'}`,
      severity: 'error',
    });
  } finally {
    setUploading(false);
    setUploadProgress({});
  }
};
// ...existing code...

  const openPreview = (file) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper 
        sx={{ 
          p: 2.5,
          textAlign: 'center',
          borderRadius: 3,
          border: '2px dashed',
          borderColor: 'rgba(103, 126, 234, 0.6)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,245,255,0.8) 100%)',
          backdropFilter: 'blur(10px)',
          mb: 3,
          transition: 'all 0.3s ease',
          boxShadow: '0 8px 32px rgba(103, 126, 234, 0.1)',
          '&:hover': {
            borderColor: 'rgba(103, 126, 234, 0.8)',
            boxShadow: '0 12px 40px rgba(103, 126, 234, 0.15)',
            transform: 'translateY(-2px)',
          }
        }}
        elevation={0}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={Object.values(acceptedFileTypes || {}).flat().join(',')}
        />
        
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: 36, 
            color: 'rgba(103, 126, 234, 0.8)', 
            mb: 1.5,
            filter: 'drop-shadow(0 2px 4px rgba(103, 126, 234, 0.2))',
          }}
        >
          📤
        </Typography>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            color: 'rgba(103, 126, 234, 0.9)',
            fontSize: '1.1rem',
            mb: 1,
          }}
        >
          Choose Files to Upload
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(103, 126, 234, 0.7)',
            mb: 2.5,
            fontSize: '0.9rem',
          }}
        >
          Select your files and click upload
        </Typography>
        
        <Button 
          variant="contained" 
          onClick={() => fileInputRef.current?.click()}
          sx={{ 
            mb: 1.5,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(103, 126, 234, 0.3)',
            borderRadius: 2,
            px: 3,
            py: 1,
            '&:hover': {
              boxShadow: '0 6px 20px rgba(103, 126, 234, 0.4)',
              transform: 'translateY(-1px)',
            }
          }}
        >
          Select Files
        </Button>
        
        <Typography variant="caption" display="block" color="text.secondary">
          Max file size: {fileService.formatFileSize(maxFileSize)} • Max files: {maxFiles}
        </Typography>
      </Paper>

      {/* File Type Selection */}
      {files.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>File Category</InputLabel>
            <Select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              label="File Category"
            >
              <MenuItem value="document">📄 Document</MenuItem>
              <MenuItem value="image">🖼️ Image</MenuItem>
              <MenuItem value="video">🎥 Video</MenuItem>
              <MenuItem value="audio">🎵 Audio</MenuItem>
              <MenuItem value="other">📦 Other</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* File Preview Grid */}
      {files.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Selected Files ({files.length})
          </Typography>
          <Grid container spacing={2}>
            {files.map((fileItem, index) => (
              <Grid item xs={12} sm={6} md={4} key={fileItem.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    {/* Upload Progress Overlay */}
                    {fileItem.status === 'uploading' && (
                      <Box sx={{ mb: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={fileItem.progress}
                          sx={{ height: 6, borderRadius: 3, mb: 1 }}
                        />
                        <Typography variant="caption" color="primary">
                          Uploading... {fileItem.progress}%
                        </Typography>
                      </Box>
                    )}

                    {/* File Preview */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {fileService.isImage(fileItem.file.name) ? (
                        <Box
                          component="img"
                          src={fileItem.preview}
                          alt={fileItem.file.name}
                          sx={{
                            width: 40,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mr: 2,
                          }}
                        />
                      ) : (
                        <Box sx={{ mr: 2 }}>
                          {getFileIcon(fileItem.file.name)}
                        </Box>
                      )}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                          {fileItem.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fileService.formatFileSize(fileItem.file.size)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Status Chip */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        label={
                          fileItem.status === 'completed' ? '✅ Uploaded' :
                          fileItem.status === 'error' ? '❌ Failed' : '⏳ Ready'
                        }
                        color={
                          fileItem.status === 'completed' ? 'success' :
                          fileItem.status === 'error' ? 'error' : 'default'
                        }
                        size="small"
                      />
                      <IconButton size="small" onClick={() => removeFile(fileItem.id)}>
                        🗑️
                      </IconButton>
                    </Box>

                    {fileItem.error && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          {fileItem.error}
                        </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Upload Button */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
            <Button
              variant="contained"
              onClick={uploadFiles}
              disabled={uploading || files.filter(f => f.status === 'pending').length === 0}
              size="large"
              sx={{ 
                px: 4, 
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                minWidth: 150,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(103, 126, 234, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(103, 126, 234, 0.4)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'rgba(103, 126, 234, 0.3)',
                  color: 'rgba(255,255,255,0.6)',
                }
              }}
            >
              {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} File${files.filter(f => f.status === 'pending').length !== 1 ? 's' : ''}`}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setFiles([])}
              disabled={uploading}
              color="error"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderWidth: 2,
                fontWeight: 600,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
                }
              }}
            >
              🗑️ Clear All
            </Button>
          </Box>

          {/* Overall Progress */}
          {uploading && uploadProgress.overall !== undefined && (
            <Box sx={{ mt: 3, p: 3, background: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
                Upload Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={uploadProgress.overall}
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 1
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {uploadProgress.current} of {uploadProgress.total} files • {Math.round(uploadProgress.overall)}% complete
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={closePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Preview: {previewFile?.file.name}
          <IconButton onClick={closePreview}>
            ❌
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewFile && fileService.isImage(previewFile.file.name) && (
            <Box
              component="img"
              src={previewFile.preview}
              alt={previewFile.file.name}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
            },
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileUpload;
