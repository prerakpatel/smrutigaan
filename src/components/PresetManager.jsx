import { useMemo, useRef, useState } from 'react'
import { PRESETS } from '../lib/presets'
import { buildHaystack, matchesQuery } from '../lib/text'
import { Check, ChevronLeft, SearchIcon, X } from './icons'

// Editor-only bulk curation of the preset lists. Pick a preset, search, and
// tap kirtans to toggle membership. Each toggle rewrites that kirtan's
// categories through the (cloud-syncing) editor actions, so lists update for
// everyone. Members float to the top so you can review a list at a glance.
export default function PresetManager({ state, actions, script, onBack }) {
  const [preset, setPreset] = useState(PRESETS[0])
  const [query, setQuery] = useState('')

  const haystacks = useMemo(
    () => new Map(state.kirtans.map((k) => [k.id, buildHaystack(k)])),
    [state.kirtans]
  )

  const inPreset = (k) => (k.categories || []).includes(preset)
  const count = state.kirtans.filter(inPreset).length

  // Latest data, read without re-triggering the frozen order below.
  const dataRef = useRef()
  dataRef.current = { kirtans: state.kirtans, haystacks }

  // Row order is a SNAPSHOT taken only when the preset or search changes —
  // never on a toggle. So tagging a kirtan flips its checkbox in place and
  // your scroll position holds; members are floated to the top only on that
  // initial snapshot for at-a-glance review.
  const orderedIds = useMemo(() => {
    const { kirtans, haystacks } = dataRef.current
    const has = (k) => (k.categories || []).includes(preset)
    return kirtans
      .filter((k) => matchesQuery(haystacks.get(k.id), query))
      .sort((a, b) => (has(b) ? 1 : 0) - (has(a) ? 1 : 0))
      .map((k) => k.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, query])

  const byId = new Map(state.kirtans.map((k) => [k.id, k]))
  const results = orderedIds.map((id) => byId.get(id)).filter(Boolean)

  const toggle = (k) => {
    const cats = new Set(k.categories || [])
    cats.has(preset) ? cats.delete(preset) : cats.add(preset)
    actions.saveKirtan({ ...k, categories: [...cats] })
  }

  const title = (k) =>
    script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu
  const sub = (k) => (script === 'gu' ? k.title.en : k.title.gu)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="pt-safe sticky top-0 z-20 bg-night/95 backdrop-blur-xl">
        <div className="flex h-12 items-center px-1">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-snow active:bg-surface"
          >
            <ChevronLeft size={26} sw={2} />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-[15px] font-semibold">
            Manage preset lists
          </p>
          <span className="w-11" />
        </div>

        {/* preset picker */}
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2.5 text-[13px]">
          {PRESETS.map((p) => {
            const n = state.kirtans.filter((k) => (k.categories || []).includes(p)).length
            return (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`shrink-0 select-none whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors ${
                  preset === p
                    ? 'bg-snow font-semibold text-night'
                    : 'bg-surface text-muted active:text-snow'
                }`}
              >
                {p}
                {n > 0 && <span className="ml-1.5 opacity-70">{n}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="relative">
          <SearchIcon
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search kirtans to add…"
            className="w-full rounded-full bg-surface py-3 pl-10 pr-10 font-lyrics text-base outline-none placeholder:font-ui placeholder:text-muted focus:ring-2 focus:ring-accent/70"
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

        <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">
          {count} in “{preset}” · tap to add or remove
        </p>

        <ul className="mt-1 divide-y divide-line pb-4">
          {results.map((k) => {
            const on = inPreset(k)
            return (
              <li key={k.id}>
                <button
                  onClick={() => toggle(k)}
                  className="-mx-2 flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors active:bg-surface"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      on ? 'border-accent bg-accent text-white' : 'border-line'
                    }`}
                  >
                    {on && <Check size={14} sw={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-lyrics text-[16px] font-medium leading-snug">
                      {title(k)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{sub(k)}</span>
                  </span>
                </button>
              </li>
            )
          })}
          {results.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted">No kirtans match that search.</p>
          )}
        </ul>
      </div>
    </div>
  )
}
