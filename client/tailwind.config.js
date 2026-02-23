/** @type {import('tailwindcss').Config} */
export default {
  // Dark mode via a class on <html> — gives full manual control
  darkMode: 'class',

  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      // ── Brand colours ─────────────────────────────────────────────────
      colors: {
        // Primary brand gradient stops
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo-500 — main accent
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Purple accent (gradient end)
        accent: {
          400: '#c084fc',
          500: '#a855f7', // Purple-500
          600: '#9333ea',
        },
        // Dark surface palette (used for backgrounds/cards)
        dark: {
          50:  '#f8fafc',
          900: '#0f0f13',  // Page background
          800: '#17171f',  // Card surface
          700: '#1e1e2a',  // Elevated surface / navbar
          600: '#2a2a38',  // Input backgrounds
          500: '#3a3a50',  // Borders / dividers
          400: '#6b6b8a',  // Muted text
          300: '#9090b0',  // Placeholder text
        },
      },

      // ── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // ── Spacing & sizing ──────────────────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ── Shadows (dark-optimised glow shadows) ────────────────────────
      boxShadow: {
        'glow-sm':   '0 0 12px 0 rgba(99, 102, 241, 0.3)',
        'glow':      '0 0 24px 4px rgba(99, 102, 241, 0.35)',
        'glow-lg':   '0 0 48px 8px rgba(99, 102, 241, 0.4)',
        'card':      '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover':'0 12px 40px rgba(0, 0, 0, 0.6)',
      },

      // ── Backdrop blur ─────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },

      // ── Animation timings ─────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '300ms',
        fast: '150ms',
        slow: '500ms',
      },

      // ── Background gradients ─────────────────────────────────────────
      backgroundImage: {
        'brand-gradient':   'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        'brand-gradient-r': 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        'dark-gradient':    'linear-gradient(180deg, #17171f 0%, #0f0f13 100%)',
        'card-gradient':    'linear-gradient(145deg, #1e1e2a 0%, #17171f 100%)',
        'hero-mesh':        'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.25) 0%, transparent 70%)',
      },
    },
  },

  plugins: [],
}
