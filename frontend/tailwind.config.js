/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef3ff',
          100: '#dce6ff',
          200: '#b6c9ff',
          300: '#8aa6ff',
          400: '#5c7cff',
          500: '#3358f4',
          600: '#2545d6',
          700: '#1c36ac',
          800: '#182d87',
          900: '#16276b',
        },
        danger: {
          50: '#fdecec',
          400: '#f0605c',
          500: '#e0332e',
          600: '#c22824',
        },
        accent: {
          purple: '#8b6fd6',
        },
        neutral: {
          0: '#ffffff',
          50: '#f7f8fa',
          100: '#eef0f3',
          200: '#e2e5ea',
          300: '#cdd2da',
          400: '#9aa1ac',
          500: '#767d8a',
          600: '#565d68',
          700: '#3d434c',
          800: '#282c33',
          900: '#16181c',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
};
