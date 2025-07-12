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
          'epic': '#9333ea',
          'rare': '#2563eb',
          'common': '#6b7280',
        }
      },
      boxShadow: {
        'glow-super': '0 0 20px rgba(255, 255, 255, 0.5)',
        'glow-epic': '0 0 20px rgba(147, 51, 234, 0.5)',
        'glow-rare': '0 0 20px rgba(37, 99, 235, 0.5)',
        'glow-common': '0 0 10px rgba(107, 114, 128, 0.3)',
      }
    },
  },
  plugins: [],
}