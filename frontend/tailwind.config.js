/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        sand: "#eaf4ff",
        brass: "#c49a6c",
        moss: "#2a4b3c",
        ember: "#c25a3a",
        slate: "#4b5563",
      },
      fontFamily: {
        display: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Noto Sans", "Ubuntu", "Cantarell", "Helvetica Neue", "Arial", "sans-serif"],
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Noto Sans", "Ubuntu", "Cantarell", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 14px 40px rgba(11, 15, 20, 0.12)",
      },
      backgroundImage: {
        grain: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)",
        hero: "linear-gradient(135deg, rgba(36,59,47,0.94), rgba(11,15,20,0.96))",
      },
    },
  },
  plugins: [],
};

export default config;
