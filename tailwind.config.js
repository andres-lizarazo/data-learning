/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep base + layered glass surfaces (Aurora Glass theme).
        ink: {
          900: "#070710", // app background
          800: "#0c0c1a", // raised surface
          700: "#13132a", // panels
          600: "#20203f", // borders / hover
          500: "#2d2d57",
        },
        // Accent spectrum: violet → cyan → lime.
        accent: {
          violet: "#8b5cf6",
          cyan: "#22d3ee",
          lime: "#a3e635",
        },
        // `brand-*` kept for back-compat (DSA visualizers read these); remapped to the
        // new spectrum so existing components inherit the palette automatically.
        brand: {
          DEFAULT: "#8b5cf6", // primary accent (violet)
          py: "#8b5cf6", // "unsorted" bars / nodes → violet
          yellow: "#fbbf24", // "active" highlight → amber
          green: "#22d3ee", // "done"/visited → cyan
          red: "#fb7185",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.25), 0 8px 30px -8px rgba(139,92,246,0.45)",
        "glow-lg":
          "0 0 0 1px rgba(34,211,238,0.25), 0 18px 50px -12px rgba(139,92,246,0.55)",
        glass:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 10px 40px -12px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(110deg, #8b5cf6 0%, #6366f1 35%, #22d3ee 70%, #a3e635 110%)",
        "accent-soft":
          "linear-gradient(110deg, rgba(139,92,246,0.18), rgba(34,211,238,0.18))",
      },
      keyframes: {
        auroraDrift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%,-4%,0) scale(1.1)" },
          "66%": { transform: "translate3d(-5%,5%,0) scale(0.95)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        flame: {
          "0%,100%": { transform: "scale(1) rotate(-2deg)", opacity: "0.9" },
          "50%": { transform: "scale(1.12) rotate(2deg)", opacity: "1" },
        },
      },
      animation: {
        "aurora-1": "auroraDrift 22s ease-in-out infinite",
        "aurora-2": "auroraDrift 28s ease-in-out infinite reverse",
        "aurora-3": "auroraDrift 34s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 2.4s ease-in-out infinite",
        flame: "flame 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
