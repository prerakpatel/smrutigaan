import { useMemo, useState } from 'react'
import { buildHaystack, matchesQuery } from '../lib/text'
import { Heart, Music, Plus, SearchIcon, X, ChevronRight } from './icons'

export default function Library({ state, actions, script, onOpen, onAdd }) {
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
        <div className="flex items-end justify-between pt-4">
          <div>
            <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight">
              Smruti <span className="text-grad">Gaan</span>
            </h1>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Hariprabodham
            </p>
          </div>
          <button
            onClick={onAdd}
            aria-label="Add kirtan"
            className="grad-brand flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg shadow-fuchsia-500/25 transition-transform active:scale-95"
          >
            <Plus size={22} sw={2} />
          </button>
        </div>
      </div>

      {/* Search + filters stay pinned while the list scrolls */}
      <div className="sticky top-0 z-10 bg-night/90 px-4 pb-2 pt-3 backdrop-blur-xl">
        <div className="relative">
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

        <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 text-[13px]">
          <Chip active={favoritesOnly} onClick={() => setFavoritesOnly((f) => !f)}>
            <Heart size={13} filled={favoritesOnly} className="mr-1 inline-block align-[-1px]" />
            Favorites
          </Chip>
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
      </div>

      <div className="px-4">
        <p className="mt-2 text-[11px] uppercase tracking-[0.15em] text-muted">
          {results.length} of {state.kirtans.length} kirtans
        </p>

        <ul className="mt-1 divide-y divide-line">
          {results.map((k) => {
            const fav = state.favorites.includes(k.id)
            const hasNotes =
              !!state.annotations[k.id]?.note ||
              Object.keys(state.annotations[k.id]?.lines || {}).length > 0
            return (
              <li key={k.id} className="flex items-center">
                <button
                  onClick={() => onOpen(k.id)}
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
                      {hasNotes && <span className="ml-2 text-punch">· annotated</span>}
                    </span>
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
