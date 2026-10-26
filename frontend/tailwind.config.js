/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080c14",
          surface: "#0e1526",
          card: "#141e34",
          cardHover: "#1a2744",
          border: "#1e2f52",
          borderGlow: "#2e487d",
          accent: "#6366f1",
          accentCyan: "#06b6d4",
          accentBlue: "#38bdf8",
          textPrimary: "#f1f5f9",
          textSecondary: "#94a3b8",
          textMuted: "#64748b",
        },
        risk: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#eab308",
          low: "#10b981",
        }
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.35)",
        glowCyan: "0 0 20px -5px rgba(6, 182, 212, 0.35)",
        glowRed: "0 0 20px -5px rgba(239, 68, 68, 0.35)",
      }
    },
  },
  plugins: [],
}
