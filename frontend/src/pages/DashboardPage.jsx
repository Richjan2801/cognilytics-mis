import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';

/**
 * Dashboard Page (Placeholder)
 * 
 * Akan redirect ke role-specific dashboard
 */

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-card shadow-card p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎉 Authentication Successful!
            </h1>
            <p className="text-gray-600">
              You are now logged in to CogniLytics MIS
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              User Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {user?.user_id}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Next Step: Build Role-Specific Dashboard
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This is a placeholder. The actual dashboard will show different
                  content based on user role (student, teacher, or admin).
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" fullWidth onClick={() => navigate('/')}>
              Go to Home
            </Button>
            <Button variant="danger" fullWidth onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;