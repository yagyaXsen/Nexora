/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['IBM Plex Serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        nx: {
          dark: '#09090B',
          accent: '#4F7CFF',
          violet: '#8B7FFF',
          muted: 'rgba(255,255,255,0.72)',
          glass: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.12)',
        },
        swiss: {
          red: '#960018',
          'red-hover': '#7a0013',
          canvas: '#FAFAF8',
          surface: '#F0F0EA',
          border: '#E2E2DC',
          ink: '#1A1110',
        },
      },
      boxShadow: {
        // Components use v4-style shadow-xs / shadow-2xs utilities that don't
        // exist in v3's default theme; provide their v4-equivalent values here.
        '2xs': '0 1px 1px rgb(0 0 0 / 0.05)',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      scale: {
        // Non-default scale steps used for press/hover micro-interactions
        98: '0.98',
        102: '1.02',
        103: '1.03',
      },
    },
  },
  plugins: [],
}
