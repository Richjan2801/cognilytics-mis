import toast from 'react-hot-toast';

/**
 * Custom Toast Utility
 * 
 * Wrapper functions around react-hot-toast with predefined styles
 * and consistent messaging across the application.
 */

export const showToast = {
  /**
   * Show success toast
   * @param {string} message - Success message to display
   */
  success: (message) => {
    toast.success(message, {
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    });
  },

  /**
   * Show error toast
   * @param {string} message - Error message to display
   */
  error: (message) => {
    toast.error(message, {
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    });
  },

  /**
   * Show warning toast
   * @param {string} message - Warning message to display
   */
  warning: (message) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        fontWeight: '500',
      },
    });
  },

  /**
   * Show info toast
   * @param {string} message - Info message to display
   */
  info: (message) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: '500',
      },
    });
  },

  /**
   * Show loading toast
   * @param {string} message - Loading message to display
   * @returns {string} Toast ID for dismissing later
   */
  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: '#6366f1',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#6366f1',
      },
    });
  },

  /**
   * Dismiss a specific toast by ID
   * @param {string} toastId - Toast ID to dismiss
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Show promise toast - automatically handles loading, success, and error states
   * @param {Promise} promise - Promise to track
   * @param {Object} messages - Messages for different states
   * @param {string} messages.loading - Loading message
   * @param {string} messages.success - Success message
   * @param {string} messages.error - Error message
   */
  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        success: {
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            color: '#fff',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        loading: {
          style: {
            background: '#6366f1',
            color: '#fff',
            fontWeight: '500',
          },
        },
      }
    );
  },
};

// Default export
export default showToast;
