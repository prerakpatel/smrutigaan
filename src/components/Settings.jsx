import { useState } from 'react'
import { Bookmark, Minus, Plus } from './icons'

export default function Settings({
  state,
  actions,
  cloud,
  script,
  setScript,
  fontScale,
  setFontScale,
  theme,
  setTheme,
  onAdd,
  onManagePresets,
}) {
  const [email, setEmail] = useState('')
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
        <h1 className="pt-4 font-display text-[32px] font-extrabold leading-none tracking-tight">
          Settings
        </h1>
      </div>

      <div className="mt-5 space-y-5 px-4">
        <Section title="Reading">
          <Row label="Appearance">
            <div className="flex rounded-full bg-night p-0.5 text-sm">
              <Seg active={theme === 'dark'} onClick={() => setTheme('dark')}>
                Dark
              </Seg>
              <Seg active={theme === 'light'} onClick={() => setTheme('light')}>
                Light
              </Seg>
              <Seg active={theme === 'auto'} onClick={() => setTheme('auto')}>
                Auto
              </Seg>
            </div>
          </Row>
          <Row label="Default script">
            <div className="flex rounded-full bg-night p-0.5 text-sm">
              <Seg active={script === 'gu'} onClick={() => setScript('gu')}>
                ગુજરાતી
              </Seg>
              <Seg active={script === 'en'} onClick={() => setScript('en')}>
                English
              </Seg>
            </div>
          </Row>
          <Row label="Lyrics text size">
            <div className="flex items-center gap-1 rounded-full bg-night">
              <button
                onClick={() => setFontScale(Math.max(0.85, +(fontScale - 0.125).toFixed(3)))}
                aria-label="Smaller text"
                className="flex h-10 w-12 items-center justify-center rounded-l-full active:bg-card"
              >
                <Minus size={18} />
              </button>
              <span className="w-10 text-center text-sm text-muted">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                onClick={() => setFontScale(Math.min(1.6, +(fontScale + 0.125).toFixed(3)))}
                aria-label="Larger text"
                className="flex h-10 w-12 items-center justify-center rounded-r-full active:bg-card"
              >
                <Plus size={18} />
              </button>
            </div>
          </Row>
          <p
            className="px-4 pb-3 pt-1 font-lyrics font-semibold leading-relaxed text-snow/80"
            style={{ fontSize: `${1.125 * fontScale}rem` }}
          >
            જય સ્વામિનારાયણ · Jay Swaminarayan
          </p>
        </Section>

        <Section title="Account">
          {cloud.session ? (
            <>
              <div className="flex min-h-[56px] items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-base">{cloud.session.user.email}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {cloud.pendingCount > 0
                      ? `${cloud.pendingCount} ${
                          cloud.pendingCount === 1 ? 'change' : 'changes'
                        } waiting — retries automatically`
                      : cloud.syncedAt
                        ? `Synced ${cloud.syncedAt.toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}`
                        : 'Sync is on'}
                  </span>
                </span>
                {cloud.isEditor && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-bright">
                    Editor
                  </span>
                )}
              </div>
              {cloud.isEditor && (
                <RowButton onClick={cloud.publishAll}>
                  {cloud.publishing
                    ? cloud.publishing.total === 0
                      ? 'Checking for changes…'
                      : `Syncing… ${cloud.publishing.done} of ${cloud.publishing.total}`
                    : 'Sync library to cloud'}
                </RowButton>
              )}
            </>
          ) : (
            <>
              <RowButton onClick={cloud.signInGoogle}>
                <span className="font-medium text-accent-bright">Continue with Google</span>
              </RowButton>
              <div className="flex items-center gap-2 px-4 py-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  placeholder="Or email a sign-in link"
                  className="min-w-0 flex-1 rounded-full bg-night px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/70"
                />
                <button
                  onClick={() => email.trim() && cloud.signInEmail(email.trim())}
                  className="min-h-[40px] shrink-0 rounded-full bg-snow px-4 text-sm font-semibold text-night active:opacity-80"
                >
                  Send
                </button>
              </div>
              <p className="px-4 pb-3 pt-1 text-xs leading-relaxed text-muted">
                Sign in to sync your favorites, playlists, notes and highlights across devices.
                The app keeps working fully offline either way.
              </p>
            </>
          )}
        </Section>

        <Section title="Your library">
          {cloud.isEditor && (
            <RowButton onClick={onAdd}>
              <span className="flex items-center gap-2.5 font-medium text-accent-bright">
                <Plus size={18} sw={2} />
                Add a new kirtan
              </span>
            </RowButton>
          )}
          {cloud.isEditor && (
            <RowButton onClick={onManagePresets}>
              <span className="flex items-center gap-2.5 font-medium text-accent-bright">
                <Bookmark size={18} />
                Manage preset lists
              </span>
            </RowButton>
          )}
          <Row label="Kirtans">
            <span className="text-sm text-muted">{state.kirtans.length}</span>
          </Row>
          <Row label="Favorites">
            <span className="text-sm text-muted">{state.favorites.length}</span>
          </Row>
          <Row label="Playlists">
            <span className="text-sm text-muted">{state.playlists.length}</span>
          </Row>
          <Row label="Annotated kirtans">
            <span className="text-sm text-muted">{annotated}</span>
          </Row>
        </Section>

        <Section title="Data">
          <RowButton onClick={download}>Export library as JSON</RowButton>
          <label className="flex min-h-[52px] cursor-pointer items-center px-4 text-base transition-colors active:bg-card">
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
          <p className="px-4 pb-3 pt-1 text-xs leading-relaxed text-muted">
            Everything is stored on this device. Export regularly to back up your notes,
            favorites and playlists — you can import the file on another device.
          </p>
        </Section>

        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted">
          Smruti Gaan · Hariprabodham
        </p>

        {cloud.session && (
          <button
            onClick={cloud.signOut}
            className="mx-auto mb-2 block rounded-full bg-surface px-5 py-2 text-[13px] font-medium text-punch active:bg-card"
          >
            Sign out
          </button>
        )}
        <div className="pb-4" />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="px-4 pb-1.5 text-[11px] uppercase tracking-[0.15em] text-muted">{title}</h2>
      <div className="divide-y divide-veil/5 overflow-hidden rounded-2xl border border-veil/5 bg-surface">
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
      className={`flex min-h-[52px] w-full items-center px-4 text-left text-base transition-colors active:bg-card ${
        danger ? 'text-punch' : ''
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
      className={`min-h-[36px] select-none rounded-full px-3.5 font-lyrics transition-all ${
        active ? 'bg-snow font-semibold text-night' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}
