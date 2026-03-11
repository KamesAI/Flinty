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
        background: "var(--background)",
        foreground: "var(--foreground)",
        orange: {
          300: "#FFC166",
          400: "#FFB347",
          500: "#FFA318",
          600: "#E69315",
          700: "#CC8212",
          800: "#B37210",
          900: "#99610D",
        },
      },
    },
  },
  plugins: [],
};
export default config;
