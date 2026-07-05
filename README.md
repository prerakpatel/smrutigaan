# Smruti Gaan · સ્મૃતિ ગાન

A lyrics-first library for Hariprabodham bhajans and kirtans. React + Vite + Tailwind. Spotify-style structure, but the lyric line is the atomic unit: search across both scripts, flip between Gujarati and transliteration, highlight lines, attach marginalia notes to lines, and notes to whole kirtans. Favorites and playlists included.

Mobile-first, native-app-like UI: bottom tab bar (Library / Playlists / Settings), full-screen pages that slide in with working Android-back/iOS-swipe-back navigation, bottom sheets for notes and actions, 44px touch targets, safe-area (notch) support, and an installable PWA with offline support.

## Run it

```bash
npm install
npm run dev
```

## View it on your phone

**Same Wi-Fi (quickest during development):**

```bash
npm run dev -- --host
```

Vite prints a `Network:` URL (e.g. `http://192.168.1.23:5173`) — open that in your phone's browser. Hot reload works, so you can edit on the laptop and watch the phone update.

**Install it like a native app (best experience):** deploy the production build to any free static host (Vercel, Netlify, Cloudflare Pages — `npm run build`, publish the `dist/` folder), open the URL on your phone, then:

- **iPhone (Safari):** Share → **Add to Home Screen**
- **Android (Chrome):** menu ⋮ → **Add to Home screen** / **Install app**

It launches full-screen from its own icon with no browser chrome, and — thanks to the service worker — keeps working with no connection. Notes, favorites and playlists are stored on the device.

## Bring in your real lyrics

Your markdown lives in two folders (Gujarati + transliteration), with numeric filenames. The ingest script pairs them by number and extracts each title from the first non-empty line:

```bash
npm run ingest -- --gu ~/path/to/gujarati --en ~/path/to/transliteration
```

This rewrites `src/data/kirtans.json` (a `.backup.json` of the previous seed is kept). The app persists your edits/annotations in localStorage *on top of* the seed, so after re-ingesting, use **Settings → Reset to seed data** to load the new data. Use **Settings → Export library** first if you have annotations you want to keep, then re-apply via **Import library**.

## Data model

```js
kirtans:     [{ id, title:{gu,en}, lyrics:{gu,en}, categories:[], updatedAt }]
favorites:   [kirtanId]
playlists:   [{ id, name, kirtanIds:[] }]
annotations: { [kirtanId]: { note, lines: { [lineIndex]: { highlight, note } } } }
```

- **Titles** are derived from the first non-empty line (`extractTitle` in `src/lib/text.js`) — your files being named by number is fine.
- **Search** normalizes to NFC and strips Latin diacritics, so typing `pankti` matches `paṅkti`, and Gujarati input matches natively (`src/lib/text.js → normalizeForSearch`).
- **Annotations are keyed by line index**, shared across scripts. Keep the two scripts line-for-line parallel (same lines, same stanza breaks) so a highlight on line 4 in Gujarati is the same line 4 in transliteration.
- **Storage** is a single swappable module (`src/lib/store.js`). Every mutation goes through `actions`, so migrating to SQLite / Supabase / a Node API later means rewriting one file, not the components.

## Files

```
scripts/ingest.mjs          markdown → kirtans.json (pairs by filename number)
src/lib/text.js             normalization, title extraction, line splitting, search
src/lib/store.js            state + persistence + all actions (the swap point)
src/App.jsx                 app shell: tab panels + page stack synced to browser history
src/components/Library.jsx  search, category chips, favorites filter
src/components/KirtanView.jsx  script flip, line highlights + notes, kirtan note, share, text size
src/components/Editor.jsx   full-screen modal: add/edit both scripts, live title preview, delete
src/components/Playlists.jsx  playlist list + full-screen playlist detail page
src/components/Settings.jsx   script/text-size prefs, library stats, import/export/reset
src/components/Sheet.jsx    bottom sheet primitive (all modals/pickers)
src/components/icons.jsx    inline SVG icon set (no dependency)
public/manifest.webmanifest + sw.js + icons   PWA install + offline
```

## Navigation model

`App.jsx` keeps three always-mounted tab panels (so scroll position and search state survive tab switches) plus a page **stack** — kirtan, playlist detail, editor — rendered as full-screen layers that slide in. Every push is mirrored into `history.pushState`, so the Android back button, the iOS edge swipe, and the in-app back chevron all pop the same stack.

## Roadmap (for Claude Code sessions)

1. **Audio tracks** — add `track: { url, duration }` to the kirtan model; a persistent mini-player bar sits naturally just above the tab bar.
2. **Backend** — replace `store.js` internals with API calls; keep the `actions` interface identical.
3. **Line-sync verification** — a lint step in `ingest.mjs` warning when gu/en line counts differ.
4. **Deep links / routing** — the history-backed stack in `App.jsx` can graduate to real URLs (react-router) when sharing links matters.
5. **Bundle size** — kirtans.json is ~1.9 MB bundled; lazy-load it (dynamic import) or move to a backend when adding tracks.
6. **Raag / taal metadata**, tags beyond categories, note search.
