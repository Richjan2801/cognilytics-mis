// Tailwind CSS configuration
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // 🎨 Color Palette (from UI mockup)
      colors: {
        // Primary Blues
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Main primary
          600: '#2563EB', // Darker primary (buttons)
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Secondary Teal/Cyan
        secondary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6', // Main secondary
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // Status Colors
        success: {
          light: '#86EFAC',
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
        warning: {
          light: '#FCD34D',
          DEFAULT: '#F59E0B',
          dark: '#D97706',
        },
        danger: {
          light: '#FCA5A5',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        // CL Load Colors (for badges)
        cl: {
          low: '#3B82F6',      // Blue (0-29)
          optimal: '#22C55E',  // Green (30-59)
          high: '#F59E0B',     // Orange (60-79)
          overload: '#EF4444', // Red (80-100)
        },
        // Neutrals
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      // 📏 Spacing (consistent spacing scale)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // 🔤 Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      // 🎭 Shadows
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      // 🌊 Border Radius
      borderRadius: {
        'card': '0.75rem', // 12px
        'badge': '9999px', // Full round
      },
      // 🎬 Animations
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
