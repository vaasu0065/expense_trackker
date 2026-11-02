/** @type {import('tailwindcss').Config} */
// Design system: warm near-black base, champagne gold for actions and focus,
// green only for money in, coral only for money out, orange for warnings.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest
        ink: {
          950: "#0B0B0D", // page background
          900: "#131316", // cards
          850: "#1A1A1E", // inputs, raised areas inside cards
          800: "#222227", // hover
          700: "#2E2E34", // strong borders, dividers
        },
        // Champagne gold. Gold fills always take dark (ink-950) text.
        brand: {
          200: "#F3E3BC",
          300: "#E9CF95",
          400: "#D6B36A",
          500: "#C49A4A",
          600: "#A67E35",
          700: "#86642A",
        },
        income: { 300: "#86EFAC", 400: "#4ADE80", 500: "#22C55E", 600: "#16A34A" },
        expense: { 300: "#FCA5A5", 400: "#F87171", 500: "#EF4444", 600: "#DC2626" },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Instrument Serif", "Georgia", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        pop: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 48px -16px rgba(0,0,0,0.85)",
        gold: "0 1px 0 0 rgba(255,255,255,0.35) inset, 0 8px 24px -10px rgba(214,179,106,0.55)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
        "slide-in": "slideIn 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
