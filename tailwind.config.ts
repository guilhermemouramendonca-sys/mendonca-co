import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A2E3A",
        graphite: "#3E4C59",
        gold: "#C2A878",
        "gold-light": "#E0D0B4",
        bg: "#FAF9F7",
        "border-brand": "#E4E2DE",
        surface: "#FFFFFF",
        "text-main": "#1A1A1A",
        "text-muted": "#6B6B6B",
        success: "#2D6A4F",
        warning: "#E9C46A",
        danger: "#C1121F",
      },
      fontFamily: {
        display: ["Cormorant Garamond", "serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["Inter Tight", "monospace"],
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
