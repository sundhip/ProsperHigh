/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-app)",
        surface: "var(--bg-surface)",
        "surface-elevated": "var(--bg-surface-elevated)",
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        primary: {
          DEFAULT: "var(--text-primary)",
          navy: "#1F3A4A",
          dark: "#142631",
          light: "#2C5168",
        },
        secondary: {
          DEFAULT: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "#C9A96E",
          gold: "#D4AF37",
          light: "#DFC593",
        },
        positive: {
          DEFAULT: "#10B981",
          light: "#34D399",
          soft: "var(--positive-soft)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          soft: "var(--warning-soft)",
        },
        negative: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          soft: "var(--negative-soft)",
        },
        charcoal: "var(--text-primary)",
        panel: "var(--bg-surface)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-manrope)", "sans-serif"],
      },
    }
  },
  plugins: []
};
