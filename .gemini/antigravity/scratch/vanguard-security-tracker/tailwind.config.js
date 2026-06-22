/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgDark: "#0B0F19",
        bgPanel: "#151B2E",
        bgHover: "#1E2640",
        accentNeon: "#3B82F6",
        accentTeal: "#14B8A6",
        accentPurple: "#8B5CF6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        premium: "0 20px 40px -15px rgba(0, 0, 0, 0.5)",
      },
      backdropBlur: {
        xs: "2px",
      }
    },
  },
  plugins: [],
}
