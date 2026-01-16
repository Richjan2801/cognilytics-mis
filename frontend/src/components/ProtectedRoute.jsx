import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Protected Route Component
 * 
 * Route guard yang:
 * - Check authentication
 * - Check user role (optional)
 * - Redirect ke login jika belum auth
 * - Redirect ke unauthorized jika role tidak sesuai
 * - Show loading saat check auth
 * 
 * @example
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute allowedRoles={['teacher', 'admin']}>
 *   <TeacherDashboard />
 * </ProtectedRoute>
 */

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', { 
    isAuthenticated, 
    isLoading, 
    user: user ? { email: user.email, role: user.role } : null,
    path: location.pathname 
  });

  // Show loading state
  if (isLoading) {
    console.log('⏳ ProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0) {
    const userRole = user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed - render children
  return children;
};

export default ProtectedRoute;
