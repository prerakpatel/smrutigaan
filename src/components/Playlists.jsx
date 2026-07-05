import { useState } from 'react'

export default function Playlists({ state, actions, script, onOpen }) {
  const [newName, setNewName] = useState('')
  const kirtanById = new Map(state.kirtans.map((k) => [k.id, k]))

  return (
    <div>
      <h2 className="font-display text-xl font-semibold">Playlists</h2>

      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newName.trim()) {
              actions.createPlaylist(newName.trim())
              setNewName('')
            }
          }}
          placeholder="New playlist name"
          className="flex-1 rounded-xl border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
        />
        <button
          onClick={() => {
            if (!newName.trim()) return
            actions.createPlaylist(newName.trim())
            setNewName('')
          }}
          className="rounded-xl bg-ink px-4 py-2 text-sm text-marble hover:bg-madder"
        >
          Create
        </button>
      </div>

      {state.playlists.length === 0 && (
        <p className="mt-8 text-center text-sm text-stone">
          No playlists yet. Create one above, then add kirtans from any kirtan page.
        </p>
      )}

      <div className="mt-6 space-y-6">
        {state.playlists.map((p) => (
          <PlaylistCard
            key={p.id}
            playlist={p}
            kirtanById={kirtanById}
            script={script}
            actions={actions}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
}

function PlaylistCard({ playlist, kirtanById, script, actions, onOpen }) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(playlist.name)

  return (
    <section className="rounded-2xl border border-hairline bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              actions.renamePlaylist(playlist.id, name.trim() || playlist.name)
              setRenaming(false)
            }}
            autoFocus
            className="flex-1 rounded-lg border border-hairline px-2 py-1 font-display text-lg outline-none focus:border-saffron"
          />
        ) : (
          <h3 className="font-display text-lg font-semibold">{playlist.name}</h3>
        )}
        <div className="flex shrink-0 gap-3 text-xs text-stone">
          <button onClick={() => setRenaming(true)} className="underline underline-offset-2 hover:text-ink">
            Rename
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete playlist "${playlist.name}"? Kirtans themselves are kept.`))
                actions.deletePlaylist(playlist.id)
            }}
            className="underline underline-offset-2 hover:text-madder"
          >
            Delete
          </button>
        </div>
      </div>

      {playlist.kirtanIds.length === 0 ? (
        <p className="mt-2 text-sm text-stone">Empty — add kirtans from a kirtan page via “+ Playlist”.</p>
      ) : (
        <ul className="mt-2 divide-y divide-hairline">
          {playlist.kirtanIds.map((kid) => {
            const k = kirtanById.get(kid)
            if (!k) return null
            return (
              <li key={kid} className="flex items-center gap-2 py-2">
                <button onClick={() => onOpen(kid)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-gujarati">
                    {script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu}
                  </span>
                </button>
                <button
                  onClick={() => actions.togglePlaylistItem(playlist.id, kid)}
                  className="text-xs text-stone hover:text-madder"
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
