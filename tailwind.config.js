/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          bg: '#1C0F13',
          surface: '#1F5673',
          text: '#F8FFE5',
          muted: '#8EA8C3',
          accent: '#4C956C',
        }
      }
    }
  },
  plugins: [require('tailwind-scrollbar-hide')]
}
