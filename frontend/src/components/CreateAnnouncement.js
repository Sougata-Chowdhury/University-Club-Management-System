import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  SpeakerWaveIcon,
  PhotoIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { announcementService } from '../services/announcementService';
import { clubService } from '../services/clubService';

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    message: '',
    clubId: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [userClubs, setUserClubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [error, setError] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 500;

  useEffect(() => {
    fetchUserClubs();
  }, []);

  const fetchUserClubs = async () => {
    try {
      setLoadingClubs(true);
      const response = await clubService.getMyClubs();
      // Filter only approved clubs
      const approvedClubs = response.createdClubs?.filter(club => club.status === 'approved') || [];
      setUserClubs(approvedClubs);
      
      if (approvedClubs.length === 1) {
        setFormData(prev => ({ ...prev, clubId: approvedClubs[0]._id }));
      }
    } catch (err) {
      setError('Failed to fetch your clubs');
    } finally {
      setLoadingClubs(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'message') {
      setCharacterCount(value.length);
      if (value.length <= maxCharacters) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError('Only JPEG, PNG, and GIF images are allowed');
        return;
      }

      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      setError('Message is required');
      return;
    }
    
    if (!formData.clubId) {
      setError('Please select a club');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await announcementService.createAnnouncement({
        message: formData.message.trim(),
        clubId: formData.clubId,
        image: formData.image
      });
      
      navigate('/announcements', { 
        state: { message: 'Announcement created successfully!' }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingClubs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800 flex items-center justify-center">
        <div className="text-white text-xl flex items-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading your clubs...
        </div>
      </div>
    );
  }

  if (userClubs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800">
        <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/announcements" className="text-white hover:text-gray-300 transition-colors flex items-center">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Announcements
              </Link>
              <h1 className="text-white text-xl font-bold">Create Announcement</h1>
            </div>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">No Approved Clubs Found</h3>
            <p className="text-gray-300 mb-6">
              You need to have at least one approved club to create announcements. 
              Only approved club creators and members can make announcements.
            </p>
            <div className="space-y-3">
              <Link
                to="/create-club"
                className="block bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold transform transition-all duration-300 hover:scale-105"
              >
                Create a Club
              </Link>
              <Link
                to="/my-clubs"
                className="block bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg hover:bg-white/20 transition-colors"
              >
                View My Clubs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-700 to-indigo-800">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/announcements" className="text-white hover:text-gray-300 transition-colors flex items-center">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Announcements
            </Link>
            <h1 className="text-white text-xl font-bold flex items-center">
              <SpeakerWaveIcon className="w-6 h-6 mr-2" />
              Create Announcement
            </h1>
            <div></div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <SpeakerWaveIcon className="w-10 h-10 mr-3 text-pink-400" />
            📢 Create Announcement
          </h1>
          <p className="text-xl text-gray-300">Share important updates with your club members</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Club Selection */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Select Club *
              </label>
              <select
                name="clubId"
                value={formData.clubId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              >
                <option value="" className="bg-gray-800">Select a club</option>
                {userClubs.map(club => (
                  <option key={club._id} value={club._id} className="bg-gray-800">
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-white text-sm font-semibold">
                  Message *
                </label>
                <span className={`text-sm ${
                  characterCount > maxCharacters * 0.9 
                    ? 'text-red-400' 
                    : characterCount > maxCharacters * 0.7 
                    ? 'text-yellow-400' 
                    : 'text-gray-400'
                }`}>
                  {characterCount}/{maxCharacters}
                </span>
              </div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="What would you like to announce to your club members?"
                required
                rows={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
              />
              <p className="text-gray-400 text-sm mt-2">
                💡 Tip: Be clear and engaging. Include any important dates, locations, or action items.
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-white text-sm font-semibold mb-2">
                Add Image (Optional)
              </label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">
                    Drag and drop an image, or click to select
                  </p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <PhotoIcon className="w-4 h-4 mr-2" />
                    Choose Image
                  </label>
                  <p className="text-gray-400 text-sm mt-2">
                    JPEG, PNG, GIF up to 5MB
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Link
                to="/announcements"
                className="flex-1 bg-gray-500/20 border border-gray-400/50 text-gray-200 py-4 px-6 rounded-xl hover:bg-gray-500/30 transition-colors text-center font-semibold"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.message.trim() || !formData.clubId}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 px-6 rounded-xl font-semibold transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  <>
                    <SpeakerWaveIcon className="w-5 h-5 inline mr-2" />
                    Create Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        {formData.message && (
          <div className="mt-8">
            <h3 className="text-white text-lg font-semibold mb-4">Preview</h3>
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">You</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-semibold">Your Name</h4>
                    <span className="text-gray-400 text-sm">•</span>
                    <span className="text-pink-300 text-sm font-medium">
                      {userClubs.find(club => club._id === formData.clubId)?.name || 'Select Club'}
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm">Just now</div>
                </div>
              </div>
              <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap mb-4">
                {formData.message}
              </p>
              {imagePreview && (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/20">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAnnouncement;
