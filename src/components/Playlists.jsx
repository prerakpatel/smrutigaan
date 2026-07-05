import { useState } from 'react'
import Sheet, { SheetRow } from './Sheet'
import { ChevronLeft, ChevronRight, Ellipsis, Music, Pencil, Plus, Trash, X } from './icons'

export default function Playlists({ state, actions, script, onOpenPlaylist }) {
  const [creating, setCreating] = useState(false)
  const kirtanById = new Map(state.kirtans.map((k) => [k.id, k]))

  return (
    <div>
      <div className="pt-safe px-4">
        <div className="flex items-end justify-between pt-4">
          <h1 className="font-display text-[28px] font-semibold leading-none tracking-tight">
            Playlists
          </h1>
          <button
            onClick={() => setCreating(true)}
            aria-label="New playlist"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-marble shadow-sm transition-transform active:scale-95"
          >
            <Plus size={22} sw={2} />
          </button>
        </div>
      </div>

      <div className="mt-4 px-4">
        {state.playlists.length === 0 ? (
          <div className="mt-16 text-center text-sm text-stone">
            <Music size={36} className="mx-auto text-hairline" />
            <p className="mt-3">No playlists yet.</p>
            <p className="mt-1">
              Tap <span className="font-medium text-ink">+</span> to create one, then add kirtans
              from any kirtan page.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {state.playlists.map((p) => {
              const first = p.kirtanIds.map((kid) => kirtanById.get(kid)).find(Boolean)
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onOpenPlaylist(p.id)}
                    className="-mx-2 flex w-full items-center gap-3 rounded-xl px-2 py-3.5 text-left transition-colors active:bg-parchment"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-soft text-saffron-deep">
                      <Music size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium">{p.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-stone">
                        {p.kirtanIds.length} {p.kirtanIds.length === 1 ? 'kirtan' : 'kirtans'}
                        {first &&
                          ` · ${
                            script === 'gu'
                              ? first.title.gu || first.title.en
                              : first.title.en || first.title.gu
                          }`}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-hairline" />
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
export function PlaylistDetail({ state, actions, id, script, onOpen, onBack }) {
  const [showActions, setShowActions] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const playlist = state.playlists.find((p) => p.id === id)
  const kirtanById = new Map(state.kirtans.map((k) => [k.id, k]))

  if (!playlist) {
    return (
      <div className="pt-safe px-4">
        <div className="pt-16 text-center text-sm text-stone">
          <p>This playlist no longer exists.</p>
          <button onClick={onBack} className="mt-2 underline">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="pt-safe sticky top-0 z-20 bg-marble/95 backdrop-blur">
        <div className="flex h-12 items-center px-1">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-saffron-deep active:bg-parchment"
          >
            <ChevronLeft size={26} sw={2} />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center text-[15px] font-medium">
            {playlist.name}
          </p>
          <button
            onClick={() => setShowActions(true)}
            aria-label="Playlist actions"
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone active:bg-parchment"
          >
            <Ellipsis size={22} />
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-soft text-saffron-deep">
            <Music size={26} />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight">{playlist.name}</h2>
            <p className="text-xs text-stone">
              {playlist.kirtanIds.length}{' '}
              {playlist.kirtanIds.length === 1 ? 'kirtan' : 'kirtans'}
            </p>
          </div>
        </div>

        {playlist.kirtanIds.length === 0 ? (
          <p className="mt-12 text-center text-sm text-stone">
            Empty — open any kirtan and choose{' '}
            <span className="font-medium text-ink">Add to playlist</span>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline">
            {playlist.kirtanIds.map((kid) => {
              const k = kirtanById.get(kid)
              if (!k) return null
              return (
                <li key={kid} className="flex items-center">
                  <button
                    onClick={() => onOpen(kid)}
                    className="-ml-2 min-w-0 flex-1 rounded-xl py-3.5 pl-2 text-left transition-colors active:bg-parchment"
                  >
                    <span className="block truncate font-gujarati text-lg leading-snug">
                      {script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-stone">
                      {script === 'gu' ? k.title.en : k.title.gu}
                    </span>
                  </button>
                  <button
                    onClick={() => actions.togglePlaylistItem(playlist.id, kid)}
                    aria-label="Remove from playlist"
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-stone active:text-madder"
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
        className="w-full rounded-xl border border-hairline bg-white px-4 py-3 text-base outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
      />
      <button
        onClick={() => onDone(name)}
        className="mt-3 min-h-[44px] w-full rounded-full bg-ink text-base font-medium text-marble active:bg-madder"
      >
        Done
      </button>
    </Sheet>
  )
}
