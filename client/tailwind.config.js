/** @type {import('tailwindcss').Config} */
export default {
  // Ensure Tailwind scans all JS, JSX, TS, TSX files inside the src directory
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
