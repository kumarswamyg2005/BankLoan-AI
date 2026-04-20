/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          600: '#1B3A6B',
          700: '#162d4a',
          800: '#0f2035',
        }
      },
      fontFamily: {
        sans:    ['Instrument Sans', 'system-ui', 'sans-serif'],
        display: ['Cabinet Grotesk', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
