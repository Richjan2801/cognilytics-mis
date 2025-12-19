import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Unauthorized Page
 * 
 * Shown when user tries to access a route they don't have permission for
 */

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Content */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            You don't have permission to access this page.
          </p>

          {/* Info Box */}
          <div className="bg-gray-100 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Why am I seeing this?</span>
              <br />
              This page requires specific user roles or permissions that your
              account doesn't have. Please contact your administrator if you
              believe this is an error.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button variant="primary" fullWidth onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="outline" fullWidth onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="ghost" fullWidth onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;