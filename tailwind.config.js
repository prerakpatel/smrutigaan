/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        marble: '#F8F5EE',
        parchment: '#F1ECE0',
        ink: '#2A2419',
        stone: '#8E8574',
        hairline: '#E7E0D2',
        saffron: {
          DEFAULT: '#DE8A1F',
          soft: '#F6E3C3',
          deep: '#B96F12',
        },
        madder: '#8A3B22',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        gujarati: ['"Noto Serif Gujarati"', 'serif'],
      },
    },
  },
  plugins: [],
}
