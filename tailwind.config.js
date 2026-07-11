/** @type {import('tailwindcss').Config} */

// Colors resolve through CSS variables (RGB triplets defined in index.css)
// so the dark and light themes swap by flipping data-theme on <html> —
// every token keeps Tailwind alpha support via <alpha-value>.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: v('night'), // app background
        surface: v('surface'), // raised: search fields, segmented controls, chips
        card: v('card'), // raised further: cards, inputs, sheets
        snow: v('snow'), // primary text; also filled "pill" buttons
        muted: v('muted'), // secondary text
        line: v('line'), // hairline borders / dividers
        // "white" overlays in dark mode, "ink" overlays in light mode —
        // use veil/N instead of white/N so washes work on both themes.
        veil: v('veil'),
        accent: {
          DEFAULT: v('accent'), // electric violet
          bright: v('accent-bright'), // readable accent text
          soft: v('accent-soft'), // translucent-looking violet wash
        },
        punch: v('punch'), // favorites, notes, destructive
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        // Lyrics stack, resolved per glyph: Latin from Inter (static faces,
        // exercised by all UI text), Gujarati from the single preloaded
        // variable face of Noto Sans Gujarati (declared font-weight 100 900,
        // so every weight maps to that one face — per-weight face lazy
        // loading is what produced "NO GLYPH" boxes on iOS). Keep lyric
        // text at weight ≤700, the Gujarati font's real ceiling.
        lyrics: ['Inter', '"Noto Sans Gujarati"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
