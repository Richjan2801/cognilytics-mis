import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Send } from 'lucide-react';
import showToast from '../utils/toast';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful password reset request
      console.log('Password reset requested for:', email);
      showToast.success('Password reset email sent!');
      setIsSuccess(true);

    } catch (err) {
      showToast.error('Failed to send reset email. Please try again.');
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) {
      setError('');
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600">
              We've sent password reset instructions to
            </p>
            <p className="text-indigo-600 font-medium mt-1">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Next Steps:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">1.</span>
                <span>Check your email inbox for a message from CogniLytics MIS</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">2.</span>
                <span>Click the password reset link in the email</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">3.</span>
                <span>Follow the instructions to create a new password</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">4.</span>
                <span>Sign in with your new password</span>
              </li>
            </ul>
          </div>

          {/* Additional Help */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                try again
              </button>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </Link>
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
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            No worries! Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                value={email}
                onChange={handleEmailChange}
                className={`block w-full pl-10 pr-3 py-2.5 border ${
                  error ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                placeholder="your.email@example.com"
                autoFocus
              />
            </div>
            {error && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center ${
              isSubmitting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Reset Instructions
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </Link>
          </div>
        </form>

        {/* Security Note */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            For security reasons, we don't disclose whether an email address is registered in our system.
            If you don't receive an email, please check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
