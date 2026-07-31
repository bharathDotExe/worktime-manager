/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Single accent used across every page.
        accent: {
          50: "#eef6ff",
          100: "#d9ebff",
          500: "#1f6feb",
          600: "#1a5fcc",
          700: "#164ea8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
