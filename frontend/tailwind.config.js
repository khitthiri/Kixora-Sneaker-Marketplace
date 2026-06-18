/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'kixora-black': '#0A0A0A',
        'kixora-white': '#F5F4F0',
        'kixora-amber': '#F5A623',
        'kixora-gray': '#888580',
        'kixora-surface': '#141412',
        'kixora-surface2': '#1E1E1B',
        'kixora-surface3': '#262622',
        'kixora-border': '#2E2E2B',
        'kixora-green': '#2ECC71',
        'kixora-red': '#E24B4A',
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        ticker: 'ticker 30s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
    },
  },
  plugins: [],
};
