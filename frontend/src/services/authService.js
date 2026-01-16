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
      console.log('🔐 authService.login - raw axios response:', response);
      console.log('🔐 authService.login - response.data:', response.data);
      
      // Axios wraps the API response in response.data, so:
      // response.data = { success: true, message: "...", data: { user, accessToken, refreshToken } }
      const { user, accessToken, refreshToken } = response.data.data;
      console.log('🔐 authService.login - extracted:', { user: user?.email, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

      if (!user) {
        console.error('❌ No user in response.data.data');
        throw new Error('Login failed: no user data in response');
      }

      // Store tokens dan user data
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Stored to localStorage: user, access_token, refresh_token');

      // Return the full API response structure so AuthContext can extract it
      console.log('🔐 authService.login - returning:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ authService.login catch error:', error.message);
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
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens dan user data
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Logout user
   * @returns {void}
   */
  logout() {
    // Clear all auth data from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user profile
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      // Backend returns { success: true, data: { user: {...} } }
      const user = response.data?.data?.user;
      console.log('🔍 authService.getCurrentUser - received:', { email: user?.email, role: user?.role });

      if (!user) {
        console.error('❌ No user data in getCurrentUser response');
        throw new Error('Invalid getCurrentUser response');
      }

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ User updated in localStorage:', user?.email);

      return user;
    } catch (error) {
      console.error('❌ getCurrentUser error:', error.message);
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
      // Backend returns { success: true, data: { user: {...} } }
      const user = response.data?.data?.user;
      console.log('🔍 authService.updateProfile - received:', { email: user?.email, role: user?.role });

      if (!user) {
        console.error('❌ No user data in updateProfile response');
        throw new Error('Invalid updateProfile response');
      }

      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ User updated in localStorage:', user?.email);

      return user;
    } catch (error) {
      console.error('❌ updateProfile error:', error.message);
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
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      // Decode token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      // Invalid token format
      return false;
    }
  },

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getStoredUser() {
    try {
      const userStr = localStorage.getItem('user');
      console.log('🔍 authService.getStoredUser() - localStorage user:', userStr ? '✅ exists' : '❌ null');
      
      if (!userStr) {
        console.log('❌ No user in localStorage');
        return null;
      }
      
      const parsed = JSON.parse(userStr);
      console.log('✅ User parsed:', { email: parsed?.email, role: parsed?.role });
      return parsed;
    } catch (error) {
      console.error('💥 Error parsing stored user:', error.message);
      // If corrupted, clear it
      localStorage.removeItem('user');
      return null;
    }
  },
};

export default authService;