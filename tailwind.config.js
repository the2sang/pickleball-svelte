/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,svelte}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Noto Sans KR',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        pb: {
          bg: '#f7fafc',
          surface: '#ffffff',
          border: '#e2e8f0',
          muted: '#718096',
          ink: '#1a202c',
          navy: '#1a365d',
          navy2: '#2a4a7f',
          green: '#2e7d32',
          orange: '#e65100',
          red: '#c53030',
        },
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        lift: '0 8px 24px rgba(26, 54, 93, 0.18)',
      },
      borderRadius: {
        pb: '14px',
      },
    },
  },
  plugins: [],
}
