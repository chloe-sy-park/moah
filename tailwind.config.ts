import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // moah Primary Colors
        primary: {
          DEFAULT: '#FF6B6B',
          50: '#FFF0F0',
          100: '#FFE0E0',
          200: '#FFC2C2',
          300: '#FFA3A3',
          400: '#FF8585',
          500: '#FF6B6B',
          600: '#E85A5A',
          700: '#D14A4A',
          800: '#BA3A3A',
          900: '#A32B2B',
        },
        // Neutral Colors
        surface: '#FFFFFF',
        background: '#FAFAFA',
        border: '#E5E5E5',
        // Text Colors
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
