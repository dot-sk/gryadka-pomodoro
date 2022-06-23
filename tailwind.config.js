/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Favorit", "sans-serif"],
      sansWide: ["Favorit Extended", "sans-serif"],
      mono: ["IBM Plex Mono", "monospace"],
    },
    extend: {},
  },
  plugins: [],
};
