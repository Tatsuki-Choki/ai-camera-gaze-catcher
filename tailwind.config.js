/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--base)',
        panel: {
          DEFAULT: 'var(--panel)',
          2: 'var(--panel-2)',
        },
        inset: 'var(--inset)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        hi: 'var(--text-hi)',
        mid: 'var(--text-mid)',
        low: 'var(--text-low)',
        amber: {
          DEFAULT: 'var(--amber)',
          hi: 'var(--amber-hi)',
          deep: 'var(--amber-deep)',
        },
        'on-amber': 'var(--on-amber)',
        rec: 'var(--rec)',
        stage: {
          DEFAULT: 'var(--stage)',
          deep: 'var(--stage-deep)',
          line: 'var(--stage-line)',
          hi: 'var(--stage-hi)',
          mid: 'var(--stage-mid)',
          low: 'var(--stage-low)',
        },
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.2, 0.9, 0.3, 1)',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
        'rise': 'rise 0.5s cubic-bezier(0.2, 0.9, 0.3, 1) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(14px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        rise: {
          '0%': { transform: 'translateY(18px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
