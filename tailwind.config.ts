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
        brand: {
          50:  "#fdf8f0",
          100: "#faefd8",
          200: "#f3d9a8",
          300: "#e8bb6b",
          400: "#dc9a3a",
          500: "#c8811f",
          600: "#a86518",
          700: "#864e17",
          800: "#6d3e18",
          900: "#5a3417",
        },
      },
    },
  },
  plugins: [],
};
export default config;
