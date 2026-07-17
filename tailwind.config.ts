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
          bg: "#0B0E14",
          panel: "#12161F",
          panel2: "#181D29",
          border: "#232937",
          text: "#E6E8EC",
          muted: "#8A93A6",
        },
        accent: {
          DEFAULT: "#3B82F6",
          soft: "#1E3A8A",
        },
        status: {
          green: "#22C55E",
          yellow: "#EAB308",
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
