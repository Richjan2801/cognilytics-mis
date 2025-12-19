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

  // Initialize - check if user already logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get fresh user data from API
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Check localStorage as fallback
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        // Clear invalid auth data
        authService.logout();
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
      const userData = response.data.user;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
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
      const newUser = response.data.user;
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
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