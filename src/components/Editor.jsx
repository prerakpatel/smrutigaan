import { useState } from 'react'
import { extractTitle, newId } from '../lib/text'
import { saveAudio, deleteAudio } from '../lib/audioStore'
import { Music, Trash } from './icons'

// Full-screen modal editor (covers the tab bar), native "Cancel / Save" style.
export default function Editor({ state, actions, id, onCancel, onSaved, onDeleted }) {
  const existing = id ? state.kirtans.find((k) => k.id === id) : null
  const [gu, setGu] = useState(existing?.lyrics.gu || '')
  const [en, setEn] = useState(existing?.lyrics.en || '')
  const [categories, setCategories] = useState((existing?.categories || []).join(', '))
  const [audio, setAudio] = useState(existing?.audio || null)
  const [audioUrl, setAudioUrl] = useState('')
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
      audio: audio || (audioUrl.trim() ? { url: audioUrl.trim() } : null),
    })
    onSaved(kid)
  }

  const attachFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const blobId = newId()
    try {
      await saveAudio(blobId, f)
    } catch {
      alert('Could not store the audio file on this device.')
      return
    }
    if (audio?.blobId) deleteAudio(audio.blobId).catch(() => {})
    setAudio({ blobId, name: f.name })
  }

  const removeAudio = () => {
    if (audio?.blobId) deleteAudio(audio.blobId).catch(() => {})
    setAudio(null)
    setAudioUrl('')
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
      <div className="pt-safe sticky top-0 z-20 bg-night/85 backdrop-blur-xl">
        <div className="flex h-12 items-center justify-between px-2">
          <button
            onClick={onCancel}
            className="flex min-h-[44px] items-center px-2 text-base text-muted active:text-snow"
          >
            Cancel
          </button>
          <p className="text-[15px] font-semibold">{existing ? 'Edit kirtan' : 'New kirtan'}</p>
          <button
            onClick={save}
            className="grad-brand my-1.5 flex min-h-[36px] items-center rounded-full px-4 text-base font-semibold text-white shadow-md shadow-fuchsia-500/25 active:opacity-85"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <p className="mt-2 text-sm text-muted">
          The title is taken from the first line automatically.
        </p>

        {/* Live extracted titles */}
        <div className="mt-3 rounded-xl border border-veil/5 bg-surface p-3 text-sm">
          <p className="font-lyrics text-base font-medium">
            {titleGu || <span className="text-muted">Gujarati title will appear here</span>}
          </p>
          <p className="mt-0.5 text-muted">{titleEn || 'Transliterated title will appear here'}</p>
        </div>

        <div className="mt-4 flex rounded-full bg-surface p-1 text-[15px]">
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
            className="mt-3 w-full rounded-xl bg-card p-4 font-lyrics text-lg leading-loose outline-none focus:ring-2 focus:ring-accent/70"
          />
        ) : (
          <textarea
            value={en}
            onChange={(e) => setEn(e.target.value)}
            rows={14}
            placeholder={'First line = title\n\nThen verses, separated by blank lines…'}
            className="mt-3 w-full rounded-xl bg-card p-4 font-lyrics text-lg leading-loose outline-none focus:ring-2 focus:ring-accent/70"
          />
        )}

        <label className="mt-4 block">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted">Categories</span>
          <input
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            placeholder="Prarthana, Aarti, Thal — comma separated"
            className="mt-1 w-full rounded-xl bg-card px-3 py-3 text-base outline-none focus:ring-2 focus:ring-accent/70"
          />
        </label>

        <div className="mt-4">
          <span className="text-[11px] uppercase tracking-[0.15em] text-muted">
            Audio (optional)
          </span>
          {audio ? (
            <div className="mt-1 flex items-center gap-3 rounded-xl bg-card px-3 py-3">
              <Music size={18} className="shrink-0 text-accent-bright" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {audio.name || audio.url}
              </span>
              <button onClick={removeAudio} className="shrink-0 text-sm font-medium text-punch">
                Remove
              </button>
            </div>
          ) : (
            <>
              <input
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                inputMode="url"
                placeholder="Paste an audio URL (mp3, m4a…)"
                className="mt-1 w-full rounded-xl bg-card px-3 py-3 text-base outline-none focus:ring-2 focus:ring-accent/70"
              />
              <label className="mt-2 flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-sm text-muted active:bg-surface">
                …or upload an audio file (stays on this device)
                <input type="file" accept="audio/*" onChange={attachFile} className="hidden" />
              </label>
            </>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Tip: keep the Gujarati and transliteration line-for-line parallel (same number of lines
          and stanza breaks). Highlights and notes are attached to line numbers, so parallel
          structure keeps them aligned when you flip scripts.
        </p>

        {existing && (
          <button
            onClick={remove}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-punch/25 bg-punch/10 text-base font-medium text-punch active:bg-punch/20"
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
      className={`min-h-[40px] flex-1 select-none rounded-full font-lyrics transition-all ${
        active ? 'bg-snow font-semibold text-night' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}
