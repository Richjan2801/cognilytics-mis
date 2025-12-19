import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input Component
 * 
 * Input field dengan label, error message, dan support untuk password toggle
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Email is required"
 * />
 * 
 * <Input
 *   label="Password"
 *   type="password"
 *   showPasswordToggle
 * />
 */

const Input = forwardRef(
  (
    {
      label,
      error,
      type = 'text',
      showPasswordToggle = false,
      className = '',
      containerClassName = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Determine actual input type
    const inputType =
      type === 'password' && showPasswordToggle && showPassword
        ? 'text'
        : type;

    // Base input styles
    const baseStyles =
      'w-full px-4 py-2 text-base border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2';

    // State-based styles
    const stateStyles = error
      ? 'border-danger focus:border-danger focus:ring-danger-light'
      : isFocused
      ? 'border-primary-500 ring-2 ring-primary-100'
      : 'border-gray-300 hover:border-gray-400';

    return (
      <div className={clsx('w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}

        {/* Input Container (for password toggle) */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={clsx(
              baseStyles,
              stateStyles,
              showPasswordToggle && type === 'password' && 'pr-12',
              className
            )}
            {...props}
          />

          {/* Password Toggle Button */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1.5 text-sm text-danger flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
