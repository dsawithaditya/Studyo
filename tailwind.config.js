/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm neutrals (cream ink on near-black paper)
        slate: {
          50: '#f6f2ea',
          100: '#e9e4da',
          200: '#d3cdc0',
          300: '#b8b2a5',
          400: '#8f8a7e',
          500: '#6b675e',
          600: '#4a4741',
          700: '#2f2d29',
          800: '#1e1d1a',
          900: '#141413',
          950: '#0c0c0b',
        },
        // Accent: halftone "warm" orange
        indigo: {
          50: '#fff4ec',
          100: '#ffe3d0',
          200: '#fbc8a3',
          300: '#f5a26b',
          400: '#ef8a47',
          500: '#e9762b',
          600: '#d1631d',
          700: '#a84d16',
          800: '#7c3a13',
          900: '#3d1d0c',
          950: '#160a06',
        },
        cyan: {
          200: '#f2c48c',
          300: '#f2c48c',
          400: '#e9b072',
          500: '#e9762b',
          600: '#c2561c',
        },
        purple: {
          300: '#f2c48c',
          400: '#e9b072',
          500: '#c2361c',
          600: '#a02b16',
          900: '#2a0f08',
          950: '#160a06',
        },
        brand: {
          50: '#fff4ec',
          100: '#ffe3d0',
          200: '#fbc8a3',
          300: '#f5a26b',
          400: '#ef8a47',
          500: '#e9762b',
          600: '#d1631d',
          700: '#a84d16',
          800: '#7c3a13',
          900: '#3d1d0c',
          950: '#160a06',
        },
        focus: {
          work: '#e9762b',
          break: '#10b981',
          longBreak: '#f2c48c',
          stopwatch: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
