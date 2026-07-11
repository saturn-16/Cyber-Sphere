/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#000000',   // pure black
          surface:  '#0d1117',   // card background
          border:   '#1e293b',   // subtle border
          cyan:     '#00f5ff',   // primary neon cyan
          violet:   '#7c3aed',   // secondary violet
          green:    '#39ff14',   // neon green (safe)
          red:      '#ff0040',   // neon red (danger)
          amber:    '#ff9500',   // amber (warning)
          blue:     '#0ea5e9',   // info blue
          muted:    '#64748b',   // muted text
          text:     '#e2e8f0',   // main text
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        inter:    ['Inter', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan':   '0 0 20px rgba(0, 245, 255, 0.4), 0 0 60px rgba(0, 245, 255, 0.15)',
        'neon-violet': '0 0 20px rgba(124, 58, 237, 0.4), 0 0 60px rgba(124, 58, 237, 0.15)',
        'neon-green':  '0 0 20px rgba(57, 255, 20, 0.4), 0 0 60px rgba(57, 255, 20, 0.15)',
        'neon-red':    '0 0 20px rgba(255, 0, 64, 0.4), 0 0 60px rgba(255, 0, 64, 0.15)',
        'neon-amber':  '0 0 20px rgba(255, 149, 0, 0.4), 0 0 60px rgba(255, 149, 0, 0.15)',
        'glass':       '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'cyber-grid':    "linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)",
        'cyber-radial':  'radial-gradient(ellipse at center, rgba(0,245,255,0.08) 0%, transparent 70%)',
        'gradient-cyber':'linear-gradient(135deg, #00f5ff 0%, #7c3aed 100%)',
      },
      backgroundSize: {
        'grid-lg': '60px 60px',
      },
      animation: {
        'pulse-neon':  'pulseNeon 2s ease-in-out infinite',
        'scan-beam':   'scanBeam 2s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'ticker':      'ticker 30s linear infinite',
        'glow-rotate': 'glowRotate 4s linear infinite',
        'fade-in-up':  'fadeInUp 0.5s ease-out forwards',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0,245,255,0.4)' },
          '50%':       { opacity: '0.7', boxShadow: '0 0 40px rgba(0,245,255,0.8)' },
        },
        scanBeam: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        ticker: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glowRotate: {
          '0%':   { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
