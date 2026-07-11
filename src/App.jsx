import { useEffect, useRef, useState } from 'react'
import { useStore } from './lib/store'
import { useCloud } from './lib/cloud'
import Library from './components/Library'
import KirtanView from './components/KirtanView'
import Editor from './components/Editor'
import Playlists, { PlaylistDetail } from './components/Playlists'
import Notes from './components/Notes'
import Settings from './components/Settings'
import { usePlayer, MiniPlayer, FullPlayer } from './components/Player'
import { BookOpen, Bookmark, Music, Cog } from './components/icons'

const PREFS_KEY = 'smruti-gaan:prefs'
const NAV_KEY = 'smruti-gaan:nav'

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}
  } catch {
    return {}
  }
}

// Navigation survives a page refresh: the stack and active tab live in
// sessionStorage (per-tab, so it can't leak into a fresh visit). The browser
// keeps both the history entries and each entry's {depth} state across a
// reload, so we clamp the restored stack to the current entry's depth and
// back/forward keep working seamlessly.
function loadNav() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(NAV_KEY)) || {}
    const depth = window.history.state?.depth || 0
    return {
      tab: saved.tab,
      // restored pages must not replay the slide-in animation
      stack: (saved.stack || []).slice(0, depth).map((v) => ({ ...v, restored: true })),
    }
  } catch {
    return {}
  }
}

const TABS = [
  { key: 'library', label: 'Library', Icon: BookOpen },
  { key: 'playlists', label: 'Playlists', Icon: Music },
  { key: 'notes', label: 'Notes', Icon: Bookmark },
  { key: 'settings', label: 'Settings', Icon: Cog },
]

// Navigation model: three always-mounted tab panels (so scroll position and
// search state survive tab switches) plus a page stack that slides full-screen
// pages in on top, mirrored into browser history so the Android back button
// and iOS edge-swipe-back both work.
export default function App() {
  const { state, actions } = useStore()
  const cloud = useCloud(state, actions)
  const player = usePlayer(state.kirtans)
  // Editor saves/deletes go to the device first, then through to the cloud
  // library (no-ops for non-editors).
  const editorActions = {
    ...actions,
    saveKirtan(k) {
      actions.saveKirtan(k)
      cloud.pushKirtan(k)
    },
    deleteKirtan(id) {
      actions.deleteKirtan(id)
      cloud.removeKirtan(id)
    },
  }
  const nav = useRef(loadNav()).current
  const [tab, setTab] = useState(nav.tab || 'library')
  const [stack, setStack] = useState(nav.stack || []) // [{name:'kirtan'|'playlist'|'edit', id}]
  const [script, setScriptState] = useState(() => loadPrefs().script || 'gu')
  const [fontScale, setFontScaleState] = useState(() => loadPrefs().fontScale || 1)
  const [theme, setThemeState] = useState(() => loadPrefs().theme || 'dark')

  const prefs = useRef({ script, fontScale, theme })
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
  const setTheme = (t) => {
    setThemeState(t)
    savePrefs({ theme: t })
  }

  // Apply the theme to <html> (the CSS variables switch on data-theme) and
  // keep the browser-chrome color in sync. "auto" follows the OS setting.
  // Kirtan/playlist pages open with a violet hero wash at the very top, so
  // the chrome color follows suit there — no seam between Safari's bar and
  // the page.
  const heroPage = ['kirtan', 'playlist'].includes(stack[stack.length - 1]?.name)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const resolved = theme === 'auto' ? (mq.matches ? 'light' : 'dark') : theme
      document.documentElement.dataset.theme = resolved
      const color =
        resolved === 'light'
          ? heroPage
            ? '#D8C7F7'
            : '#F7F6FB'
          : heroPage
            ? '#2A1E49'
            : '#0A0A10'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme, heroPage])

  const stackRef = useRef(stack)
  stackRef.current = stack

  useEffect(() => {
    try {
      sessionStorage.setItem(NAV_KEY, JSON.stringify({ tab, stack }))
    } catch {}
  }, [tab, stack])

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

  // line: optional lyric-line index to scroll to (search results pass the hit)
  const openKirtan = (id, line) => push({ name: 'kirtan', id, line })
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
        <Library state={state} actions={actions} script={script} onOpen={openKirtan} />
      </TabPanel>
      <TabPanel id="panel-playlists" active={tab === 'playlists'} padBottom={padBottom}>
        <Playlists
          state={state}
          actions={actions}
          script={script}
          onOpenPlaylist={(id) => push({ name: 'playlist', id })}
        />
      </TabPanel>
      <TabPanel id="panel-notes" active={tab === 'notes'} padBottom={padBottom}>
        <Notes state={state} script={script} onOpen={openKirtan} />
      </TabPanel>
      <TabPanel id="panel-settings" active={tab === 'settings'} padBottom={padBottom}>
        <Settings
          state={state}
          actions={actions}
          cloud={cloud}
          script={script}
          setScript={setScript}
          fontScale={fontScale}
          setFontScale={setFontScale}
          theme={theme}
          setTheme={setTheme}
          onAdd={() => push({ name: 'edit', id: null })}
        />
      </TabPanel>

      {/* Page stack — the tab bar is hidden here, so detail pages only need
          clearance for the mini player, not the tabs */}
      {stack.map((v, i) => (
        <StackPage
          key={`${v.name}-${v.id ?? 'new'}-${i}`}
          storageKey={`smruti-gaan:scroll:stack-${i}-${v.name}-${v.id ?? 'new'}`}
          className={`${v.restored ? '' : 'animate-page-in'} fixed inset-0 overflow-y-auto overscroll-contain bg-night ${
            v.name === 'edit' ? 'z-[60]' : `z-30 ${player.current ? 'pb-28' : 'pb-10'}`
          }`}
        >
          {v.name === 'kirtan' && (
            <KirtanView
              state={state}
              actions={actions}
              canEdit={cloud.isEditor}
              id={v.id}
              initialLine={v.line}
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
              actions={editorActions}
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
        </StackPage>
      ))}

      {/* Persistent audio player: mini bar above the tabs (or at the bottom
          edge on detail pages, where the tab bar is hidden) */}
      {player.current && !player.expanded && (
        <MiniPlayer player={player} script={script} docked={stack.length === 0} />
      )}
      {player.current && player.expanded && (
        <FullPlayer player={player} script={script} onOpenLyrics={openLyricsFor} />
      )}

      {/* Bottom tab bar — root screens only; detail pages get the space back */}
      {stack.length === 0 && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-veil/5 bg-night/85 backdrop-blur-xl">
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
                <Icon size={24} sw={active ? 2.5 : 2.1} />
                <span className={`text-[10px] leading-none ${active ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        </nav>
      )}
    </div>
  )
}

// Scroll position saved to sessionStorage (rAF-throttled) and restored on
// mount, so a page refresh doesn't dump the user back to the top.
function usePersistentScroll(key) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = +sessionStorage.getItem(key) || 0
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        try {
          sessionStorage.setItem(key, String(el.scrollTop))
        } catch {}
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [key])
  return ref
}

function StackPage({ storageKey, className, children }) {
  const ref = usePersistentScroll(storageKey)
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

// Kept mounted and merely hidden so each tab retains its scroll position,
// like native tab controllers do.
function TabPanel({ id, active, padBottom, children }) {
  const ref = usePersistentScroll(`smruti-gaan:scroll:${id}`)
  return (
    <div
      ref={ref}
      id={id}
      className={`${padBottom} absolute inset-0 overflow-y-auto overscroll-contain ${
        active ? '' : 'invisible pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-2xl">{children}</div>
    </div>
  )
}
