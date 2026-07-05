import { Minus, Plus } from './icons'

export default function Settings({ state, actions, script, setScript, fontScale, setFontScale }) {
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
        alert('Library imported.')
      } catch {
        alert('That file is not a valid Smruti Gaan export.')
      }
    })
    e.target.value = ''
  }

  const annotated = Object.keys(state.annotations).length

  return (
    <div>
      <div className="pt-safe px-4">
        <h1 className="pt-4 font-display text-[28px] font-semibold leading-none tracking-tight">
          Settings
        </h1>
      </div>

      <div className="mt-5 space-y-5 px-4">
        <Section title="Reading">
          <Row label="Default script">
            <div className="flex rounded-lg bg-parchment p-0.5 text-sm">
              <Seg active={script === 'gu'} onClick={() => setScript('gu')}>
                ગુજરાતી
              </Seg>
              <Seg active={script === 'en'} onClick={() => setScript('en')}>
                English
              </Seg>
            </div>
          </Row>
          <Row label="Lyrics text size">
            <div className="flex items-center gap-1 rounded-full border border-hairline bg-white">
              <button
                onClick={() => setFontScale(Math.max(0.85, +(fontScale - 0.125).toFixed(3)))}
                aria-label="Smaller text"
                className="flex h-10 w-12 items-center justify-center rounded-l-full active:bg-parchment"
              >
                <Minus size={18} />
              </button>
              <span className="w-10 text-center text-sm text-stone">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                onClick={() => setFontScale(Math.min(1.6, +(fontScale + 0.125).toFixed(3)))}
                aria-label="Larger text"
                className="flex h-10 w-12 items-center justify-center rounded-r-full active:bg-parchment"
              >
                <Plus size={18} />
              </button>
            </div>
          </Row>
          <p className="px-4 pb-3 pt-1 font-gujarati leading-relaxed text-stone" style={{ fontSize: `${1.125 * fontScale}rem` }}>
            જય સ્વામિનારાયણ · Jay Swaminarayan
          </p>
        </Section>

        <Section title="Your library">
          <Row label="Kirtans">
            <span className="text-sm text-stone">{state.kirtans.length}</span>
          </Row>
          <Row label="Favorites">
            <span className="text-sm text-stone">{state.favorites.length}</span>
          </Row>
          <Row label="Playlists">
            <span className="text-sm text-stone">{state.playlists.length}</span>
          </Row>
          <Row label="Annotated kirtans">
            <span className="text-sm text-stone">{annotated}</span>
          </Row>
        </Section>

        <Section title="Data">
          <RowButton onClick={download}>Export library as JSON</RowButton>
          <label className="flex min-h-[52px] cursor-pointer items-center px-4 text-base transition-colors active:bg-parchment">
            Import library from JSON
            <input type="file" accept="application/json" onChange={upload} className="hidden" />
          </label>
          <RowButton
            danger
            onClick={() => {
              if (
                confirm(
                  'Discard all local edits, favorites, playlists and notes, and reload the original seed data?'
                )
              )
                actions.resetToSeed()
            }}
          >
            Reset to seed data
          </RowButton>
          <p className="px-4 pb-3 pt-1 text-xs leading-relaxed text-stone">
            Everything is stored on this device. Export regularly to back up your notes,
            favorites and playlists — you can import the file on another device.
          </p>
        </Section>

        <p className="pb-4 text-center text-[11px] uppercase tracking-[0.18em] text-stone">
          Smruti Gaan · Hariprabodham
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="px-4 pb-1.5 text-[11px] uppercase tracking-[0.15em] text-stone">{title}</h2>
      <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 px-4 py-2">
      <span className="text-base">{label}</span>
      {children}
    </div>
  )
}

function RowButton({ onClick, danger = false, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[52px] w-full items-center px-4 text-left text-base transition-colors active:bg-parchment ${
        danger ? 'text-madder' : ''
      }`}
    >
      {children}
    </button>
  )
}

function Seg({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[36px] select-none rounded-md px-3.5 font-gujarati transition-all ${
        active ? 'bg-white font-medium text-ink shadow-sm' : 'text-stone'
      }`}
    >
      {children}
    </button>
  )
}
