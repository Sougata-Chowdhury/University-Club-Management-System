import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
  IconButton,
  LinearProgress,
  styled,
} from '@mui/material';
import {
  CloudUpload,
  Close,
  AttachFile,
  Delete,
} from '@mui/icons-material';
import reportService from '../services/reportService';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
}));

const FileUploadBox = styled(Box)(({ theme }) => ({
  border: '2px dashed rgba(103, 126, 234, 0.4)',
  borderRadius: 12,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: 'rgba(103, 126, 234, 0.05)',
  '&:hover': {
    borderColor: 'rgba(103, 126, 234, 0.6)',
    background: 'rgba(103, 126, 234, 0.1)',
  },
}));

const ReportDialog = ({ open, onClose, type, targetId, targetTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    additionalInfo: '',
    priority: 1,
  });
  const [attachments, setAttachments] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      setError('Maximum 5 attachments allowed');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
    setError('');
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!type) {
      setError('Report type is missing. Please try again.');
      return;
    }

    if (!targetId) {
      setError('Target ID is missing. Please try again.');
      return;
    }

    if (!formData.category || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reportData = {
        type,
        targetId,
        category: formData.category,
        description: formData.description.trim(),
        additionalInfo: formData.additionalInfo.trim(),
        priority: formData.priority,
      };

      console.log('Submitting report:', reportData); // Debug log

      await reportService.createReport(reportData, attachments);
      
      setSuccess('Report submitted successfully! We will review it and take appropriate action.');
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      additionalInfo: '',
      priority: 1,
    });
    setAttachments([]);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  return (
    <StyledDialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid rgba(103, 126, 234, 0.2)',
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: 'rgba(103, 126, 234, 0.9)' }}>
            🚨 Report {type ? (type.charAt(0).toUpperCase() + type.slice(1)) : 'Content'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {targetTitle && `Reporting: "${targetTitle}"`}
            {!targetTitle && type && `Reporting this ${type}`}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth required>
            <InputLabel>Report Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              disabled={loading}
            >
              {reportService.getReportCategories().map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {reportService.getCategoryIcon(cat.value)} {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            multiline
            rows={4}
            required
            fullWidth
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={loading}
            placeholder="Please describe the issue in detail (minimum 10 characters)..."
            helperText={`${formData.description.length}/1000 characters`}
            inputProps={{ maxLength: 1000 }}
          />

          <TextField
            label="Additional Information (Optional)"
            multiline
            rows={3}
            fullWidth
            value={formData.additionalInfo}
            onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
            disabled={loading}
            placeholder="Any additional context or information..."
            helperText={`${formData.additionalInfo.length}/2000 characters`}
            inputProps={{ maxLength: 2000 }}
          />

          <FormControl fullWidth>
            <InputLabel>Priority Level</InputLabel>
            <Select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              disabled={loading}
            >
              <MenuItem value={1}>🔵 Low - Minor issue</MenuItem>
              <MenuItem value={2}>🟡 Medium - Moderate concern</MenuItem>
              <MenuItem value={3}>🟠 High - Serious issue</MenuItem>
              <MenuItem value={4}>🔴 Critical - Urgent attention needed</MenuItem>
              <MenuItem value={5}>🚨 Emergency - Immediate action required</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Attachments (Optional)
            </Typography>
            
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="attachment-upload"
              disabled={loading}
            />
            
            <label htmlFor="attachment-upload">
              <FileUploadBox component="div">
                <CloudUpload sx={{ fontSize: 40, color: 'rgba(103, 126, 234, 0.6)', mb: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Click to upload images
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Max 5 files, 5MB each. Only images allowed.
                </Typography>
              </FileUploadBox>
            </label>

            {attachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Selected Files ({attachments.length}/5):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {attachments.map((file, index) => (
                    <Chip
                      key={index}
                      icon={<AttachFile />}
                      label={`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`}
                      onDelete={() => removeAttachment(index)}
                      deleteIcon={<Delete />}
                      color="primary"
                      variant="outlined"
                      sx={{ maxWidth: 300 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(103, 126, 234, 0.2)' }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.category || !formData.description.trim()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(103, 126, 234, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(103, 126, 234, 0.4)',
            },
          }}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default ReportDialog;
