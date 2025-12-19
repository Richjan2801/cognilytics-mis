import api from './api';

/**
 * Authentication Service
 * 
 * Handle semua API calls yang berhubungan dengan authentication:
 * - Login
 * - Register
 * - Logout
 * - Get current user
 * - Update profile
 * - Change password
 */

const authService = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} User data dengan tokens
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, access_token, refresh_token } = response.data.data;

      // Store tokens dan user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Register new user
   * @param {Object} userData - { email, password, first_name, last_name, role }
   * @returns {Promise} User data dengan tokens
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, access_token, refresh_token } = response.data.data;

      // Store tokens dan user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage regardless of API success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update user profile
   * @param {Object} userData - Fields to update
   * @returns {Promise} Updated user data
   */
  async updateProfile(userData) {
    try {
      const response = await api.put('/auth/profile', userData);
      const user = response.data.data;

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Change password
   * @param {Object} passwords - { current_password, new_password }
   * @returns {Promise}
   */
  async changePassword(passwords) {
    try {
      const response = await api.post('/auth/change-password', passwords);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default authService;