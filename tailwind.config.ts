import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#2d5a44",
        muted: "#5a8a78",
        border: "#C7E0D3",
        accent: "#76B89F",
        surface: "#E8F3EF",
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(45 90 68 / 0.06)",
        md: "0 4px 6px -1px rgb(45 90 68 / 0.08), 0 2px 4px -2px rgb(45 90 68 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
