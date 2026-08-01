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
        "elms-bg": "#F6F7F9",
        "elms-surface": "#FFFFFF",
        "elms-ink": "#14171F",
        "elms-muted": "#5B6270",
        "elms-line": "#E3E6EB",
        "elms-primary": "#0B6E4F",
        "elms-pending": "#C98A1E",
        "elms-reject": "#B23B34",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Geist", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
