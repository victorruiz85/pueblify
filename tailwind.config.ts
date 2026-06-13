import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Pueblify: verde suave, tierra clara, neutros
        brand: {
          50: "#eef6f1",
          100: "#d7ebe0",
          200: "#b0d7c2",
          300: "#84bf9f",
          400: "#5aa57e",
          500: "#3f8f6b",
          600: "#2f7355",
          700: "#275c45",
          800: "#214d3a",
          900: "#1c3f30",
        },
        earth: {
          50: "#faf7f1",
          100: "#f4efe6",
          200: "#e8dcc6",
          300: "#d9c8a6",
          400: "#cdbfa6",
          500: "#b9a37e",
        },
        ink: "#1f2924",
        muted: "#5d6b63",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};

export default config;
