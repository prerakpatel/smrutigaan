/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dark, music-app palette: near-black base, layered surfaces,
        // electric violet accent, hot pink for hearts/highlights.
        night: '#0A0A10', // app background
        surface: '#16161F', // raised: search fields, segmented controls, chips
        card: '#1E1E29', // raised further: cards, inputs, sheets
        snow: '#F6F5FA', // primary text; also filled "white pill" buttons
        muted: '#8E8EA3', // secondary text
        line: '#262633', // hairline borders / dividers
        accent: {
          DEFAULT: '#8B5CF6', // electric violet
          bright: '#A78BFA', // readable accent text on dark
          soft: '#261D3F', // translucent-looking violet wash
        },
        punch: '#FF4D6D', // favorites, notes, destructive
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        // Lyrics stack, resolved per glyph: Latin (transliteration, digits,
        // diacritics like ā/ṇ/ś) renders in Inter, and Gujarati falls through
        // to Noto Sans Gujarati — both sans, matched weight, so the big-bold
        // "lyrics screen" look holds when flipping scripts mid-kirtan.
        lyrics: ['Inter', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
