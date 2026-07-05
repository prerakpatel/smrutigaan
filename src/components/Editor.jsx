import { useState } from 'react'
import { extractTitle, newId } from '../lib/text'
import { Trash } from './icons'

// Full-screen modal editor (covers the tab bar), native "Cancel / Save" style.
export default function Editor({ state, actions, id, onCancel, onSaved, onDeleted }) {
  const existing = id ? state.kirtans.find((k) => k.id === id) : null
  const [gu, setGu] = useState(existing?.lyrics.gu || '')
  const [en, setEn] = useState(existing?.lyrics.en || '')
  const [categories, setCategories] = useState((existing?.categories || []).join(', '))
  const [tab, setTab] = useState('gu')

  const titleGu = extractTitle(gu)
  const titleEn = extractTitle(en)

  const save = () => {
    if (!gu.trim() && !en.trim()) {
      alert('Add lyrics in at least one script before saving.')
      return
    }
    const kid = existing?.id || newId()
    actions.saveKirtan({
      ...(existing || {}),
      id: kid,
      title: { gu: titleGu, en: titleEn },
      lyrics: { gu, en },
      categories: categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    })
    onSaved(kid)
  }

  const remove = () => {
    if (existing && confirm('Delete this kirtan, its notes, and highlights? This cannot be undone.')) {
      actions.deleteKirtan(existing.id)
      onDeleted()
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      {/* Modal top bar */}
      <div className="pt-safe sticky top-0 z-20 bg-marble/95 backdrop-blur">
        <div className="flex h-12 items-center justify-between px-2">
          <button
            onClick={onCancel}
            className="flex min-h-[44px] items-center px-2 text-base text-stone active:text-ink"
          >
            Cancel
          </button>
          <p className="text-[15px] font-semibold">{existing ? 'Edit kirtan' : 'New kirtan'}</p>
          <button
            onClick={save}
            className="my-1.5 flex min-h-[36px] items-center rounded-full bg-ink px-4 text-base font-medium text-marble active:bg-madder"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <p className="mt-2 text-sm text-stone">
          The title is taken from the first line automatically.
        </p>

        {/* Live extracted titles */}
        <div className="mt-3 rounded-xl border border-hairline bg-parchment/60 p-3 text-sm">
          <p className="font-gujarati text-base">
            {titleGu || <span className="text-stone">Gujarati title will appear here</span>}
          </p>
          <p className="mt-0.5 text-stone">{titleEn || 'Transliterated title will appear here'}</p>
        </div>

        <div className="mt-4 flex rounded-xl bg-parchment p-1 text-[15px]">
          <TabButton active={tab === 'gu'} onClick={() => setTab('gu')}>
            ગુજરાતી
          </TabButton>
          <TabButton active={tab === 'en'} onClick={() => setTab('en')}>
            English
          </TabButton>
        </div>

        {tab === 'gu' ? (
          <textarea
            value={gu}
            onChange={(e) => setGu(e.target.value)}
            rows={14}
            placeholder={'પહેલી પંક્તિ = શીર્ષક\n\nપછી અંતરા, ખાલી લીટીથી અલગ…'}
            className="mt-3 w-full rounded-xl border border-hairline bg-white p-4 font-gujarati text-lg leading-loose outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
          />
        ) : (
          <textarea
            value={en}
            onChange={(e) => setEn(e.target.value)}
            rows={14}
            placeholder={'First line = title\n\nThen verses, separated by blank lines…'}
            className="mt-3 w-full rounded-xl border border-hairline bg-white p-4 font-gujarati text-lg leading-loose outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
          />
        )}

        <label className="mt-4 block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-stone">Categories</span>
          <input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Prarthana, Aarti, Thal — comma separated"
            className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-3 text-base outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
          />
        </label>

        <p className="mt-4 text-xs leading-relaxed text-stone">
          Tip: keep the Gujarati and transliteration line-for-line parallel (same number of lines
          and stanza breaks). Highlights and notes are attached to line numbers, so parallel
          structure keeps them aligned when you flip scripts.
        </p>

        {existing && (
          <button
            onClick={remove}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-white text-base text-madder active:bg-parchment"
          >
            <Trash size={18} />
            Delete kirtan
          </button>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[40px] flex-1 select-none rounded-lg font-gujarati transition-all ${
        active ? 'bg-white font-medium text-ink shadow-sm' : 'text-stone'
      }`}
    >
      {children}
    </button>
  )
}
