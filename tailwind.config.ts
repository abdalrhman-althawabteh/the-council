import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#F15E28",
          dark: "#D94E1F",
          soft: "#FFE9DC",
        },
        canvas: "#FBF4EF",
        card: "#FFFFFF",
        ink: "#161616",
        muted: "#6B6259",
        line: "#E4DED8",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "var(--font-plex-ar)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-plex-ar)", "system-ui", "sans-serif"],
        ar: ["var(--font-plex-ar)", "var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(22,22,22,0.12)",
        glow: "0 8px 30px -6px rgba(241,94,40,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "slide-in": "slide-in 0.45s cubic-bezier(0.22,1,0.36,1) both",
        blink: "blink 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
