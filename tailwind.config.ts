import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#090b10",
          900: "#10141b",
          850: "#151a22",
          800: "#1b222c",
          700: "#27313e"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(96 165 250 / 0.16), 0 20px 80px rgb(0 0 0 / 0.32)"
      }
    }
  },
  plugins: []
};

export default config;
