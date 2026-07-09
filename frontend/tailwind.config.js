/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.jsx",
    "./main.jsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        guanta: {
          primary: '#009FA1',   // Cyan/Teal Institucional
          accent: '#00B4B8',    // Cyan claro
          pink: '#007A7C',      // Teal oscuro
          dark: '#1A1A1A',
          light: '#FFFFFF',
        }
      },
      backgroundImage: {
        'guanta-gradient': 'linear-gradient(45deg, #00B4B8, #009FA1, #007A7C)',
      }
    },
  },
  plugins: [],
}