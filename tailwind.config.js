/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-metal-900',
    'bg-metal-800',
    'bg-metal-700',
    'border-metal-700',
    'shadow-glow-super',
    'shadow-glow-epic',
    'shadow-glow-rare',
    'shadow-glow-common',
  ],
  theme: {
    extend: {
      colors: {
        'metal': {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
          500: '#4a4a4a',
        },
        'glow': {
          'super': '#ffffff',
          'epic': '#fbbf24', // Gold/yellow for Epic
          'rare': '#94a3b8', // Silver/slate for Rare
          'common': '#6b7280',
        }
      },
      boxShadow: {
        'glow-super': '0 0 20px rgba(255, 255, 255, 0.5)', // White glow for black foil
        'glow-epic': '0 0 20px rgba(251, 191, 36, 0.5)',   // Gold glow for Epic
        'glow-rare': '0 0 20px rgba(148, 163, 184, 0.5)',  // Silver glow for Rare
        'glow-common': '', // No glow for common cards
      }
    },
  },
  plugins: [],
}