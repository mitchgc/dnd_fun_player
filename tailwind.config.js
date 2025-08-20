/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        dnd: {
          red: '#dc2626',
          blue: '#2563eb',
          purple: '#7c3aed',
          green: '#16a34a',
          yellow: '#ca8a04',
          pink: '#db2777',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'bounce-gentle': 'bounceGentle 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'glow': 'glow 1s ease-in-out infinite alternate',
        'stealth-shine': 'stealthShine 3s infinite',
        'damage-pop': 'damagePopUp 1s ease-out',
        'emoji-pop': 'emojiPop 0.6s ease-out',
        'sparkle': 'sparkle 2s infinite',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          from: {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateX(-10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        wiggle: {
          '0%, 7%, 14%, 21%, 28%, 35%, 42%, 49%, 56%, 63%, 70%': {
            transform: 'rotate(0deg)',
          },
          '3.5%, 10.5%, 17.5%, 24.5%, 31.5%, 38.5%, 45.5%, 52.5%, 59.5%, 66.5%': {
            transform: 'rotate(-1deg)',
          },
          '7%, 14%, 21%, 28%, 35%, 42%, 49%, 56%, 63%, 70%, 77%': {
            transform: 'rotate(1deg)',
          },
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)' },
          to: { boxShadow: '0 0 30px rgba(251, 191, 36, 0.8)' },
        },
        stealthShine: {
          '0%': { transform: 'rotate(0deg) translateX(-100%)' },
          '100%': { transform: 'rotate(0deg) translateX(100%)' },
        },
        damagePopUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px) scale(0.8)',
          },
          '50%': {
            opacity: '1',
            transform: 'translateY(-10px) scale(1.2)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-30px) scale(1)',
          },
        },
        emojiPop: {
          '0%': {
            transform: 'scale(0.3) rotate(-10deg)',
            opacity: '0',
          },
          '50%': {
            transform: 'scale(1.3) rotate(5deg)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(1) rotate(0deg)',
            opacity: '1',
          },
        },
        sparkle: {
          '0%, 100%': {
            opacity: '0',
            transform: 'scale(0.5) rotate(0deg)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1) rotate(180deg)',
          },
        },
      },
      screens: {
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    // Custom plugin for iPad optimizations
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-friendly': {
          minHeight: '44px',
          minWidth: '44px',
        },
        '.no-select': {
          '-webkit-touch-callout': 'none',
          '-webkit-user-select': 'none',
          '-khtml-user-select': 'none',
          '-moz-user-select': 'none',
          '-ms-user-select': 'none',
          'user-select': 'none',
        },
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}