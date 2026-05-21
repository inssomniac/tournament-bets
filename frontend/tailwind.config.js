/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg:          'var(--tg-theme-bg-color)',
          sbg:         'var(--tg-theme-secondary-bg-color)',
          text:        'var(--tg-theme-text-color)',
          hint:        'var(--tg-theme-hint-color)',
          link:        'var(--tg-theme-link-color)',
          btn:         'var(--tg-theme-button-color)',
          'btn-text':  'var(--tg-theme-button-text-color)',
          destructive: 'var(--tg-theme-destructive-text-color)',
        },
      },
    },
  },
  plugins: [],
}
