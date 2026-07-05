import { useState } from 'react'
import { toLines } from '../lib/text'
import Sheet, { SheetRow } from './Sheet'
import {
  ChevronLeft,
  Heart,
  Ellipsis,
  Pencil,
  Plus,
  ShareIcon,
  Check,
  Minus,
  Music,
} from './icons'

export default function KirtanView({
  state,
  actions,
  id,
  script,
  setScript,
  fontScale,
  setFontScale,
  onEdit,
  onBack,
}) {
  const kirtan = state.kirtans.find((k) => k.id === id)
  const [lineSheet, setLineSheet] = useState(null) // line index with an open note sheet
  const [showActions, setShowActions] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [showKirtanNote, setShowKirtanNote] = useState(false)

  if (!kirtan) {
    return (
      <div className="pt-safe px-4">
        <div className="pt-16 text-center text-sm text-stone">
          <p>This kirtan no longer exists.</p>
          <button onClick={onBack} className="mt-2 underline">
            Back to library
          </button>
        </div>
      </div>
    )
  }

  const ann = state.annotations[id] || { note: '', lines: {} }
  const fav = state.favorites.includes(id)
  const title =
    script === 'gu' ? kirtan.title.gu || kirtan.title.en : kirtan.title.en || kirtan.title.gu
  const lines = toLines(kirtan.lyrics[script] || kirtan.lyrics.gu || kirtan.lyrics.en)
  const otherScriptMissing = !kirtan.lyrics[script]

  const share = async () => {
    setShowActions(false)
    const text = `${title}\n\n${(kirtan.lyrics[script] || kirtan.lyrics.gu || kirtan.lyrics.en || '')
      .replace(/^#+\s*/gm, '')
      .trim()}`
    if (navigator.share) {
      try {
        await navigator.share({ title, text })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Lyrics copied to clipboard.')
      } catch {}
    }
  }

  return (
    <article className="mx-auto max-w-2xl">
      {/* Pinned nav bar */}
      <div className="pt-safe sticky top-0 z-20 bg-marble/95 backdrop-blur">
        <div className="flex h-12 items-center px-1">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-saffron-deep active:bg-parchment"
          >
            <ChevronLeft size={26} sw={2} />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center font-gujarati text-[15px] font-medium">
            {title}
          </p>
          <button
            onClick={() => actions.toggleFavorite(id)}
            aria-label="Toggle favorite"
            className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-parchment ${
              fav ? 'text-madder' : 'text-stone'
            }`}
          >
            <Heart size={22} filled={fav} />
          </button>
          <button
            onClick={() => setShowActions(true)}
            aria-label="More actions"
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone active:bg-parchment"
          >
            <Ellipsis size={22} />
          </button>
        </div>
      </div>

      <div className="px-5">
        <header className="mt-3">
          <h2 className="font-display font-gujarati text-[26px] font-semibold leading-snug">
            {title}
          </h2>
          <p className="mt-1 text-sm text-stone">
            {script === 'gu' ? kirtan.title.en : kirtan.title.gu}
          </p>
          {(kirtan.categories || []).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {kirtan.categories.map((c) => (
                <span key={c} className="rounded-full bg-parchment px-2.5 py-1 text-[11px] text-stone">
                  {c}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Script flip — iOS-style segmented control */}
        <div className="mt-5 flex rounded-xl bg-parchment p-1 text-[15px]">
          <ScriptTab active={script === 'gu'} onClick={() => setScript('gu')}>
            ગુજરાતી
          </ScriptTab>
          <ScriptTab active={script === 'en'} onClick={() => setScript('en')}>
            English
          </ScriptTab>
        </div>

        {otherScriptMissing && (
          <p className="mt-3 text-xs text-madder">
            No {script === 'gu' ? 'Gujarati' : 'transliteration'} text yet — showing the other
            script. Add it via Edit.
          </p>
        )}

        {/* Lyrics: tap a line to highlight it, tap ✎ for a note.
            Annotations key off line index, shared across both scripts. */}
        <div
          className="mt-6 font-gujarati leading-loose"
          style={{ fontSize: `${1.125 * fontScale}rem` }}
        >
          {lines.map((l) =>
            l.type === 'break' ? (
              <div key={l.key} className="h-5" />
            ) : (
              <LyricLine
                key={l.key}
                line={l}
                annotation={ann.lines[l.index]}
                onToggleHighlight={() => actions.toggleHighlight(id, l.index)}
                onOpenNote={() => setLineSheet(l.index)}
              />
            )
          )}
        </div>

        {/* Kirtan-level note */}
        <section className="mb-6 mt-10 rounded-2xl border border-hairline bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-stone">
              Note on this kirtan
            </h3>
            <button
              onClick={() => setShowKirtanNote(true)}
              className="-my-1 flex min-h-[36px] items-center text-sm font-medium text-saffron-deep"
            >
              {ann.note ? 'Edit' : 'Add note'}
            </button>
          </div>
          {ann.note && (
            <p className="mt-1 whitespace-pre-wrap text-sm italic leading-relaxed text-madder">
              {ann.note}
            </p>
          )}
        </section>
      </div>

      {/* ⋯ action sheet */}
      <Sheet open={showActions} onClose={() => setShowActions(false)} title={title}>
        <SheetRow
          icon={<Music size={20} />}
          onClick={() => {
            setShowActions(false)
            setShowPlaylists(true)
          }}
        >
          Add to playlist
        </SheetRow>
        <SheetRow
          icon={<Pencil size={20} />}
          onClick={() => {
            setShowActions(false)
            onEdit()
          }}
        >
          Edit lyrics
        </SheetRow>
        <SheetRow icon={<ShareIcon size={20} />} onClick={share}>
          Share
        </SheetRow>
        <div className="mt-1 flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="text-base">Text size</span>
          <div className="ml-auto flex items-center gap-1 rounded-full border border-hairline bg-white">
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
        </div>
      </Sheet>

      {/* Playlist picker sheet */}
      <Sheet open={showPlaylists} onClose={() => setShowPlaylists(false)} title="Add to playlist">
        <PlaylistPicker state={state} actions={actions} kirtanId={id} />
      </Sheet>

      {/* Kirtan note sheet */}
      {showKirtanNote && (
        <NoteSheet
          title="Note on this kirtan"
          placeholder="Context, raag, occasion, meaning…"
          initial={ann.note}
          onDone={(text) => {
            actions.setKirtanNote(id, text)
            setShowKirtanNote(false)
          }}
        />
      )}

      {/* Line note sheet */}
      {lineSheet !== null && (
        <NoteSheet
          title="Note on this line"
          subtitle={lines.find((l) => l.index === lineSheet)?.text}
          placeholder="Meaning, pronunciation, reminder…"
          initial={ann.lines[lineSheet]?.note || ''}
          onDone={(text) => {
            actions.setLineNote(id, lineSheet, text)
            setLineSheet(null)
          }}
        />
      )}
    </article>
  )
}

function ScriptTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[40px] flex-1 select-none rounded-lg font-gujarati transition-all ${
        active ? 'bg-white font-medium text-ink shadow-sm' : 'text-stone'
      }`}
    >
      {children}
    </button>
  )
}

function LyricLine({ line, annotation, onToggleHighlight, onOpenNote }) {
  const highlighted = annotation?.highlight
  const note = annotation?.note

  return (
    <div className="-mx-2 px-2">
      <div className="flex items-baseline gap-1">
        <button
          onClick={onToggleHighlight}
          className={`min-w-0 flex-1 rounded py-0.5 text-left transition-colors ${
            highlighted ? 'haldi' : 'active:text-saffron-deep'
          }`}
        >
          {line.text}
        </button>
        <button
          onClick={onOpenNote}
          aria-label="Note on this line"
          className={`flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full font-ui active:bg-parchment ${
            note ? 'text-madder' : 'text-hairline'
          }`}
        >
          <Pencil size={15} />
        </button>
      </div>
      {note && (
        <p className="mb-1.5 border-l-2 border-saffron pl-3 font-ui text-[13px] italic leading-normal text-madder">
          {note}
        </p>
      )}
    </div>
  )
}

// Bottom-sheet note editor shared by line notes and the kirtan note.
// Closing the backdrop keeps edits (implicit save), matching native note apps.
function NoteSheet({ title, subtitle, placeholder, initial, onDone }) {
  const [text, setText] = useState(initial)
  return (
    <Sheet open onClose={() => onDone(text)} title={title}>
      {subtitle && (
        <p className="mb-2 truncate border-l-2 border-saffron pl-3 font-gujarati text-sm text-stone">
          {subtitle}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        autoFocus
        placeholder={placeholder}
        className="w-full rounded-xl border border-hairline bg-white p-3 text-base outline-none focus:border-saffron focus:ring-2 focus:ring-saffron-soft"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onDone(text)}
          className="min-h-[44px] flex-1 rounded-full bg-ink text-base font-medium text-marble active:bg-madder"
        >
          Done
        </button>
        {initial && (
          <button
            onClick={() => onDone('')}
            className="min-h-[44px] rounded-full border border-hairline bg-white px-5 text-base text-madder"
          >
            Delete
          </button>
        )}
      </div>
    </Sheet>
  )
}

function PlaylistPicker({ state, actions, kirtanId }) {
  const [newName, setNewName] = useState('')
  const create = () => {
    if (!newName.trim()) return
    const pid = actions.createPlaylist(newName.trim())
    actions.togglePlaylistItem(pid, kirtanId)
    setNewName('')
  }
  return (
    <div>
      {state.playlists.length === 0 && (
        <p className="px-3 py-2 text-sm text-stone">No playlists yet — create one below.</p>
      )}
      {state.playlists.map((p) => {
        const inList = p.kirtanIds.includes(kirtanId)
        return (
          <SheetRow
            key={p.id}
            onClick={() => actions.togglePlaylistItem(p.id, kirtanId)}
            trailing={
              inList ? (
                <Check size={20} className="text-saffron-deep" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-hairline" />
              )
            }
          >
            <span className="block truncate">{p.name}</span>
            <span className="block text-xs text-stone">{p.kirtanIds.length} kirtans</span>
          </SheetRow>
        )
      })}
      <div className="mt-2 flex gap-2 border-t border-hairline pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-full border border-hairline bg-white px-4 py-2.5 text-base outline-none focus:border-saffron"
        />
        <button
          onClick={create}
          className="min-h-[44px] shrink-0 rounded-full bg-ink px-5 text-base text-marble active:bg-madder"
        >
          Create
        </button>
      </div>
    </div>
  )
}
