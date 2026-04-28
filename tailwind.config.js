/** @type {import('tailwindcss').Config} */
// OS³ Command Centre — Tailwind config
// Brand Pack v6: matte-black, deep-graphite, steel-surface, cyan (≤15%), gold (money/exposure only)
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // ── OS³ brand tokens ──────────────────────────
        matte: "#0A0C10",
        graphite: "#0E1116",
        steel: "#151A22",
        edge: "#1E2530",
        cyan: {
          DEFAULT: "#2AF1FF",
          50: "rgba(42,241,255,0.05)",
          10: "rgba(42,241,255,0.10)",
          15: "rgba(42,241,255,0.15)",
          30: "rgba(42,241,255,0.30)",
          60: "rgba(42,241,255,0.60)",
        },
        gold: {
          DEFAULT: "#D4AF37",
          15: "rgba(212,175,55,0.15)",
          30: "rgba(212,175,55,0.30)",
        },
        ink: {
          DEFAULT: "#E8ECF1",
          dim:   "#9CA3AF",
          mute:  "#6B7280",
          ghost: "#374151",
        },
        // ── shadcn/ui (HSL CSS-vars) ──────────────────
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Orbitron HEADLINES & key metric numbers ONLY — never body
        display: ['"Orbitron"', "system-ui", "sans-serif"],
        // Inter / Satoshi for body
        sans:    ['"Inter"', '"Satoshi"', "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
