/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main-pink': '#FFCCE1',
        'main-yellow': '#FFF5D7',
      },
    },
  },
  plugins: [],
}
