/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2c3e6a", // Azul escuro do ícone
          foreground: "hsl(0 0% 100%)", // Mantendo o branco para o texto
        },
        secondary: {
          DEFAULT: "hsl(0 0% 96%)", // Cinza muito claro
          foreground: "hsl(0 0% 10%)", // Quase preto
        },
        destructive: {
          DEFAULT: "hsl(0 0% 0%)", // Preto para ações destrutivas
          foreground: "hsl(0 0% 100%)", // Branco
        },
        muted: {
          DEFAULT: "hsl(0 0% 96%)", // Cinza muito claro
          foreground: "hsl(0 0% 40%)", // Cinza médio
        },
        accent: {
          DEFAULT: "hsl(0 0% 96%)", // Cinza muito claro
          foreground: "hsl(0 0% 10%)", // Quase preto
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)", // Branco
          foreground: "hsl(0 0% 10%)", // Quase preto
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)", // Branco
          foreground: "hsl(0 0% 10%)", // Quase preto
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

