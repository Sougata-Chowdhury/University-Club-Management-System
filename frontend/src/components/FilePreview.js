import React, { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Download,
  Delete,
  Image,
  VideoFile,
  Description,
  InsertDriveFile,
  Close,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import fileService from '../services/fileService';

const PreviewCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    '& .file-overlay': {
      opacity: 1,
    },
  },
}));

const FileOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease-in-out',
  borderRadius: theme.spacing(1, 1, 0, 0),
}));

const FilePreview = ({ 
  file, 
  onDelete, 
  onDownload, 
  compact = false, 
  showActions = true,
  maxWidth = 200 
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!file) return null;

  const isImage = fileService.isImage(file.originalName || file.name);
  const isVideo = fileService.isVideo(file.originalName || file.name);
  const isDocument = fileService.isDocument(file.originalName || file.name);

  const getFileIcon = () => {
    if (isImage) return <Image color="primary" sx={{ fontSize: 48 }} />;
    if (isVideo) return <VideoFile color="secondary" sx={{ fontSize: 48 }} />;
    if (isDocument) return <Description color="action" sx={{ fontSize: 48 }} />;
    return <InsertDriveFile color="action" sx={{ fontSize: 48 }} />;
  };

  const handlePreview = () => {
    setPreviewOpen(true);
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(file);
    } else if (file._id) {
      try {
        await fileService.downloadFile(file._id, file.originalName);
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file);
    }
  };

  const fileName = file.originalName || file.name || 'Unknown file';
  const fileSize = file.size || 0;
  const fileUrl = file._id ? fileService.serveFile(file._id) : (file.preview || file.url);
  const thumbnailUrl = file._id && isImage ? fileService.getThumbnail(file._id, 300, 300) : fileUrl;

  return (
    <>
      <PreviewCard sx={{ maxWidth: compact ? 150 : maxWidth }}>
        {isImage ? (
          <CardMedia
            component="img"
            height={compact ? 100 : 140}
            image={thumbnailUrl}
            alt={fileName}
            onClick={handlePreview}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              height: compact ? 100 : 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.100',
              cursor: 'pointer',
            }}
            onClick={handlePreview}
          >
            {getFileIcon()}
          </Box>
        )}

        {showActions && (
          <FileOverlay className="file-overlay">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View">
                <IconButton 
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={handlePreview}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
              
              {file._id && (
                <Tooltip title="Download">
                  <IconButton 
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={handleDownload}
                  >
                    <Download />
                  </IconButton>
                </Tooltip>
              )}
              
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton 
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={handleDelete}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </FileOverlay>
        )}

        <CardContent sx={{ p: compact ? 1 : 2 }}>
          <Typography 
            variant={compact ? "caption" : "body2"} 
            component="div" 
            noWrap
            title={fileName}
          >
            {fileName}
          </Typography>
          
          {!compact && (
            <>
              <Typography variant="caption" color="text.secondary">
                {fileService.formatFileSize(fileSize)}
              </Typography>
              
              {file.type && (
                <Box sx={{ mt: 0.5 }}>
                  <Chip 
                    label={file.type} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </PreviewCard>

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <Close />
          </IconButton>

          {isImage ? (
            <Box
              component="img"
              src={fileUrl}
              alt={fileName}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          ) : isVideo ? (
            <Box
              component="video"
              controls
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
              }}
            >
              <source src={fileUrl} />
              Your browser does not support the video tag.
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              {getFileIcon()}
              <Typography variant="h6" sx={{ mt: 2 }}>
                {fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {fileService.formatFileSize(fileSize)}
              </Typography>
              <Typography variant="body2">
                Preview not available for this file type
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          {file._id && (
            <Button startIcon={<Download />} onClick={handleDownload}>
              Download
            </Button>
          )}
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FilePreview;
