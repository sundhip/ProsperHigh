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
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
        },
        "border-subtle": "var(--border-subtle)",
        "border-default": "var(--border-default)",
        primary: {
          DEFAULT: "var(--text-primary)",
        },
        secondary: {
          DEFAULT: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          yellow: "var(--accent-2)",
          coral: "var(--accent-coral)",
        },
        negative: {
          DEFAULT: "var(--negative)",
        },
        sidebar: {
          bg: "var(--sidebar-bg)",
          surface: "var(--sidebar-surface)",
          border: "var(--sidebar-border)",
          text: "var(--sidebar-text)",
          muted: "var(--sidebar-text-muted)",
        },
        charcoal: "var(--text-primary)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    }
  },
  plugins: []
};
