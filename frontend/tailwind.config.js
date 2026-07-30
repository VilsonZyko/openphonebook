/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          bg: 'var(--brand-bg)',
          surface: 'var(--brand-surface)',
          main: 'var(--brand-main)',
          muted: 'var(--brand-muted)',
          border: 'var(--brand-border)',
        }
      }
    }
  },
  plugins: [],
}
