import axios from 'axios';

class FileService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://university-club-management-system.onrender.com'
        : 'http://localhost:8000');
    this.api = axios.create({
      baseURL: this.baseURL,
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async uploadFiles(files, type = 'document') {
    const formData = new FormData();
    
    // Add files to form data
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });
    
    formData.append('type', type);

    const response = await this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        this.onUploadProgress && this.onUploadProgress(progress);
      },
    });

    return response.data;
  }

  async uploadMultipleFiles(files) {
    const formData = new FormData();
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    const response = await this.api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getFile(fileId) {
    const response = await this.api.get(`/files/${fileId}`);
    return response.data;
  }

  async serveFile(fileId) {
    return `${this.baseURL}/files/serve/${fileId}`;
  }

  async downloadFile(fileId, filename) {
    const response = await this.api.get(`/files/download/${fileId}`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'file');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response;
  }

  async getThumbnail(fileId, width = 200, height = 200) {
    return `${this.baseURL}/files/thumbnail/${fileId}?width=${width}&height=${height}`;
  }

  async getUserFiles(page = 1, limit = 20, type = null) {
    let url = `/files?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    
    // Use public endpoint that doesn't require auth
    const response = await axios.get(`${this.baseURL}${url}`);
    return response.data;
  }

  async searchFiles(query, page = 1, limit = 20) {
    // Use public endpoint that doesn't require auth
    const response = await axios.get(`${this.baseURL}/files/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async deleteFile(fileId) {
    // Create a separate request without auth for delete
    const response = await axios.delete(`${this.baseURL}/files/${fileId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  async getFileStats() {
    const response = await this.api.get('/files/public/stats');
    return response.data;
  }

  async getGallery(page = 1, limit = 20) {
    // Use public endpoint that doesn't require auth
    const response = await axios.get(`${this.baseURL}/files/gallery?page=${page}&limit=${limit}`);
    return response.data;
  }

  async updateFile(fileId, updateData) {
    const response = await this.api.patch(`/files/${fileId}`, updateData);
    return response.data;
  }

  // Utility methods
  isImage(filename) {
  if (!filename || typeof filename !== 'string') return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(extension);
  }

  isVideo(filename) {
  if (!filename || typeof filename !== 'string') return false;
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return videoExtensions.includes(extension);
  }

  isDocument(filename) {
  if (!filename || typeof filename !== 'string') return false;
  const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return docExtensions.includes(extension);
  }

  isAudio(filename) {
  if (!filename || typeof filename !== 'string') return false;
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return audioExtensions.includes(extension);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(filename) {
    if (this.isImage(filename)) return '🖼️';
    if (this.isVideo(filename)) return '🎥';
    if (this.isDocument(filename)) return '📄';
    if (this.isAudio(filename)) return '🎵';
    return '📁';
  }

  setUploadProgressCallback(callback) {
    this.onUploadProgress = callback;
  }
}

export default new FileService();
