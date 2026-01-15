import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cog6ToothIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  KeyIcon, 
  PaintBrushIcon, 
  LanguageIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { userService } from '../services/userService';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const UserSettings = () => {
  const { updateLanguage, getThemeClasses, getCardClasses, getInputClasses, isDark, updateTheme, theme } = useTheme();
  const { t, language, getLanguageOptions } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('preferences');
  const [activity, setActivity] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    clubNotifications: true,
    eventNotifications: true,
    language: 'en',
    interests: []
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [newInterest, setNewInterest] = useState('');

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await userService.getUserProfile();
      setSettings(userData.settings || {
        emailNotifications: true,
        pushNotifications: true,
        clubNotifications: true,
        eventNotifications: true,
        language: 'en',
        interests: []
      });
      
      // Fetch user activity separately
      const activityData = await userService.getUserActivity();
      setActivity(activityData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(t('failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSettingChange = (key, value) => {
    if (key === 'language') {
      updateLanguage(value);
    }
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !settings.interests.includes(newInterest.trim())) {
      setSettings(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest) => {
    setSettings(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await userService.updateUserSettings(settings);
      setSuccess(t('settingsUpdatedSuccessfully'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(t('failedToUpdateSettings'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t('newPasswordsDontMatch'));
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError(t('newPasswordTooShort'));
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError(t('newPasswordSameAsCurrent'));
      return;
    }

    try {
      setSaving(true);
      setError('');
      await userService.changePassword(passwordForm);
      setSuccess(t('passwordChangedSuccessfully'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error.response?.data?.message || t('failedToChangePassword');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'activity', name: 'Activity', icon: ClockIcon }
  ];

  if (loading) {
    return (
      <div className={`${getThemeClasses()} flex items-center justify-center`}>
        <div className={`${getCardClasses()} rounded-xl p-8 shadow-lg`}>
          <div className="animate-pulse flex space-x-4">
            <div className={`rounded-full h-12 w-12 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            <div className="flex-1 space-y-2 py-1">
              <div className={`h-4 rounded w-3/4 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
              <div className={`h-4 rounded w-1/2 ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
            </div>
          </div>
          <p className={`text-center mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={getThemeClasses()}>
      {/* Navigation */}
      <nav className={`${getCardClasses()} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              University Clubs
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>
                {t('dashboard')}
              </Link>
              <Link to="/profile" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                {t('profile')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className={`${getCardClasses()} rounded-xl p-6 mb-8 shadow-lg`}>
          <div className="flex items-center space-x-4">
            <Cog6ToothIcon className={`h-8 w-8 ${isDark ? 'text-white' : 'text-gray-900'}`} />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('settings')}</h1>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-100">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-100">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tab Navigation */}
          <div className="lg:col-span-1">
            <div className={`${getCardClasses()} rounded-xl p-4`}>
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? `bg-blue-500/30 ${isDark ? 'text-white' : 'text-blue-700'} border ${isDark ? 'border-blue-400/50' : 'border-blue-300'}`
                          : `${isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            <div className={`${getCardClasses()} rounded-xl p-6`}>
              {activeTab === 'preferences' && (
                <div className="space-y-8">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center space-x-2`}>
                    <PaintBrushIcon className="h-5 w-5" />
                    <span>{t('accountSettings')}</span>
                  </h2>

                  {/* Language Settings */}
                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-6`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                      <LanguageIcon className="h-5 w-5" />
                      <span>{t('languageSettings')}</span>
                    </h3>
                    <select
                      value={language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClasses()}`}
                    >
                      {getLanguageOptions().map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Theme Settings */}
                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-6`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                      <PaintBrushIcon className="h-5 w-5" />
                      <span>Theme</span>
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Dark Mode</p>
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>Switch between light and dark themes</p>
                      </div>
                      <button
                        onClick={() => updateTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          theme === 'dark' ? 'bg-blue-500' : (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Interests */}
                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-6`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>{t('interests')}</h3>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder={t('addNewInterest')}
                          className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClasses()}`}
                          onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                        />
                        <button
                          onClick={addInterest}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {settings.interests.map((interest, index) => (
                          <span
                            key={index}
                            className={`${isDark ? 'bg-purple-500/20 border-purple-400/50 text-purple-100' : 'bg-purple-100 border-purple-300 text-purple-800'} border px-3 py-1 rounded-full text-sm flex items-center space-x-2`}
                          >
                            <span>{interest}</span>
                            <button
                              onClick={() => removeInterest(interest)}
                              className={`${isDark ? 'hover:text-red-300' : 'hover:text-red-600'} transition-colors`}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>{saving ? t('saving') : t('save') + ' ' + t('preferences')}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center space-x-2`}>
                    <BellIcon className="h-5 w-5" />
                    <span>{t('notificationSettings')}</span>
                  </h2>

                  <div className="space-y-6">
                    {[
                      { key: 'emailNotifications', label: t('emailNotifications'), description: 'Receive notifications via email' },
                      { key: 'pushNotifications', label: t('pushNotifications'), description: 'Receive push notifications in browser' },
                      { key: 'clubNotifications', label: t('clubNotifications'), description: t('notificationsAboutClubActivities') },
                      { key: 'eventNotifications', label: t('eventNotifications'), description: t('notificationsAboutUpcomingEvents') }
                    ].map((notification) => (
                      <div key={notification.key} className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{notification.label}</h3>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mt-1`}>{notification.description}</p>
                          </div>
                          <button
                            onClick={() => handleSettingChange(notification.key, !settings[notification.key])}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settings[notification.key] ? 'bg-blue-500' : (isDark ? 'bg-gray-600' : 'bg-gray-300')
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings[notification.key] ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={saveSettings}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>{saving ? t('saving') : t('saveNotificationSettings')}</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>{t('securitySettings')}</span>
                  </h2>

                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                      <KeyIcon className="h-5 w-5" />
                      <span>{t('changePassword')}</span>
                    </h3>
                    
                    <form onSubmit={changePassword} className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'} mb-2`}>{t('currentPassword')}</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordChange}
                            required
                            placeholder={t('enterCurrentPassword')}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClasses()}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`absolute right-3 top-2.5 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'} mb-2`}>{t('newPassword')}</label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                          placeholder={t('enterNewPassword')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClasses()}`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'} mb-2`}>{t('confirmPassword')}</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          minLength="6"
                          placeholder={t('confirmYourNewPassword')}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${getInputClasses()}`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <KeyIcon className="h-4 w-4" />
                        <span>{saving ? t('changing') : t('changePassword')}</span>
                      </button>
                    </form>
                  </div>

                  <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-4`}>
                    <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>{t('accountInformation')}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('accountStatus')}</span>
                        <span className="text-green-500 font-medium">Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Last Login</span>
                        <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Two-Factor Authentication</span>
                        <span className="text-yellow-500 font-medium">Not Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                    <ClockIcon className="h-5 w-5" />
                    <span>{t('recentActivity')}</span>
                  </h2>

                  <div className="space-y-3">
                    {activity.length > 0 ? activity.map((item, index) => (
                      <div key={index} className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-4`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                              <UserCircleIcon className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>{item.action}</p>
                            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{item.description}</p>
                            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-1`}>
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className={`${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} rounded-lg p-8 text-center`}>
                        <ClockIcon className={`h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('noRecentActivityToDisplay')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
