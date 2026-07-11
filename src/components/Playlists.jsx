import { useState } from 'react'
import { useScrolledPast } from '../lib/useScrolled'
import Sheet, { SheetRow } from './Sheet'
import {
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash,
  X,
} from './icons'

export default function Playlists({ state, actions, script, onOpenPlaylist }) {
  const [creating, setCreating] = useState(false)
  const kirtanById = new Map(state.kirtans.map((k) => [k.id, k]))

  return (
    <div>
      <div className="pt-safe px-4">
        <div className="flex items-end justify-between pt-4">
          <h1 className="font-display text-[32px] font-extrabold leading-none tracking-tight">
            Playlists
          </h1>
          <button
            onClick={() => setCreating(true)}
            aria-label="New playlist"
            className="grad-brand flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg shadow-fuchsia-500/25 transition-transform active:scale-95"
          >
            <Plus size={22} sw={2} />
          </button>
        </div>
      </div>

      <div className="mt-4 px-4">
        {state.playlists.length === 0 ? (
          <div className="mt-16 text-center text-sm text-muted">
            <Music size={36} className="mx-auto text-line" />
            <p className="mt-3">No playlists yet.</p>
            <p className="mt-1">
              Tap <span className="font-medium text-snow">+</span> to create one, then add kirtans
              from any kirtan page.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {state.playlists.map((p) => {
              const first = p.kirtanIds.map((kid) => kirtanById.get(kid)).find(Boolean)
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onOpenPlaylist(p.id)}
                    className="-mx-2 flex w-full items-center gap-3 rounded-xl px-2 py-3.5 text-left transition-colors active:bg-surface"
                  >
                    <span className="grad-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-fuchsia-500/20">
                      <Music size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold">{p.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {p.kirtanIds.length} {p.kirtanIds.length === 1 ? 'kirtan' : 'kirtans'}
                        {first &&
                          ` · ${
                            script === 'gu'
                              ? first.title.gu || first.title.en
                              : first.title.en || first.title.gu
                          }`}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-line" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {creating && (
        <NameSheet
          title="New playlist"
          initial=""
          onDone={(name) => {
            if (name.trim()) actions.createPlaylist(name.trim())
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

// Full-screen playlist page, pushed onto the navigation stack.
export function PlaylistDetail({ state, actions, id, script, player, onOpen, onBack }) {
  const [showActions, setShowActions] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [sentinelRef, scrolled] = useScrolledPast()
  const playlist = state.playlists.find((p) => p.id === id)
  const kirtanById = new Map(state.kirtans.map((k) => [k.id, k]))
  // The playable queue: playlist order, kirtans that actually have audio.
  const audioIds = (playlist?.kirtanIds || []).filter((kid) => kirtanById.get(kid)?.audio)
  const queuePlaying = player.playing && audioIds.includes(player.current)

  if (!playlist) {
    return (
      <div className="pt-safe px-4">
        <div className="pt-16 text-center text-sm text-muted">
          <p>This playlist no longer exists.</p>
          <button onClick={onBack} className="mt-2 underline">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Hero wash, album-page style — runs under the transparent top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-accent/25 via-fuchsia-500/[0.07] to-transparent" />
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-10 w-px" />

      <div
        className={`pt-safe sticky top-0 z-20 transition-colors duration-300 ${
          scrolled ? 'bg-night/95 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="flex h-12 items-center px-1">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-snow active:bg-surface"
          >
            <ChevronLeft size={26} sw={2} />
          </button>
          <p
            className={`min-w-0 flex-1 truncate px-1 text-center text-[15px] font-medium transition-opacity duration-300 ${
              scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {playlist.name}
          </p>
          <button
            onClick={() => setShowActions(true)}
            aria-label="Playlist actions"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface"
          >
            <Ellipsis size={22} />
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="mt-4 flex items-center gap-3.5">
          <span className="grad-brand flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/25">
            <Music size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
              {playlist.name}
            </h2>
            <p className="text-xs text-muted">
              {playlist.kirtanIds.length}{' '}
              {playlist.kirtanIds.length === 1 ? 'kirtan' : 'kirtans'}
              {audioIds.length > 0 && ` · ${audioIds.length} with audio`}
            </p>
          </div>
          {audioIds.length > 0 && (
            <button
              onClick={() =>
                queuePlaying ? player.toggle() : player.playKirtan(audioIds[0], audioIds)
              }
              aria-label={queuePlaying ? 'Pause playlist' : 'Play playlist'}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-snow text-night shadow-lg transition-transform active:scale-95"
            >
              {queuePlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>
          )}
        </div>

        {playlist.kirtanIds.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted">
            Empty — open any kirtan and choose{' '}
            <span className="font-medium text-snow">Add to playlist</span>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {playlist.kirtanIds.map((kid) => {
              const k = kirtanById.get(kid)
              if (!k) return null
              return (
                <li key={kid} className="flex items-center">
                  <button
                    onClick={() => onOpen(kid)}
                    className="-ml-2 min-w-0 flex-1 rounded-xl py-3.5 pl-2 text-left transition-colors active:bg-surface"
                  >
                    <span
                      className={`block truncate font-lyrics text-[17px] font-medium leading-snug ${
                        kid === player.current ? 'text-accent-bright' : ''
                      }`}
                    >
                      {script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {script === 'gu' ? k.title.en : k.title.gu}
                    </span>
                  </button>
                  <button
                    onClick={() => actions.togglePlaylistItem(playlist.id, kid)}
                    aria-label="Remove from playlist"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-muted active:text-punch"
                  >
                    <X size={18} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Sheet open={showActions} onClose={() => setShowActions(false)} title={playlist.name}>
        <SheetRow
          icon={<Pencil size={20} />}
          onClick={() => {
            setShowActions(false)
            setRenaming(true)
          }}
        >
          Rename playlist
        </SheetRow>
        <SheetRow
          danger
          icon={<Trash size={20} />}
          onClick={() => {
            if (confirm(`Delete playlist "${playlist.name}"? Kirtans themselves are kept.`)) {
              setShowActions(false)
              actions.deletePlaylist(playlist.id)
              onBack()
            }
          }}
        >
          Delete playlist
        </SheetRow>
      </Sheet>

      {renaming && (
        <NameSheet
          title="Rename playlist"
          initial={playlist.name}
          onDone={(name) => {
            if (name.trim()) actions.renamePlaylist(playlist.id, name.trim())
            setRenaming(false)
          }}
        />
      )}
    </div>
  )
}

function NameSheet({ title, initial, onDone }) {
  const [name, setName] = useState(initial)
  return (
    <Sheet open onClose={() => onDone(initial)} title={title}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onDone(name)}
        autoFocus
        placeholder="Playlist name"
        className="w-full rounded-xl bg-card px-4 py-3 text-base outline-none focus:ring-2 focus:ring-accent/70"
      />
      <button
        onClick={() => onDone(name)}
        className="mt-3 min-h-[44px] w-full rounded-full bg-snow text-base font-semibold text-night active:opacity-80"
      >
        Done
      </button>
    </Sheet>
  )
}
