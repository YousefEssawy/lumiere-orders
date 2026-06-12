import type { Config } from "tailwindcss";

// كل الألوان بتيجي من CSS variables في globals.css — ده المصدر الوحيد للهوية.
// مفيش hex hardcoded هنا ولا في أي مكون.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "var(--ink-900)",
          700: "var(--ink-700)",
          500: "var(--ink-500)",
          300: "var(--ink-300)",
          100: "var(--ink-100)",
        },
        page: "var(--bg-page)",
        canvas: "var(--bg-canvas)",
        soft: "var(--bg-soft)",
        line: "var(--line)",
        accent: {
          DEFAULT: "var(--accent)",
          deep: "var(--accent-deep)",
        },
        cream: "var(--cream)",
        beige: "var(--beige)",
        pastel: {
          pink: "var(--pastel-pink)",
          peach: "var(--peach)",
          butter: "var(--butter)",
          mint: "var(--mint)",
          sky: "var(--sky)",
          lavender: "var(--lavender)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        // الترتيب بيتقلب حسب اللغة في globals.css
        sans: ["var(--font-quicksand)", "var(--font-cairo)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-league)", "var(--font-cairo)", "ui-sans-serif"],
        ar: ["var(--font-cairo)", "ui-sans-serif"],
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "20px",
        xl: "28px",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
    },
  },
  plugins: [],
};

export default config;
