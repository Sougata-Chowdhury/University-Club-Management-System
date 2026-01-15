import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Load theme and language from user settings on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        if (userService.isAuthenticated()) {
          const userProfile = await userService.getUserProfile();
          const userTheme = userProfile?.settings?.theme || 'light';
          const userLanguage = userProfile?.settings?.language || 'en';
          
          setTheme(userTheme);
          setLanguage(userLanguage);
          
          // Apply theme to document
          applyThemeToDocument(userTheme);
        } else {
          // Load from localStorage if not authenticated
          const savedTheme = localStorage.getItem('theme') || 'light';
          const savedLanguage = localStorage.getItem('language') || 'en';
          setTheme(savedTheme);
          setLanguage(savedLanguage);
          applyThemeToDocument(savedTheme);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLanguage = localStorage.getItem('language') || 'en';
        setTheme(savedTheme);
        setLanguage(savedLanguage);
        applyThemeToDocument(savedTheme);
      } finally {
        setLoading(false);
      }
    };

    loadUserPreferences();
  }, []);

  const applyThemeToDocument = (selectedTheme) => {
    const root = document.documentElement;
    
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--bg-primary', '#1f2937');
      root.style.setProperty('--bg-secondary', '#374151');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--border-color', '#4b5563');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#1f2937');
      root.style.setProperty('--text-secondary', '#6b7280');
      root.style.setProperty('--border-color', '#e5e7eb');
    }
  };

  const updateTheme = async (newTheme) => {
    try {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      applyThemeToDocument(newTheme);
      
      // Update user settings if authenticated
      if (userService.isAuthenticated()) {
        const currentProfile = await userService.getUserProfile();
        const updatedSettings = {
          ...currentProfile.settings,
          theme: newTheme
        };
        await userService.updateUserSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  const updateLanguage = async (newLanguage) => {
    try {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
      
      // Update user settings if authenticated
      if (userService.isAuthenticated()) {
        const currentProfile = await userService.getUserProfile();
        const updatedSettings = {
          ...currentProfile.settings,
          language: newLanguage
        };
        await userService.updateUserSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const getThemeClasses = () => {
    const baseClasses = 'transition-colors duration-300';
    
    if (theme === 'dark') {
      return `${baseClasses} bg-gray-900 text-white min-h-screen`;
    }
    
    return `${baseClasses} bg-gray-50 text-gray-900 min-h-screen`;
  };

  const getCardClasses = () => {
    if (theme === 'dark') {
      return 'bg-gray-800 border-gray-700 text-white';
    }
    return 'bg-white border-gray-200 text-gray-900';
  };

  const getInputClasses = () => {
    if (theme === 'dark') {
      return 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20';
    }
    return 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500/20';
  };

  const value = {
    theme,
    language,
    loading,
    updateTheme,
    updateLanguage,
    getThemeClasses,
    getCardClasses,
    getInputClasses,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
