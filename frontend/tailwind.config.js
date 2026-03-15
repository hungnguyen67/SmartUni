/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      keyframes: {
        slideRightAndOut: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(100%)' 
          },
          '15%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
          '80%': { 
            opacity: '1', 
            transform: 'translateX(0)' 
          },
          '100%': { 
            opacity: '0', 
            transform: 'translateX(100%)' 
          },
        },
      },
      animation: {
        'notification': 'slideRightAndOut 2s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}