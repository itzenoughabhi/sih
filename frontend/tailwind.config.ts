import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        gov: {
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          header: "#FFFFFF",
          primary: "#0F766E",
          dark: "#115E59",
          light: "#CCFBF1",
          text: "#1E293B",
          muted: "#64748B",
          subtle: "#94A3B8",
        },
        status: {
          success: "#15803D",
          successBg: "#DCFCE7",
          warning: "#D97706",
          warningBg: "#FEF3C7",
          error: "#DC2626",
          errorBg: "#FEE2E2",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      }
    },
  },
  plugins: [],
};
export default config;
