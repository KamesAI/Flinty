import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        "kames-orange": "#f97316",
        "kames-magenta": "#ec4899",
        "kames-bg": "#0a0a0a",
        "kames-card": "rgba(255, 255, 255, 0.03)",
        "kames-border": "rgba(255, 255, 255, 0.08)",
      },
      backgroundImage: {
        "kames-gradient": "linear-gradient(135deg, #f97316 0%, #ec4899 100%)",
        "kames-radial": "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.1) 0%, rgba(10, 10, 10, 1) 70%)",
      },
      boxShadow: {
        "kames-glow": "0 0 6px rgba(249, 115, 22, 0.8), 0 0 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.3)",
        "kames-glow-sm": "0 0 4px rgba(249, 115, 22, 0.6), 0 0 12px rgba(249, 115, 22, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
