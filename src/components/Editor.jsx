import { useState } from 'react'
import { extractTitle, newId } from '../lib/text'

export default function Editor({ state, actions, id, onDone }) {
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
    onDone(kid)
  }

  const remove = () => {
    if (existing && confirm('Delete this kirtan, its notes, and highlights? This cannot be undone.')) {
      actions.deleteKirtan(existing.id)
      onDone(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <button onClick={() => onDone(existing?.id || null)} className="text-stone hover:text-ink">
          ← Cancel
        </button>
        <div className="flex items-center gap-3">
          {existing && (
            <button onClick={remove} className="text-xs text-madder underline underline-offset-2">
              Delete kirtan
            </button>
          )}
          <button onClick={save} className="rounded-full bg-ink px-4 py-1.5 text-marble hover:bg-madder">
            Save
          </button>
        </div>
      </div>

      <h2 className="mt-6 font-display text-xl font-semibold">
        {existing ? 'Edit kirtan' : 'New kirtan'}
      </h2>
      <p className="mt-1 text-sm text-stone">
        The title is taken from the first line automatically.
      </p>

      {/* Live extracted titles */}
      <div className="mt-4 rounded-xl border border-hairline bg-parchment/60 p-3 text-sm">
        <p className="font-gujarati text-base">{titleGu || <span className="text-stone">Gujarati title will appear here</span>}</p>
        <p className="mt-0.5 text-stone">{titleEn || 'Transliterated title will appear here'}</p>
      </div>

      <div className="mt-5 inline-flex rounded-full border border-hairline bg-white p-0.5 text-sm">
        <TabButton active={tab === 'gu'} onClick={() => setTab('gu')}>ગુજરાતી</TabButton>
        <TabButton active={tab === 'en'} onClick={() => setTab('en')}>English</TabButton>
      </div>

      {tab === 'gu' ? (
        <textarea
          value={gu}
          onChange={(e) => setGu(e.target.value)}
          rows={16}
          placeholder={'પહેલી પંક્તિ = શીર્ષક\n\nપછી અંતરા, ખાલી લીટીથી અલગ…'}
          className="mt-3 w-full rounded-xl border border-hairline bg-white p-4 font-gujarati text-lg leading-loose outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
        />
      ) : (
        <textarea
          value={en}
          onChange={(e) => setEn(e.target.value)}
          rows={16}
          placeholder={'First line = title\n\nThen verses, separated by blank lines…'}
          className="mt-3 w-full rounded-xl border border-hairline bg-white p-4 font-gujarati text-lg leading-loose outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
        />
      )}

      <label className="mt-4 block text-sm">
        <span className="text-xs uppercase tracking-[0.15em] text-stone">Categories</span>
        <input
          value={categories}
          onChange={(e) => setCategories(e.target.value)}
          placeholder="Prarthana, Aarti, Thal — comma separated"
          className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-2 outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
        />
      </label>

      <p className="mt-4 text-xs leading-relaxed text-stone">
        Tip: keep the Gujarati and transliteration line-for-line parallel (same number of
        lines and stanza breaks). Highlights and notes are attached to line numbers, so
        parallel structure keeps them aligned when you flip scripts.
      </p>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 transition-colors ${
        active ? 'bg-ink text-marble' : 'text-stone hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
