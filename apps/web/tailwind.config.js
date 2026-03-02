/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.25rem',
        lg: '2rem',
        xl: '2rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50))',
          100: 'rgb(var(--color-primary-100))',
          200: 'rgb(var(--color-primary-200))',
          300: 'rgb(var(--color-primary-300))',
          400: 'rgb(var(--color-primary-400))',
          500: 'rgb(var(--color-primary-500))',
          600: 'rgb(var(--color-primary-600))',
          700: 'rgb(var(--color-primary-700))',
          800: 'rgb(var(--color-primary-800))',
          900: 'rgb(var(--color-primary-900))',
        },
        accent: {
          400: 'rgb(var(--color-accent-400))',
          500: 'rgb(var(--color-accent-500))',
          600: 'rgb(var(--color-accent-600))',
          700: 'rgb(var(--color-accent-700))',
        },
        surface: {
          DEFAULT: 'rgb(var(--color-surface))',
          foreground: 'rgb(var(--color-surface-foreground))',
        },
        border: 'rgb(var(--color-border))',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.06)',
        DEFAULT: '0 2px 8px rgba(0,0,0,0.08)',
        lg: '0 8px 24px rgba(0,0,0,0.1)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Shared z-index scale: navbar highest of layout; dropdown just above it so menus stay visible
      // base(0) < content-overlay(10) < sticky-bar(20) < navbar(50) < dropdown(55) < backdrop(60) < overlay-content(70) < modal(80) < a11y(90)
      zIndex: {
        'content-overlay': 10,
        'sticky-bar': 20,
        navbar: 50,
        dropdown: 55,
        backdrop: 60,
        'overlay-content': 70,
        modal: 80,
        a11y: 90,
      },
    },
  },
  plugins: [],
}
