import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#111111",
          panel: "#1A1A1A",
          panel2: "#242424",
          border: "#333333",
          text: "#F7F7F7",
          muted: "#A3A3A3",
        },
        accent: {
          DEFAULT: "#FFD100",
          soft: "#8A7000",
        },
        status: {
          green: "#22C55E",
          yellow: "#FFD100",
          red: "#EF4444",
          grey: "#6B7280",
        },
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};
export default config;
