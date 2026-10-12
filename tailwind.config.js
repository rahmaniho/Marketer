/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', '-apple-system', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefbf4',
          100: '#d6f5e3',
          200: '#b0e9cb',
          300: '#7bd7ad',
          400: '#45bd8b',
          500: '#1fa271',
          600: '#12825c',
          700: '#0f684c',
          800: '#10533e',
          900: '#0e4434',
          950: '#05261d',
        },
        accent: {
          50: '#fffbeb',
          100: '#fff4c6',
          200: '#ffe888',
          300: '#ffd64a',
          400: '#ffc220',
          500: '#f9a307',
          600: '#dd7c02',
          700: '#b75806',
          800: '#94440c',
          900: '#7a380d',
        },
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#d9dee7',
          300: '#b8c1d0',
          400: '#8e9bb1',
          500: '#6b7a94',
          600: '#546179',
          700: '#454f63',
          800: '#3b4353',
          900: '#1f2531',
          950: '#131720',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px -8px rgba(16,24,40,.10)',
        pop: '0 12px 40px -12px rgba(16,24,40,.24)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s ease both',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
