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

export function newId() {
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
