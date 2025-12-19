import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button, Input } from '../components/ui';

/**
 * Login Page
 * 
 * Halaman login dengan split-screen design sesuai mockup
 * - Left side: Login form
 * - Right side: Hero section dengan gradient background
 */

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Call real login API via AuthContext
      const userData = await login(formData);
      
      // Redirect based on user role
      if (userData.role === 'student') {
        navigate('/student-dashboard', { replace: true });
      } else if (userData.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (userData.role === 'teacher') {
        navigate('/dashboard', { replace: true });
      } else {
        // Default fallback
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different error types
      if (error.message) {
        setErrors({ submit: error.message });
      } else if (error.error) {
        setErrors({ submit: error.error });
      } else {
        setErrors({ submit: 'Invalid email or password. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login (placeholder)
  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // TODO: Implement Google OAuth
  };

  return (
    <div className="min-h-screen flex">
      {/* ========== LEFT SIDE - LOGIN FORM ========== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              CogniLytics MIS
            </h1>
            <p className="text-gray-600">
              Enter your email below to login to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                type="password"
                name="password"
                placeholder="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                showPasswordToggle
                autoComplete="current-password"
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-danger-light/10 border border-danger-light rounded-lg">
                <p className="text-sm text-danger">{errors.submit}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Login with Google
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ========== RIGHT SIDE - HERO SECTION ========== */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-blue-700 to-indigo-900 items-center justify-center p-12">
        <div className="text-center text-white max-w-md">
          <h2 className="text-5xl font-bold mb-4">CogniLytics MIS</h2>
          <p className="text-xl text-white/90">
            Unlock insights into student learning and cognitive load.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
