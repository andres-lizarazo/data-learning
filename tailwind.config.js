/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette — Python blue/yellow inspired, dark-first UI.
        ink: {
          900: "#0b1020",
          800: "#11182e",
          700: "#1a2440",
          600: "#243156",
          500: "#33416b",
        },
        brand: {
          DEFAULT: "#4f8cff",
          py: "#3776ab", // python blue
          yellow: "#ffd43b", // python yellow
          green: "#22c55e",
          red: "#ef4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
