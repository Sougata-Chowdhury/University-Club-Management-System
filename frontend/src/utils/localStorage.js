/**
 * Utility functions for safe localStorage operations
 */

/**
 * Safely get and parse user data from localStorage
 * @returns {Object} User object or empty object if parsing fails
 */
export const getUser = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'undefined' && userData !== 'null') {
      return JSON.parse(userData);
    }
    return {};
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    // Clear invalid data
    localStorage.removeItem('user');
    return {};
  }
};

/**
 * Safely set user data in localStorage
 * @param {Object} user - User object to store
 */
export const setUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data in localStorage:', error);
  }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} Token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Clear all authentication data from localStorage
 */
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && Object.keys(user).length > 0);
};

/**
 * Check if user is admin
 * @returns {boolean} True if user has admin role
 */
export const isAdmin = () => {
  const user = getUser();
  return user.role === 'admin';
};
