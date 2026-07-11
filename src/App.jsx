import { useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store'
import Library from './components/Library'
import KirtanView from './components/KirtanView'
import Editor from './components/Editor'
import Playlists, { PlaylistDetail } from './components/Playlists'
import Settings from './components/Settings'
import { usePlayer, MiniPlayer, FullPlayer } from './components/Player'
import { BookOpen, Music, Cog } from './components/icons'

const PREFS_KEY = 'smruti-gaan:prefs'

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}
  } catch {
    return {}
  }
}

const TABS = [
  { key: 'library', label: 'Library', Icon: BookOpen },
  { key: 'playlists', label: 'Playlists', Icon: Music },
  { key: 'settings', label: 'Settings', Icon: Cog },
]

// Navigation model: three always-mounted tab panels (so scroll position and
// search state survive tab switches) plus a page stack that slides full-screen
// pages in on top, mirrored into browser history so the Android back button
// and iOS edge-swipe-back both work.
export default function App() {
  const { state, actions } = useStore()
  const player = usePlayer(state.kirtans)
  const [tab, setTab] = useState('library')
  const [stack, setStack] = useState([]) // [{name:'kirtan'|'playlist'|'edit', id}]
  const [script, setScriptState] = useState(() => loadPrefs().script || 'gu')
  const [fontScale, setFontScaleState] = useState(() => loadPrefs().fontScale || 1)

  const prefs = useRef({ script, fontScale })
  const savePrefs = (patch) => {
    prefs.current = { ...prefs.current, ...patch }
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs.current))
    } catch {}
  }
  const setScript = (s) => {
    setScriptState(s)
    savePrefs({ script: s })
  }
  const setFontScale = (f) => {
    setFontScaleState(f)
    savePrefs({ fontScale: f })
  }

  const stackRef = useRef(stack)
  stackRef.current = stack

  useEffect(() => {
    const onPop = (e) => {
      const depth = e.state?.depth || 0
      setStack((s) => (depth < s.length ? s.slice(0, depth) : s))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = (view) => {
    const depth = stackRef.current.length + 1
    setStack((s) => [...s, view])
    window.history.pushState({ depth }, '')
  }
  const back = () => window.history.back()
  const backTwice = () => window.history.go(-2)
  const replaceTop = (view) => setStack((s) => [...s.slice(0, -1), view])

  const openTab = (key) => {
    if (stackRef.current.length > 0) {
      window.history.go(-stackRef.current.length)
      setStack([])
    } else if (key === tab) {
      // native pattern: re-tapping the active tab scrolls it back to the top
      document.getElementById(`panel-${key}`)?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setTab(key)
  }

  const openKirtan = (id) => push({ name: 'kirtan', id })
  // From the player: jump to the playing kirtan's lyrics unless already there.
  const openLyricsFor = (id) => {
    const top = stackRef.current[stackRef.current.length - 1]
    if (top?.name === 'kirtan' && top.id === id) return
    push({ name: 'kirtan', id })
  }

  // Extra bottom padding on every scrolling page while the mini player is docked.
  const padBottom = player.current ? 'pb-tabbar-mini' : 'pb-tabbar'

  return (
    <div className="relative h-dvh">
      <TabPanel id="panel-library" active={tab === 'library'} padBottom={padBottom}>
        <Library
          state={state}
          actions={actions}
          script={script}
          onOpen={openKirtan}
          onAdd={() => push({ name: 'edit', id: null })}
        />
      </TabPanel>
      <TabPanel id="panel-playlists" active={tab === 'playlists'} padBottom={padBottom}>
        <Playlists
          state={state}
          actions={actions}
          script={script}
          onOpenPlaylist={(id) => push({ name: 'playlist', id })}
        />
      </TabPanel>
      <TabPanel id="panel-settings" active={tab === 'settings'} padBottom={padBottom}>
        <Settings
          state={state}
          actions={actions}
          script={script}
          setScript={setScript}
          fontScale={fontScale}
          setFontScale={setFontScale}
        />
      </TabPanel>

      {/* Page stack */}
      {stack.map((v, i) => (
        <div
          key={`${v.name}-${v.id ?? 'new'}-${i}`}
          className={`animate-page-in fixed inset-0 overflow-y-auto overscroll-contain bg-night ${
            v.name === 'edit' ? 'z-[60]' : `z-30 ${padBottom}`
          }`}
        >
          {v.name === 'kirtan' && (
            <KirtanView
              state={state}
              actions={actions}
              id={v.id}
              script={script}
              setScript={setScript}
              fontScale={fontScale}
              setFontScale={setFontScale}
              player={player}
              onEdit={() => push({ name: 'edit', id: v.id })}
              onBack={back}
            />
          )}
          {v.name === 'playlist' && (
            <PlaylistDetail
              state={state}
              actions={actions}
              id={v.id}
              script={script}
              player={player}
              onOpen={openKirtan}
              onBack={back}
            />
          )}
          {v.name === 'edit' && (
            <Editor
              state={state}
              actions={actions}
              id={v.id}
              onCancel={back}
              onSaved={(savedId) => {
                if (v.id) back()
                else replaceTop({ name: 'kirtan', id: savedId })
              }}
              onDeleted={() => {
                // the kirtan page beneath is gone too — pop both
                if (stackRef.current.length >= 2) backTwice()
                else back()
              }}
            />
          )}
        </div>
      ))}

      {/* Persistent audio player: mini bar above the tabs, full-screen when expanded */}
      {player.current && !player.expanded && <MiniPlayer player={player} script={script} />}
      {player.current && player.expanded && (
        <FullPlayer player={player} script={script} onOpenLyrics={openLyricsFor} />
      )}

      {/* Bottom tab bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-night/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ key, label, Icon }) => {
            const active = key === tab && stack.length === 0
            return (
              <button
                key={key}
                onClick={() => openTab(key)}
                className={`flex min-h-[56px] flex-1 select-none flex-col items-center justify-center gap-1 pt-1.5 transition-colors ${
                  active ? 'text-snow' : 'text-muted active:text-snow'
                }`}
              >
                <Icon size={24} sw={active ? 2.1 : 1.8} />
                <span className={`text-[10px] leading-none ${active ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

// Kept mounted and merely hidden so each tab retains its scroll position,
// like native tab controllers do.
function TabPanel({ id, active, padBottom, children }) {
  return (
    <div
      id={id}
      className={`${padBottom} absolute inset-0 overflow-y-auto overscroll-contain ${
        active ? '' : 'invisible pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}
