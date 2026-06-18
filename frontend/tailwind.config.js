/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DigiSheet brand palette (mirrors Star Scan's neumorphic theme)
        ds: {
          bg:        '#1A1A18',       // Dark background
          surface:   '#222220',       // Card / panel background
          border:    '#2E2E2B',       // Subtle border
          gold:      '#C8A84B',       // Primary accent (amber/gold)
          'gold-dim':'#8A7233',       // Muted gold
          green:     '#4CAF79',       // Success / done
          'green-dim':'#2E7A52',      // Muted green
          red:       '#E05A5A',       // Missing / error
          cream:     '#E8DCC8',       // Primary text (dark mode)
          muted:     '#8A8278',       // Muted text
          caution:   '#D4944A',       // Warning / caution
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ds-card': '0 2px 16px 0 rgba(0,0,0,0.45)',
        'ds-inset': 'inset 2px 2px 5px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(255,255,255,0.03)',
        'ds-neu': '6px 6px 14px rgba(0,0,0,0.5), -3px -3px 8px rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out both',
        'slide-up': 'slideUp 0.3s ease-out both',
        'pulse-gold': 'pulseGold 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
};
