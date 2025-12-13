/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'poker-green': '#35654d',
        'card-red': '#e74c3c',
        'card-black': '#2c3e50',
      },
    },
  },
  plugins: [],
}
