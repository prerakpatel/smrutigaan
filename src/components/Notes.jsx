import { Bookmark, ChevronRight, Highlighter, Pencil } from './icons'

// The annotation index: which kirtans carry highlights or notes, most recently
// annotated first. Deliberately just a list — the notes themselves live inside
// the kirtan, a tap away.
export default function Notes({ state, script, onOpen }) {
  const items = Object.entries(state.annotations)
    .map(([id, a]) => {
      const k = state.kirtans.find((k) => k.id === id)
      if (!k) return null // annotation left over from a deleted kirtan
      const lineEntries = Object.values(a.lines || {})
      const highlights = lineEntries.filter((e) => e.highlight).length
      const notes = lineEntries.filter((e) => e.note).length + (a.note ? 1 : 0)
      if (highlights === 0 && notes === 0) return null
      return { k, a, highlights, notes }
    })
    .filter(Boolean)
    .sort((x, y) => {
      const t = (y.a.updatedAt || '').localeCompare(x.a.updatedAt || '')
      return t !== 0 ? t : titleOf(x.k, script).localeCompare(titleOf(y.k, script))
    })

  return (
    <div>
      <div className="pt-safe px-4">
        <h1 className="pt-4 font-display text-[32px] font-extrabold leading-none tracking-tight">
          Notes
        </h1>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Highlights &amp; annotations
        </p>
      </div>

      <div className="mt-2 px-4">
        {items.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted">
            <Bookmark size={36} className="mx-auto text-line" />
            <p className="mt-3">Nothing highlighted yet.</p>
            <p className="mx-auto mt-1 max-w-64">
              Open any kirtan and tap a line to highlight it or add a note — everything you mark
              collects here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map(({ k, highlights, notes }) => (
              <li key={k.id}>
                <button
                  onClick={() => onOpen(k.id)}
                  className="-mx-2 flex w-full items-center gap-2 rounded-xl px-2 py-3.5 text-left transition-colors active:bg-surface"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-lyrics text-[17px] font-medium leading-snug">
                      {titleOf(k, script)}
                    </span>
                    <span className="mt-1 flex items-center gap-3 text-xs text-muted">
                      {highlights > 0 && (
                        <span className="flex items-center gap-1 text-accent-bright">
                          <Highlighter size={12} />
                          {highlights} highlighted
                        </span>
                      )}
                      {notes > 0 && (
                        <span className="flex items-center gap-1">
                          <Pencil size={12} />
                          {notes} {notes === 1 ? 'note' : 'notes'}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-line" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function titleOf(k, script) {
  return script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu
}
