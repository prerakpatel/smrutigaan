// Text utilities: Unicode normalization, title extraction, search matching.

// Normalize for search: NFC first (canonical Gujarati composition), then
// NFD + strip combining marks so transliteration diacritics (ā ī ṇ ś …)
// match plain ASCII typing. Gujarati letters are unaffected by mark
// stripping since their matras are spacing marks, not combining accents
// in the Mn sense we strip here — but we keep NFC output for them.
export function normalizeForSearch(str) {
  if (!str) return ''
  const nfc = str.normalize('NFC').toLowerCase()
  // Strip Latin combining diacritics only (keeps Gujarati intact).
  const stripped = nfc.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return stripped
}

// A kirtan matches if every whitespace-separated term appears in its
// searchable haystack (title + full lyrics, both scripts).
export function buildHaystack(kirtan) {
  return normalizeForSearch(
    [
      kirtan.title?.gu,
      kirtan.title?.en,
      kirtan.lyrics?.gu,
      kirtan.lyrics?.en,
      (kirtan.categories || []).join(' '),
    ]
      .filter(Boolean)
      .join('\n')
  )
}

export function matchesQuery(haystack, query) {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  return terms.every((t) => haystack.includes(t))
}

// Titles are currently just numbers, so the real title lives on the
// first non-empty line of the lyrics. Strip markdown heading markers,
// emphasis, and trailing punctuation clutter.
export function extractTitle(markdown) {
  if (!markdown) return ''
  const firstLine = markdown
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0)
  if (!firstLine) return ''
  return firstLine
    .replace(/^#+\s*/, '')
    .replace(/[*_`]/g, '')
    .trim()
}

// Split markdown lyrics into renderable lines. Blank lines become
// stanza breaks ({ type: 'break' }); everything else is a lyric line
// with its stable index (used to key highlights and notes).
export function toLines(markdown) {
  if (!markdown) return []
  const raw = markdown.replace(/\r\n/g, '\n').split('\n')
  const lines = []
  let idx = 0
  let lastWasBreak = true
  for (const r of raw) {
    const text = r.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim()
    if (text === '') {
      if (!lastWasBreak) lines.push({ type: 'break', key: `b${idx}` })
      lastWasBreak = true
    } else {
      lines.push({ type: 'line', text, index: idx, key: `l${idx}` })
      idx += 1
      lastWasBreak = false
    }
  }
  return lines
}

// Where inside a kirtan did the query hit? Scans lyric lines in the reader's
// current script first (falling back to the other script), returning the
// matching lines with character ranges for highlighting. Ranges are computed
// through the same normalization as matchesQuery, mapped back to original
// characters, so typing "krupa" highlights "kṛupā".
export function findLineMatches(kirtan, query, preferredScript, max = 2) {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (!terms.length) return null
  const scan = (text) =>
    toLines(text).flatMap((l) => {
      if (l.type !== 'line') return []
      const ranges = findTermRanges(l.text, terms)
      return ranges.length ? [windowMatch(l.text, ranges, l.index)] : []
    })
  const primary = kirtan.lyrics?.[preferredScript]
  const other = preferredScript === 'gu' ? kirtan.lyrics?.en : kirtan.lyrics?.gu
  let lines = primary ? scan(primary) : []
  if (!lines.length && other) lines = scan(other)
  return { lines: lines.slice(0, max), more: Math.max(0, lines.length - max) }
}

// Merged [start, end) ranges (in NFC character indices) where any term
// occurs, via a per-character normalization map so offsets survive
// diacritic stripping.
function findTermRanges(text, terms) {
  const chars = [...text.normalize('NFC')]
  let norm = ''
  const map = [] // normalized index -> original char index
  chars.forEach((ch, i) => {
    const n = ch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    for (let j = 0; j < n.length; j++) map.push(i)
    norm += n
  })
  const hits = []
  for (const t of terms) {
    let from = 0
    let pos
    while ((pos = norm.indexOf(t, from)) !== -1) {
      hits.push([map[pos], map[pos + t.length - 1] + 1])
      from = pos + t.length
    }
  }
  hits.sort((a, b) => a[0] - b[0])
  const merged = []
  for (const [s, e] of hits) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
}

// Snippets render on one truncated row; if the first hit sits deep in a long
// line, slide the window so the highlight is actually visible.
function windowMatch(text, ranges, index, width = 52) {
  const chars = [...text.normalize('NFC')]
  let start = 0
  if (chars.length > width && ranges[0][0] > 20) {
    start = Math.max(0, ranges[0][0] - 12)
  }
  const display = (start > 0 ? '…' : '') + chars.slice(start).join('')
  const shift = start > 0 ? 1 - start : 0
  const shifted = ranges
    .map(([s, e]) => [s + shift, e + shift])
    .filter(([, e]) => e > 0)
    .map(([s, e]) => [Math.max(0, s), e])
  return { index, text: display, ranges: shifted }
}

export function newId() {
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
