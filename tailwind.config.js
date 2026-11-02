/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        torii: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#e14942', // Signature Vermilion Red
          600: '#d13831',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        indigo: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9fe',
          300: '#a3bffe',
          400: '#799bfb',
          500: '#4f71f6',
          600: '#3450eb',
          700: '#273bcf',
          800: '#1b365d', // Signature Japanese Aizome Indigo
          900: '#142145',
          950: '#0a1024',
        },
        zen: {
          paper: '#FDFBF7',
          stone: '#E5E0D8',
          ink: '#1E232A',
          dark: '#0b0f17',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Noto Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        jp: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', '"Meiryo"', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'lift': '0 10px 25px -5px rgba(225, 73, 66, 0.15)',
        'glow-torii': '0 0 25px -3px rgba(225, 73, 66, 0.35)',
        'glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
        'glow-blue': '0 0 25px -3px rgba(59, 130, 246, 0.35)',
        'glow-amber': '0 0 25px -3px rgba(245, 158, 11, 0.35)',
        'glow-purple': '0 0 25px -3px rgba(168, 85, 247, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        shimmer: {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}
