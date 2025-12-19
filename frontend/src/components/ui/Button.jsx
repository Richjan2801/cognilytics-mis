import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Button Component
 * 
 * Reusable button dengan berbagai variant dan size
 * 
 * @example
 * <Button variant="primary">Login</Button>
 * <Button variant="secondary" size="sm">Cancel</Button>
 * <Button variant="ghost" disabled>Disabled</Button>
 */

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    // 🎨 Base styles - selalu diterapkan
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    // 🎭 Variant styles - warna dan style berbeda
    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 focus:ring-primary-500 shadow-sm hover:shadow-md',
      secondary:
        'bg-secondary-500 text-white hover:bg-secondary-600 hover:scale-105 focus:ring-secondary-400 shadow-sm hover:shadow-md',
      outline:
        'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
      danger:
        'bg-danger text-white hover:bg-danger-dark hover:scale-105 focus:ring-danger-light shadow-sm hover:shadow-md',
    };

    // 📏 Size styles - padding dan font size berbeda
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // 🔍 Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          widthStyles,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
