#!/usr/bin/env node
// Ingest markdown lyrics into src/data/kirtans.json.
//
// Single-folder mode (Smruti Gaan convention: "123.md" is Gujarati,
// "E123.md" is its transliteration):
//   npm run ingest -- --dir ./lyrics
//
// Two-folder mode (separate Gujarati and transliteration folders,
// paired by the number in the filename):
//   npm run ingest -- --gu ./gujarati --en ./transliteration
//
// The title is extracted from the first non-empty line of each file.
// Output replaces src/data/kirtans.json (previous file is backed up).

import fs from 'node:fs'
import path from 'node:path'

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : null
}

const dir = arg('--dir')
const guDir = arg('--gu')
const enDir = arg('--en')

if (!dir && !(guDir && enDir)) {
  console.log('Usage:')
  console.log('  npm run ingest -- --dir <folder>                  (### / E### convention)')
  console.log('  npm run ingest -- --gu <folder> --en <folder>     (separate folders)')
  process.exit(1)
}

const clean = (s) => s.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim()

function extractTitle(markdown) {
  const first = markdown.split('\n').map((l) => l.trim()).find((l) => l.length > 0)
  return first ? clean(first) : ''
}

// Count lyric lines the same way the app does (src/lib/text.js → toLines),
// so we can warn when gu/en annotations would drift out of alignment.
function countLines(markdown) {
  return markdown
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(clean)
    .filter((l) => l.length > 0).length
}

function read(file) {
  return fs
    .readFileSync(file, 'utf8')
    .normalize('NFC')
    // strip trailing ***** separator rows (with or without markdown escapes)
    .split('\n')
    .filter((l) => !/^\s*\*{2,}\s*$/.test(l.replace(/\\/g, '')))
    .join('\n')
    .trimEnd()
}

const gu = new Map() // number -> markdown
const en = new Map()

function collect(folder, mode) {
  for (const f of fs.readdirSync(folder).sort()) {
    if (!/\.(md|markdown|txt)$/i.test(f)) continue
    const isE = /^E/i.test(f)
    const m = f.match(/\d+/)
    if (!m) {
      console.warn(`  ! Skipping (no number in filename): ${f}`)
      continue
    }
    const key = String(parseInt(m[0], 10))
    const content = read(path.join(folder, f))
    if (mode === 'single') (isE ? en : gu).set(key, content)
    else if (mode === 'gu') gu.set(key, content)
    else en.set(key, content)
  }
}

if (dir) collect(dir, 'single')
else {
  collect(guDir, 'gu')
  collect(enDir, 'en')
}

const keys = [...new Set([...gu.keys(), ...en.keys()])].sort((a, b) => Number(a) - Number(b))
const kirtans = []
let missingEn = 0
let mismatched = 0

for (const key of keys) {
  const g = gu.get(key) || ''
  const e = en.get(key) || ''
  if (!g) console.warn(`  ! #${key}: no Gujarati file`)
  if (!e) missingEn++
  if (g && e) {
    const cg = countLines(g)
    const ce = countLines(e)
    if (cg !== ce) {
      mismatched++
      console.warn(`  ~ #${key}: line counts differ (gu ${cg} / en ${ce}) — highlights may misalign between scripts`)
    }
  }
  kirtans.push({
    id: `k_${key.padStart(3, '0')}`,
    number: Number(key),
    title: { gu: g ? extractTitle(g) : '', en: e ? extractTitle(e) : '' },
    lyrics: { gu: g, en: e },
    categories: [],
    updatedAt: new Date().toISOString(),
  })
}

const outPath = path.join(process.cwd(), 'src/data/kirtans.json')
if (fs.existsSync(outPath)) {
  fs.copyFileSync(outPath, outPath.replace(/\.json$/, `.backup.json`))
}
fs.writeFileSync(outPath, JSON.stringify(kirtans, null, 2) + '\n', 'utf8')

console.log(`\n✓ Wrote ${kirtans.length} kirtans to src/data/kirtans.json`)
if (missingEn) console.log(`  ${missingEn} have no transliteration yet (Gujarati only).`)
if (mismatched) console.log(`  ${mismatched} pairs have differing line counts (see ~ warnings above).`)
console.log('  The app persists edits in localStorage on top of this seed —')
console.log('  after re-ingesting, use "Reset to seed" in the Library to load new data.')
