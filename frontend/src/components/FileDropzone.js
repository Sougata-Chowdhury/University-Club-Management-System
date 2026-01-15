import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Fade,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image,
  VideoFile,
  Description,
  InsertDriveFile,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { styled } from '@mui/material/styles';
import fileService from '../services/fileService';

const DropArea = styled(Paper)(({ theme, isDragActive, hasFiles }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(hasFiles ? 2 : 4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  backgroundColor: isDragActive ? theme.palette.primary.light + '10' : 'transparent',
  minHeight: hasFiles ? 'auto' : 120,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '05',
  },
}));

const FileItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1),
  margin: theme.spacing(0.5, 0),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
}));

const FileDropzone = ({ 
  onFilesChange, 
  maxFiles = 5, 
  maxSize = 10485760, 
  acceptedTypes,
  label = "Attach Files",
  compact = false 
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }

    const newFiles = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      uploaded: false,
    }));

    const updatedFiles = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  }, [files, maxFiles, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: maxFiles > 1,
  });

  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const getFileIcon = (filename) => {
    if (fileService.isImage(filename)) return <Image color="primary" sx={{ fontSize: 20 }} />;
    if (fileService.isVideo(filename)) return <VideoFile color="secondary" sx={{ fontSize: 20 }} />;
    if (fileService.isDocument(filename)) return <Description color="action" sx={{ fontSize: 20 }} />;
    return <InsertDriveFile color="action" sx={{ fontSize: 20 }} />;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return [];

    setUploading(true);
    setUploadProgress(0);

    try {
      fileService.setUploadProgressCallback((progress) => {
        setUploadProgress(progress);
      });

      const fileList = files.map(f => f.file);
      const response = await fileService.uploadFiles(fileList);

      // Update file statuses
      const uploadedFiles = files.map((file, index) => ({
        ...file,
        status: 'completed',
        uploaded: true,
        fileId: response.files[index]?._id,
        url: response.files[index]?.url,
      }));

      setFiles(uploadedFiles);
      
      if (onFilesChange) {
        onFilesChange(uploadedFiles);
      }

      return response.files;
    } catch (error) {
      console.error('Upload error:', error);
      const errorFiles = files.map(file => ({
        ...file,
        status: 'error',
        uploaded: false,
      }));
      setFiles(errorFiles);
      
      if (onFilesChange) {
        onFilesChange(errorFiles);
      }
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Expose upload function to parent
  React.useImperativeHandle(React.forwardRef(), () => ({
    uploadFiles,
  }));

  return (
    <Box>
      <DropArea 
        {...getRootProps()} 
        isDragActive={isDragActive} 
        hasFiles={files.length > 0}
        elevation={1}
      >
        <input {...getInputProps()} />
        
        {files.length === 0 ? (
          <>
            <CloudUpload 
              sx={{ 
                fontSize: compact ? 32 : 48, 
                color: 'primary.main', 
                mb: compact ? 1 : 2 
              }} 
            />
            <Typography variant={compact ? "body2" : "h6"} gutterBottom>
              {isDragActive ? 'Drop files here' : label}
            </Typography>
            {!compact && (
              <Typography variant="caption" color="text.secondary">
                Max {maxFiles} files • {fileService.formatFileSize(maxSize)} each
              </Typography>
            )}
          </>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {files.length} file(s) selected
            </Typography>
            
            {files.map((fileItem) => (
              <FileItem key={fileItem.id}>
                <Box sx={{ mr: 1 }}>
                  {getFileIcon(fileItem.file.name)}
                </Box>
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {fileItem.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fileService.formatFileSize(fileItem.file.size)}
                  </Typography>
                </Box>

                <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  {fileItem.status === 'completed' && (
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                  )}
                  {fileItem.status === 'error' && (
                    <Error color="error" sx={{ fontSize: 16 }} />
                  )}
                  
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileItem.id);
                    }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </FileItem>
            ))}

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={uploadProgress} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                  Uploading... {uploadProgress}%
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DropArea>

      {files.length > 0 && !compact && (
        <Fade in>
          <Alert 
            severity="info" 
            sx={{ mt: 2 }}
            icon={<CloudUpload />}
          >
            Files will be uploaded when you submit the form. Click to add more files or drag files here.
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

export default FileDropzone;
