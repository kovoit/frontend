import type { Config } from 'tailwindcss'
import { colors } from './src/theme/tokens'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px -12px rgba(15, 42, 85, 0.18)',
        soft: '0 2px 8px -2px rgba(15, 42, 85, 0.10)',
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
} satisfies Config
