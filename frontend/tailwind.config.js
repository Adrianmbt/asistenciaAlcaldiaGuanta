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
          primary: '#F05438',   // Naranja/Rojo del Logo
          accent: '#FAAF40',    // Amarillo del borde
          pink: '#D62976',      // Rosa/Púrpura del borde
          dark: '#1A1A1A',
          light: '#FFFFFF',
        }
      },
      backgroundImage: {
        'guanta-gradient': 'linear-gradient(45deg, #FAAF40, #F05438, #D62976)',
      }
    },
  },
  plugins: [],
}