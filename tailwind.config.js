/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#FFF9F2',
          100: '#FAF6F0',
          200: '#F0E6D6',
          300: '#E0D0B8',
          400: '#C8956C',
          500: '#9A6B3C',
          600: '#7A5230',
          700: '#5C3D24',
          800: '#3D2918',
          900: '#1F150C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
