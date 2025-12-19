import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import showToast from '../utils/toast';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful registration
      console.log('Registration data:', {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      showToast.success('Account created successfully!');
      setShowSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      showToast.error('Registration failed. Please try again.');
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/(?=.*[a-z])/.test(password)) strength++;
    if (/(?=.*[A-Z])/.test(password)) strength++;
    if (/(?=.*\d)/.test(password)) strength++;
    if (/(?=.*[@$!%*?&#])/.test(password)) strength++;

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Weak', color: 'bg-orange-500' },
      { strength: 3, label: 'Fair', color: 'bg-yellow-500' },
      { strength: 4, label: 'Good', color: 'bg-blue-500' },
      { strength: 5, label: 'Strong', color: 'bg-green-500' }
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength();

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. You will be redirected to the login page in a moment.
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to login...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join CogniLytics MIS today</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="your.email@example.com"
              />
            </div>
            {errors.email && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </div>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>
            {errors.role && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.role}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Create a strong password"
              />
            </div>
            {/* Password Strength Indicator */}
            {formData.password && passwordStrength.strength > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Password Strength:</span>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength <= 2 ? 'text-red-600' :
                    passwordStrength.strength === 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            {errors.password && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="Re-enter your password"
              />
            </div>
            {errors.confirmPassword && (
              <div className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-sm text-red-600">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
              isSubmitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
