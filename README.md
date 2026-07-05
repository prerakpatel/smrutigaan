# Smruti Gaan · સ્મૃતિ ગાન

A lyrics-first library for Hariprabodham bhajans and kirtans. React + Vite + Tailwind. Spotify-style structure, but the lyric line is the atomic unit: search across both scripts, flip between Gujarati and transliteration, highlight lines, attach marginalia notes to lines, and notes to whole kirtans. Favorites and playlists included.

## Run it

```bash
npm install
npm run dev
```

## Bring in your real lyrics

Your markdown lives in two folders (Gujarati + transliteration), with numeric filenames. The ingest script pairs them by number and extracts each title from the first non-empty line:

```bash
npm run ingest -- --gu ~/path/to/gujarati --en ~/path/to/transliteration
```

This rewrites `src/data/kirtans.json` (a `.backup.json` of the previous seed is kept). The app persists your edits/annotations in localStorage *on top of* the seed, so after re-ingesting, use **Reset to seed** at the bottom of the Library to load the new data. Use **Export library** first if you have annotations you want to keep, then re-apply via **Import library**.

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
src/components/Library.jsx  search, category chips, favorites filter, import/export
src/components/KirtanView.jsx  script flip, line highlights + notes, kirtan note, playlist picker
src/components/Editor.jsx   add/edit both scripts, live title preview, categories, delete
src/components/Playlists.jsx
```

## Roadmap (for Claude Code sessions)

1. **Audio tracks** — add `track: { url, duration }` to the kirtan model; a persistent bottom player bar fits the current layout (`max-w-2xl` shell with `pb-24` already reserves space).
2. **Backend** — replace `store.js` internals with API calls; keep the `actions` interface identical.
3. **Line-sync verification** — a lint step in `ingest.mjs` warning when gu/en line counts differ.
4. **Deep links / routing** — swap the `view` state in `App.jsx` for react-router when URLs matter.
5. **Bundle size** — kirtans.json is ~1.9 MB bundled; lazy-load it (dynamic import) or move to a backend when adding tracks.
6. **Raag / taal metadata**, tags beyond categories, note search.
