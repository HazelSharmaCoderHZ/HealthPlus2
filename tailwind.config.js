/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {maxWidth: {
        '4.5': '4.5rem',  // 72px
      }},
  },
  safelist: [
  {
    pattern: /(bg|text)-(yellow|blue|green|red)-(100|300|500)/,
  },
],
  plugins: [],
};