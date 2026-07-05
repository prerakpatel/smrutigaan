import { useMemo, useState } from 'react'
import { buildHaystack, matchesQuery } from '../lib/text'

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
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Gujarati or transliteration…"
        className="w-full rounded-xl border border-hairline bg-white px-4 py-3 font-gujarati text-base outline-none transition-shadow placeholder:font-ui placeholder:text-stone focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <Chip active={favoritesOnly} onClick={() => setFavoritesOnly((f) => !f)}>
          ♥ Favorites
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>

      <p className="mt-4 text-xs uppercase tracking-[0.15em] text-stone">
        {results.length} of {state.kirtans.length} kirtans
      </p>

      <ul className="mt-2 divide-y divide-hairline">
        {results.map((k) => {
          const fav = state.favorites.includes(k.id)
          const hasNotes = !!state.annotations[k.id]?.note ||
            Object.keys(state.annotations[k.id]?.lines || {}).length > 0
          return (
            <li key={k.id} className="flex items-center gap-3 py-3">
              <button onClick={() => onOpen(k.id)} className="min-w-0 flex-1 text-left">
                <p className="truncate font-gujarati text-lg leading-snug">
                  {script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu}
                </p>
                <p className="mt-0.5 truncate text-xs text-stone">
                  {script === 'gu' ? k.title.en : k.title.gu}
                  {hasNotes && <span className="ml-2 text-madder">· annotated</span>}
                </p>
              </button>
              <button
                onClick={() => actions.toggleFavorite(k.id)}
                aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                className={`px-2 text-lg transition-colors ${fav ? 'text-madder' : 'text-hairline hover:text-stone'}`}
              >
                ♥
              </button>
            </li>
          )
        })}
      </ul>

      {results.length === 0 && (
        <div className="mt-10 text-center text-sm text-stone">
          <p>No kirtans match this search.</p>
          <p className="mt-1">Try fewer words, or search in the other script.</p>
        </div>
      )}

      <ImportExport actions={actions} />
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 transition-colors ${
        active
          ? 'border-saffron-deep bg-saffron-soft text-ink'
          : 'border-hairline bg-white text-stone hover:border-stone'
      }`}
    >
      {children}
    </button>
  )
}

function ImportExport({ actions }) {
  const download = () => {
    const blob = new Blob([actions.exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'smruti-gaan-export.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const upload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((t) => {
      try {
        actions.importJSON(t)
      } catch {
        alert('That file is not a valid Smruti Gaan export.')
      }
    })
    e.target.value = ''
  }
  return (
    <div className="mt-12 flex items-center gap-4 border-t border-hairline pt-4 text-xs text-stone">
      <button onClick={download} className="underline underline-offset-2 hover:text-ink">
        Export library
      </button>
      <label className="cursor-pointer underline underline-offset-2 hover:text-ink">
        Import library
        <input type="file" accept="application/json" onChange={upload} className="hidden" />
      </label>
      <button
        onClick={() => {
          if (confirm('Discard local edits and reload the seed data?')) actions.resetToSeed()
        }}
        className="ml-auto underline underline-offset-2 hover:text-madder"
      >
        Reset to seed
      </button>
    </div>
  )
}
