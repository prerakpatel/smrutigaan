import { useMemo, useState } from 'react'
import { buildHaystack, matchesQuery, findLineMatches } from '../lib/text'
import { Heart, Music, SearchIcon, X, ChevronRight } from './icons'

export default function Library({ state, actions, script, onOpen }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(null)
  const [favoritesOnly, setFavoritesOnly] = useState(false)

  const haystacks = useMemo(
    () => new Map(state.kirtans.map((k) => [k.id, buildHaystack(k)])),
    [state.kirtans]
  )

  const categories = useMemo(() => {
    const set = new Set()
    state.kirtans.forEach((k) => (k.categories || []).forEach((c) => set.add(c)))
    return [...set].sort()
  }, [state.kirtans])

  const results = state.kirtans.filter((k) => {
    if (favoritesOnly && !state.favorites.includes(k.id)) return false
    if (category && !(k.categories || []).includes(category)) return false
    return matchesQuery(haystacks.get(k.id), query)
  })

  return (
    <div>
      {/* Large title row — scrolls away like a native large-title header */}
      <div className="pt-safe px-4">
        <div className="pt-4">
          <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight">
            Smruti <span className="text-grad">Gaan</span>
          </h1>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            Hariprabodham
          </p>
        </div>
      </div>

      {/* Search + filters stay pinned while the list scrolls */}
      <div className="sticky top-0 z-10 bg-night/90 px-4 pb-2 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Gujarati or English…"
              className="w-full rounded-full bg-surface py-3 pl-10 pr-10 font-lyrics text-base outline-none transition-shadow placeholder:font-ui placeholder:text-muted focus:ring-2 focus:ring-accent/70"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted active:text-snow"
              >
                <X size={16} sw={2} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFavoritesOnly((f) => !f)}
            aria-label="Show favorites only"
            aria-pressed={favoritesOnly}
            className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-colors ${
              favoritesOnly ? 'bg-punch/15 text-punch' : 'bg-surface text-muted active:text-snow'
            }`}
          >
            <Heart size={20} filled={favoritesOnly} />
          </button>
        </div>

        {categories.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 text-[13px]">
            {categories.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => setCategory(category === c ? null : c)}
              >
                {c}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="px-4">
        <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-muted">
          {results.length} of {state.kirtans.length} kirtans
        </p>

        <ul className="mt-1 divide-y divide-line">
          {results.map((k) => {
            const fav = state.favorites.includes(k.id)
            // flag actual notes only — highlights alone don't earn a badge
            const ann = state.annotations[k.id]
            const hasNote =
              !!ann?.note || Object.values(ann?.lines || {}).some((v) => v.note)
            // With an active search, surface the lyric lines that actually
            // matched (title/category-only hits produce none).
            const snips =
              query.trim().length >= 2 ? findLineMatches(k, query, script) : null
            return (
              <li key={k.id} className="flex items-center">
                <button
                  onClick={() => onOpen(k.id, snips?.lines[0]?.index)}
                  className="-ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-xl py-3.5 pl-2 pr-1 text-left transition-colors active:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-lyrics text-[17px] font-medium leading-snug">
                      {script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {k.audio && (
                        <Music size={11} className="mr-1.5 inline align-[-1px] text-accent-bright" />
                      )}
                      {script === 'gu' ? k.title.en : k.title.gu}
                      {hasNote && <span className="ml-2 text-accent-bright">· note</span>}
                    </span>
                    {snips && snips.lines.length > 0 && (
                      <span className="mt-1.5 block space-y-1 border-l-2 border-accent/40 pl-2.5">
                        {snips.lines.map((m) => (
                          <span
                            key={m.index}
                            className="block truncate font-lyrics text-[13px] leading-snug text-snow/75"
                          >
                            <HighlightedLine text={m.text} ranges={m.ranges} />
                          </span>
                        ))}
                        {snips.more > 0 && (
                          <span className="block text-[11px] text-muted">
                            +{snips.more} more matching {snips.more === 1 ? 'line' : 'lines'}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-line" />
                </button>
                <button
                  onClick={() => actions.toggleFavorite(k.id)}
                  aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center transition-colors ${
                    fav ? 'text-punch' : 'text-line active:text-muted'
                  }`}
                >
                  <Heart size={20} filled={fav} />
                </button>
              </li>
            )
          })}
        </ul>

        {results.length === 0 && (
          <div className="mt-14 text-center text-sm text-muted">
            <p>No kirtans match this search.</p>
            <p className="mt-1">Try fewer words, or search in the other script.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Renders a snippet with the matched character ranges lit up.
function HighlightedLine({ text, ranges }) {
  const chars = [...text.normalize('NFC')]
  const parts = []
  let last = 0
  ranges.forEach(([s, e], i) => {
    if (s > last) parts.push(<span key={`t${i}`}>{chars.slice(last, s).join('')}</span>)
    parts.push(
      <span key={`m${i}`} className="rounded-[3px] bg-accent/25 px-0.5 font-semibold text-accent-bright">
        {chars.slice(s, e).join('')}
      </span>
    )
    last = e
  })
  if (last < chars.length) parts.push(<span key="tail">{chars.slice(last).join('')}</span>)
  return <>{parts}</>
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 select-none whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors ${
        active
          ? 'bg-snow font-semibold text-night'
          : 'bg-surface text-muted active:bg-card active:text-snow'
      }`}
    >
      {children}
    </button>
  )
}
