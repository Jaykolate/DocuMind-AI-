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
        vercel: {
          bg: '#000000',
          card: '#0a0a0a',
          cardHover: '#111111',
          subtle: '#171717',
          border: '#262626',
          borderHover: '#404040',
          textMuted: '#888888',
          textLight: '#a1a1a1',
          textWhite: '#ffffff',
          accent: '#ffffff',
          badge: '#141414'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
