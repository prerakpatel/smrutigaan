import { toLines } from '../lib/text'
import { Bookmark, ChevronRight } from './icons'

// The annotation home: every kirtan with highlights or notes, most recently
// annotated first. Each annotated line deep-links into the kirtan at that line.
export default function Notes({ state, script, onOpen }) {
  const items = Object.entries(state.annotations)
    .map(([id, a]) => {
      const k = state.kirtans.find((k) => k.id === id)
      if (!k) return null // annotation left over from a deleted kirtan
      const lineEntries = Object.entries(a.lines || {})
        .map(([i, v]) => ({ index: +i, ...v }))
        .sort((x, y) => x.index - y.index)
      if (!a.note && lineEntries.length === 0) return null
      return { k, a, lineEntries }
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

      <div className="mt-5 px-4">
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
          <div className="space-y-3 pb-2">
            {items.map(({ k, a, lineEntries }) => (
              <KirtanNotes
                key={k.id}
                kirtan={k}
                annotation={a}
                lineEntries={lineEntries}
                script={script}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function titleOf(k, script) {
  return script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu
}

function KirtanNotes({ kirtan, annotation, lineEntries, script, onOpen }) {
  const lineText = new Map(
    toLines(kirtan.lyrics[script] || kirtan.lyrics.gu || kirtan.lyrics.en)
      .filter((l) => l.type === 'line')
      .map((l) => [l.index, l.text])
  )
  const highlights = lineEntries.filter((e) => e.highlight).length
  const notes = lineEntries.filter((e) => e.note).length + (annotation.note ? 1 : 0)

  return (
    <section className="rounded-2xl border border-white/5 bg-surface p-4">
      <button
        onClick={() => onOpen(kirtan.id)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-lyrics text-[17px] font-semibold leading-snug">
            {titleOf(kirtan, script)}
          </span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-muted">
            {highlights > 0 && `${highlights} highlighted`}
            {highlights > 0 && notes > 0 && ' · '}
            {notes > 0 && `${notes} ${notes === 1 ? 'note' : 'notes'}`}
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-line" />
      </button>

      {annotation.note && (
        <p className="mt-2.5 whitespace-pre-wrap text-[13px] italic leading-relaxed text-accent-bright">
          {annotation.note}
        </p>
      )}

      {lineEntries.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {lineEntries.map((e) => (
            <button
              key={e.index}
              onClick={() => onOpen(kirtan.id, e.index)}
              className={`block w-full border-l-2 pl-3 text-left active:opacity-70 ${
                e.highlight ? 'border-accent' : 'border-line'
              }`}
            >
              <span
                className={`block font-lyrics text-[15px] leading-snug ${
                  e.highlight ? 'text-snow' : 'text-snow/75'
                }`}
              >
                {lineText.get(e.index) || `Line ${e.index + 1}`}
              </span>
              {e.note && (
                <span className="mt-0.5 block text-[13px] italic leading-snug text-accent-bright">
                  {e.note}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
