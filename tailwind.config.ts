import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        accent: {
          DEFAULT: "#06B6D4",
          50: "#ECFEFF",
          100: "#CFFAFE",
          200: "#A5F3FC",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
        },
        mint: "#10B981",
        amber: "#F59E0B",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F8FAFC",
          muted: "#F1F5F9",
        },
        dark: {
          DEFAULT: "#0B0F1A",
          surface: "#111827",
          raised: "#1E293B",
          border: "#334155",
        },
      },
      fontFamily: {
        sans: ["Inter", "Vazirmatn", "system-ui", "sans-serif"],
        display: ["Satoshi", "Inter", "Vazirmatn", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.025em" }],
        "display-lg": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
        "display-xs": ["1.5rem", { lineHeight: "1.35", letterSpacing: "-0.005em" }],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        30: "7.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-lg": "0 0 40px rgba(139, 92, 246, 0.4)",
        "glow-accent": "0 0 20px rgba(6, 182, 212, 0.3)",
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)",
        medium: "0 2px 4px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)",
        hard: "0 4px 8px rgba(15, 23, 42, 0.08), 0 16px 48px rgba(15, 23, 42, 0.12)",
        "card-hover": "0 8px 32px rgba(139, 92, 246, 0.12)",
        float: "0 20px 60px rgba(15, 23, 42, 0.15)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "slide-in-left": "slideInLeft 0.6s ease-out",
        shimmer: "shimmer 2s infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "counter": "counter 1.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
        "gradient-brand-subtle": "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.08) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
