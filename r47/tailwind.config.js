/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          gold: '#D4A017',
        },
        sand: {
          light: '#F5E6C8',
          DEFAULT: '#E8D5A3',
          dark: '#3E2723',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
