/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: '#1e90ff',
        accent: '#00e5ff',
        dark: {
          900: '#0a1628',
          800: '#0d1f3c',
          700: '#112240',
          600: '#1a2a4a',
          500: '#1a3a5c',
          400: '#2a4a6c',
        },
      },
    },
  },
  plugins: [],
};
