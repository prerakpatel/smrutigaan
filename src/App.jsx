import { useState } from 'react'
import { useStore } from './lib/store'
import Library from './components/Library'
import KirtanView from './components/KirtanView'
import Editor from './components/Editor'
import Playlists from './components/Playlists'

// view: {name:'library'} | {name:'kirtan',id} | {name:'edit',id|null} | {name:'playlists'}
export default function App() {
  const { state, actions } = useStore()
  const [view, setView] = useState({ name: 'library' })
  const [script, setScript] = useState('gu') // global script preference

  const go = (v) => setView(v)

  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      <header className="sticky top-0 z-20 border-b border-hairline bg-marble/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <button onClick={() => go({ name: 'library' })} className="text-left">
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Smruti <span className="text-saffron-deep">Gaan</span>
            </h1>
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone">Hariprabodham</p>
          </button>
          <nav className="flex items-center gap-1 text-sm">
            <NavButton active={view.name === 'library'} onClick={() => go({ name: 'library' })}>
              Library
            </NavButton>
            <NavButton active={view.name === 'playlists'} onClick={() => go({ name: 'playlists' })}>
              Playlists
            </NavButton>
            <button
              onClick={() => go({ name: 'edit', id: null })}
              className="ml-1 rounded-full bg-ink px-3 py-1.5 text-marble transition-colors hover:bg-madder"
            >
              + Add
            </button>
          </nav>
        </div>
      </header>

      <main className="px-4 pb-24 pt-4">
        {view.name === 'library' && (
          <Library
            state={state}
            actions={actions}
            script={script}
            onOpen={(id) => go({ name: 'kirtan', id })}
          />
        )}
        {view.name === 'kirtan' && (
          <KirtanView
            state={state}
            actions={actions}
            id={view.id}
            script={script}
            setScript={setScript}
            onEdit={() => go({ name: 'edit', id: view.id })}
            onBack={() => go({ name: 'library' })}
          />
        )}
        {view.name === 'edit' && (
          <Editor
            state={state}
            actions={actions}
            id={view.id}
            onDone={(id) => go(id ? { name: 'kirtan', id } : { name: 'library' })}
          />
        )}
        {view.name === 'playlists' && (
          <Playlists
            state={state}
            actions={actions}
            script={script}
            onOpen={(id) => go({ name: 'kirtan', id })}
          />
        )}
      </main>
    </div>
  )
}

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 transition-colors ${
        active ? 'bg-parchment font-medium text-ink' : 'text-stone hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
