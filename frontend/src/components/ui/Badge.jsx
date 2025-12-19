import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Badge Component
 * 
 * Digunakan untuk menampilkan status atau label kecil
 * Sangat berguna untuk menampilkan CL Index dengan warna berbeda
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger">High Load</Badge>
 * <Badge clValue={88}>88</Badge> // Automatic color based on CL value
 */

const Badge = forwardRef(
  (
    {
      children,
      variant,
      clValue, // Cognitive Load value (0-100)
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    // 📊 Auto-determine variant based on CL value
    let computedVariant = variant;
    
    if (clValue !== undefined && !variant) {
      if (clValue >= 80) {
        computedVariant = 'cl-overload'; // Red
      } else if (clValue >= 60) {
        computedVariant = 'cl-high'; // Orange
      } else if (clValue >= 30) {
        computedVariant = 'cl-optimal'; // Green
      } else {
        computedVariant = 'cl-low'; // Blue
      }
    }

    // 🎨 Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-badge transition-colors';

    // 🎭 Variant styles
    const variants = {
      // Status badges
      primary: 'bg-primary-100 text-primary-700 border border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
      success: 'bg-success-light/20 text-success-dark border border-success-light',
      warning: 'bg-warning-light/20 text-warning-dark border border-warning-light',
      danger: 'bg-danger-light/20 text-danger-dark border border-danger-light',
      neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
      
      // CL-specific badges (sesuai dengan color palette)
      'cl-low': 'bg-cl-low text-white font-semibold', // Blue
      'cl-optimal': 'bg-cl-optimal text-white font-semibold', // Green
      'cl-high': 'bg-cl-high text-white font-semibold', // Orange
      'cl-overload': 'bg-cl-overload text-white font-semibold', // Red
    };

    // 📏 Size styles
    const sizes = {
      sm: 'px-2 py-0.5 text-xs min-w-[2rem]',
      md: 'px-3 py-1 text-sm min-w-[2.5rem]',
      lg: 'px-4 py-1.5 text-base min-w-[3rem]',
    };

    return (
      <span
        ref={ref}
        className={clsx(
          baseStyles,
          variants[computedVariant || 'neutral'],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
