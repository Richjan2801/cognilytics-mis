import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

/**
 * Auth Context
 * 
 * Global state management untuk authentication
 * Provides: user, isAuthenticated, login, logout, register, updateUser
 * 
 * @example
 * function MyComponent() {
 *   const { user, login, logout } = useAuth();
 *   
 *   return <div>Welcome {user?.first_name}</div>;
 * }
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  console.log('🔐 AuthProvider initialized');

  // Initialize - check if user already logged in
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔍 Checking authentication...');
      try {
        // First check if token is still valid
        const tokenValid = authService.isAuthenticated();
        console.log('🔑 Token valid:', tokenValid);
        
        if (tokenValid) {
          console.log('✅ Token exists and valid');
          
          // Load user from localStorage immediately (for instant UI)
          const storedUser = authService.getStoredUser();
          console.log('📦 Stored user:', storedUser?.email, storedUser?.role);
          
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            console.log('✅ User loaded from localStorage:', storedUser);
          } else {
            console.log('⚠️ Token valid but no stored user, attempting API refresh...');
            // Token valid but no stored user - try to get from API
            try {
              const userData = await authService.getCurrentUser();
              console.log('🔄 Retrieved user from API:', userData?.email);
              if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
              }
            } catch (apiError) {
              console.error('❌ Failed to get user from API:', apiError.message);
              // Clear invalid token
              authService.logout();
              setUser(null);
              setIsAuthenticated(false);
            }
          }
          
          // Try to refresh user data from API in background (optional, don't fail if it does)
          if (storedUser) {
            try {
              console.log('🔄 Background refresh of user data from API...');
              const userData = await authService.getCurrentUser();
              console.log('🔄 API user data updated:', userData?.email);
              if (userData) {
                setUser(userData);
              }
            } catch (apiError) {
              console.warn('⚠️ Background API refresh failed, keeping stored user:', apiError.message);
              // Keep using stored user if API fails
            }
          }
        } else {
          // Token expired or invalid - clear auth data
          console.log('❌ Token expired or invalid, logging out...');
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('💥 Auth init error:', error);
        // On error, try to keep user logged in if we have a valid token and stored user
        const tokenValid = authService.isAuthenticated();
        const storedUser = authService.getStoredUser();
        
        if (tokenValid && storedUser) {
          console.log('🛡️ Keeping user session despite error');
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          console.log('🚪 Logging out due to error');
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} User data
   */
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      console.log('🔐 AuthContext.login - response from authService:', response);
      
      // authService returns the full API response: { success, message, data: { user, accessToken, refreshToken } }
      // So user is at response.data.user
      const userData = response?.data?.user;
      console.log('🔐 AuthContext.login - extracted userData:', userData);
      
      if (!userData) {
        console.error('❌ No user data found');
        console.error('   response:', response);
        throw new Error('Login failed: no user data in response');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      console.log('✅ User set in state:', userData?.email, userData?.role);
      
      return userData;
    } catch (error) {
      console.error('❌ AuthContext.login error:', error.message);
      throw error;
    }
  };

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} User data
   */
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      console.log('🔐 Register response:', response);
      
      // authService returns the full API response: { success, message, data: { user, accessToken, refreshToken } }
      // So user is at response.data.user
      const newUser = response?.data?.user;
      console.log('🔐 Register - extracted newUser:', newUser);
      
      if (!newUser) {
        console.error('❌ No user data found');
        throw new Error('Register failed: no user data in response');
      }
      
      setUser(newUser);
      setIsAuthenticated(true);
      console.log('✅ User set in state:', newUser?.email, newUser?.role);
      
      return newUser;
    } catch (error) {
      console.error('❌ Register error:', error.message);
      throw error;
    }
  };

  /**
   * Logout user
   * @returns {void}
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Update user profile
   * @param {Object} userData - Fields to update
   * @returns {Promise<Object>} Updated user data
   */
  const updateUser = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      // Ensure localStorage is updated
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Refresh user data from server
   * @returns {Promise<Object>} Fresh user data
   */
  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      // Ensure localStorage is updated
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;