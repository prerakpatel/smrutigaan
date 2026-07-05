import { useState } from 'react'
import { toLines } from '../lib/text'

export default function KirtanView({ state, actions, id, script, setScript, onEdit, onBack }) {
  const kirtan = state.kirtans.find((k) => k.id === id)
  const [noteEditor, setNoteEditor] = useState(null) // line index currently being annotated
  const [showKirtanNote, setShowKirtanNote] = useState(false)
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false)

  if (!kirtan) {
    return (
      <div className="pt-10 text-center text-sm text-stone">
        <p>This kirtan no longer exists.</p>
        <button onClick={onBack} className="mt-2 underline">Back to library</button>
      </div>
    )
  }

  const ann = state.annotations[id] || { note: '', lines: {} }
  const fav = state.favorites.includes(id)
  const lines = toLines(kirtan.lyrics[script] || kirtan.lyrics.gu || kirtan.lyrics.en)
  const otherScriptMissing = !kirtan.lyrics[script]

  return (
    <article>
      <div className="flex items-center justify-between text-sm">
        <button onClick={onBack} className="text-stone hover:text-ink">← Library</button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => actions.toggleFavorite(id)}
            className={`text-lg ${fav ? 'text-madder' : 'text-hairline hover:text-stone'}`}
            aria-label="Toggle favorite"
          >
            ♥
          </button>
          <button
            onClick={() => setShowPlaylistPicker((s) => !s)}
            className="rounded-full border border-hairline bg-white px-3 py-1 text-xs text-stone hover:border-stone hover:text-ink"
          >
            + Playlist
          </button>
          <button
            onClick={onEdit}
            className="rounded-full border border-hairline bg-white px-3 py-1 text-xs text-stone hover:border-stone hover:text-ink"
          >
            Edit
          </button>
        </div>
      </div>

      {showPlaylistPicker && (
        <PlaylistPicker state={state} actions={actions} kirtanId={id} onClose={() => setShowPlaylistPicker(false)} />
      )}

      <header className="mt-6">
        <h2 className="font-display font-gujarati text-2xl font-semibold leading-snug">
          {script === 'gu' ? kirtan.title.gu || kirtan.title.en : kirtan.title.en || kirtan.title.gu}
        </h2>
        <p className="mt-1 text-sm text-stone">
          {script === 'gu' ? kirtan.title.en : kirtan.title.gu}
        </p>
        {(kirtan.categories || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kirtan.categories.map((c) => (
              <span key={c} className="rounded-full bg-parchment px-2.5 py-0.5 text-[11px] text-stone">
                {c}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Script flip */}
      <div className="mt-5 inline-flex rounded-full border border-hairline bg-white p-0.5 text-sm">
        <ScriptTab active={script === 'gu'} onClick={() => setScript('gu')}>ગુજરાતી</ScriptTab>
        <ScriptTab active={script === 'en'} onClick={() => setScript('en')}>English</ScriptTab>
      </div>

      {otherScriptMissing && (
        <p className="mt-3 text-xs text-madder">
          No {script === 'gu' ? 'Gujarati' : 'transliteration'} text yet — showing the other script. Add it in Edit.
        </p>
      )}

      {/* Lyrics: tap a line to highlight, use the ✎ to attach a note.
          Annotations are keyed by line index, shared across both scripts. */}
      <div className="mt-6 font-gujarati text-lg leading-loose">
        {lines.map((l) =>
          l.type === 'break' ? (
            <div key={l.key} className="h-5" />
          ) : (
            <LyricLine
              key={l.key}
              line={l}
              annotation={ann.lines[l.index]}
              editing={noteEditor === l.index}
              onToggleHighlight={() => actions.toggleHighlight(id, l.index)}
              onOpenNote={() => setNoteEditor(noteEditor === l.index ? null : l.index)}
              onSaveNote={(text) => {
                actions.setLineNote(id, l.index, text)
                setNoteEditor(null)
              }}
            />
          )
        )}
      </div>

      {/* Kirtan-level note */}
      <section className="mt-10 border-t border-hairline pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.15em] text-stone">Note on this kirtan</h3>
          <button
            onClick={() => setShowKirtanNote((s) => !s)}
            className="text-xs text-stone underline underline-offset-2 hover:text-ink"
          >
            {showKirtanNote ? 'Done' : ann.note ? 'Edit' : 'Add note'}
          </button>
        </div>
        {showKirtanNote ? (
          <textarea
            defaultValue={ann.note}
            onBlur={(e) => actions.setKirtanNote(id, e.target.value)}
            rows={4}
            autoFocus
            placeholder="Context, raag, occasion, meaning…"
            className="mt-2 w-full rounded-xl border border-hairline bg-white p-3 text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
          />
        ) : ann.note ? (
          <p className="mt-2 whitespace-pre-wrap text-sm italic text-madder">{ann.note}</p>
        ) : null}
      </section>
    </article>
  )
}

function ScriptTab({ active, onClick, children }) {
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

function LyricLine({ line, annotation, editing, onToggleHighlight, onOpenNote, onSaveNote }) {
  const highlighted = annotation?.highlight
  const note = annotation?.note

  return (
    <div className="group relative -mx-2 px-2">
      <div className="flex items-baseline gap-2">
        <button
          onClick={onToggleHighlight}
          className={`flex-1 text-left transition-colors ${highlighted ? 'haldi' : 'hover:text-saffron-deep'}`}
        >
          {line.text}
        </button>
        <button
          onClick={onOpenNote}
          aria-label="Note on this line"
          className={`shrink-0 font-ui text-xs transition-opacity ${
            note ? 'text-madder opacity-100' : 'text-stone opacity-0 group-hover:opacity-100'
          }`}
        >
          ✎
        </button>
      </div>

      {editing ? (
        <NoteInput initial={note || ''} onSave={onSaveNote} />
      ) : note ? (
        <p className="mb-1 border-l-2 border-saffron pl-3 font-ui text-[13px] italic leading-normal text-madder">
          {note}
        </p>
      ) : null}
    </div>
  )
}

function NoteInput({ initial, onSave }) {
  const [text, setText] = useState(initial)
  return (
    <div className="mb-2 mt-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        autoFocus
        placeholder="Note on this line…"
        className="w-full rounded-lg border border-hairline bg-white p-2 font-ui text-sm outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
      />
      <div className="mt-1 flex gap-3 font-ui text-xs">
        <button onClick={() => onSave(text)} className="font-medium text-saffron-deep">Save note</button>
        <button onClick={() => onSave(initial)} className="text-stone">Cancel</button>
        {initial && (
          <button onClick={() => onSave('')} className="ml-auto text-madder">Delete</button>
        )}
      </div>
    </div>
  )
}

function PlaylistPicker({ state, actions, kirtanId, onClose }) {
  const [newName, setNewName] = useState('')
  return (
    <div className="mt-3 rounded-xl border border-hairline bg-white p-3 text-sm">
      {state.playlists.length === 0 && (
        <p className="text-stone">No playlists yet — create one below.</p>
      )}
      {state.playlists.map((p) => {
        const inList = p.kirtanIds.includes(kirtanId)
        return (
          <label key={p.id} className="flex cursor-pointer items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={inList}
              onChange={() => actions.togglePlaylistItem(p.id, kirtanId)}
              className="accent-saffron-deep"
            />
            <span>{p.name}</span>
          </label>
        )
      })}
      <div className="mt-2 flex gap-2 border-t border-hairline pt-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded-lg border border-hairline px-2 py-1 outline-none focus:border-saffron"
        />
        <button
          onClick={() => {
            if (!newName.trim()) return
            const pid = actions.createPlaylist(newName.trim())
            actions.togglePlaylistItem(pid, kirtanId)
            setNewName('')
          }}
          className="rounded-lg bg-ink px-3 py-1 text-marble"
        >
          Create
        </button>
        <button onClick={onClose} className="text-stone">Close</button>
      </div>
    </div>
  )
}
