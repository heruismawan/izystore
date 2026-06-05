/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Redefined for Claymorphism / Pop 3D pastel palette
        neoYellow: '#FED7AA',  // Soft pastel orange (orange-200)
        neoGreen: '#A7F3D0',   // Soft pastel green (emerald-200)
        neoBlue: '#DBEAFE',    // Soft pastel blue (blue-100)
        neoRed: '#FEE2E2',     // Soft pastel red (red-100)
        neoPurple: '#F3E8FF',  // Soft pastel purple (purple-100)
        neoBg: '#F8FAFC',      // Soft background gray/white (slate-50)
        neoDark: '#334155',    // Soft slate-700
      },
      boxShadow: {
        // Redefined shadow tokens for Claymorphic 3D inflated look
        'neo': 'inset 0 3px 5px rgba(255,255,255,0.8), 0 8px 16px -4px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.03)',
        'neo-lg': 'inset 0 4px 6px rgba(255,255,255,0.85), 0 12px 24px -6px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.03)',
        'neo-xl': 'inset 0 6px 10px rgba(255,255,255,0.9), 0 25px 50px -12px rgba(0,0,0,0.1)',
        'neo-active': 'inset 0 2px 4px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.02)',
        // Dark mode claymorphism tokens
        'neo-dark': 'inset 0 2px 4px rgba(255,255,255,0.07), 0 12px 20px -5px rgba(0,0,0,0.5)',
        'neo-dark-lg': 'inset 0 2px 5px rgba(255,255,255,0.06), 0 20px 30px -8px rgba(0,0,0,0.6)',
        'neo-dark-active': 'inset 0 0 20px rgba(251,146,60,0.25), 0 8px 16px -4px rgba(0,0,0,0.4)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
