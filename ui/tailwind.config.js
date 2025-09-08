/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#0a0a0a',
        'space-dark': '#1a1a2e',
        'space-blue': '#16213e',
        'neon-cyan': '#00ffff',
        'neon-green': '#00ff00',
        'neon-amber': '#ffbf00',
        'neon-red': '#ff0040',
        'palm-gray': '#c0c0c0',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Courier New', 'monospace'],
        'retro': ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
