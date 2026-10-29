import type { Config } from 'tailwindcss';

/** TechExpert Energy design tokens — brand palette from the brief. */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        sun: { DEFAULT: '#F5B841', soft: '#FFF4DA', deep: '#E39A12' },
        nature: { DEFAULT: '#18A76A', soft: '#E3F5EC' },
        forest: { DEFAULT: '#075C46', deep: '#04392C' },
        ocean: { DEFAULT: '#087DBA', soft: '#E2F1F9' },
        tech: { DEFAULT: '#102B35', 2: '#16384A', 3: '#1E4A5F' },
        paper: '#F5FAF7',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 6.2vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.1rem, 4.2vw, 3.6rem)', { lineHeight: '1.06', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.6rem, 2.6vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        glow: '0 10px 30px -10px rgba(245,184,65,.65)',
        'glow-lg': '0 18px 40px -12px rgba(245,184,65,.8)',
        card: '0 1px 2px rgba(16,43,53,.04), 0 12px 32px -16px rgba(16,43,53,.18)',
      },
      keyframes: {
        flow: { to: { strokeDashoffset: '-40' } },
        pulseDot: { '70%': { boxShadow: '0 0 0 8px rgba(24,167,106,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(24,167,106,0)' } },
        rise: { from: { transform: 'translateY(16px)', opacity: '0.001' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: {
        flow: 'flow 1.2s linear infinite',
        pulseDot: 'pulseDot 2s infinite',
        rise: 'rise .9s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
