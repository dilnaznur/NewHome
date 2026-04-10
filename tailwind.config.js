/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--color-bg)',
          text: 'var(--color-text)',
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          border: 'var(--color-border)',
        },
        badge: {
          lost: 'var(--badge-lost)',
          found: 'var(--badge-found)',
          stray: 'var(--badge-stray)',
        },
      },
      fontFamily: {
        heading: ['Unbounded', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
    },
  },
  plugins: [],
}

