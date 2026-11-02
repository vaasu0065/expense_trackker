/** @type {import('tailwindcss').Config} */
// Design system: dark slate (OLED) base, indigo for actions,
// emerald only for money in, rose only for money out, amber for warnings.
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest
        ink: {
          950: "#020617", // page background
          900: "#0B1222", // cards
          850: "#101A2E", // inputs, raised areas inside cards
          800: "#16223A", // hover
          700: "#22304D", // strong borders, dividers
        },
        brand: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        income: { 300: "#6EE7B7", 400: "#34D399", 500: "#10B981", 600: "#059669" },
        expense: { 300: "#FDA4AF", 400: "#FB7185", 500: "#F43F5E", 600: "#E11D48" },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        pop: "0 20px 40px -16px rgba(0,0,0,0.7)",
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
