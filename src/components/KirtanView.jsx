import { useEffect, useState } from 'react'
import { toLines } from '../lib/text'
import Sheet, { SheetRow } from './Sheet'
import {
  ChevronLeft,
  Copy,
  Heart,
  Highlighter,
  Ellipsis,
  Pause,
  Pencil,
  Play,
  Plus,
  ShareIcon,
  Check,
  Minus,
  Music,
  X,
} from './icons'

export default function KirtanView({
  state,
  actions,
  id,
  initialLine,
  script,
  setScript,
  fontScale,
  setFontScale,
  player,
  onEdit,
  onBack,
}) {
  const kirtan = state.kirtans.find((k) => k.id === id)
  // Our own selection model — native text selection stays off, so iOS's
  // Copy/Look Up callout never appears and never fights our toolbar.
  const [selected, setSelected] = useState([]) // lyric-line indices
  const [lineSheet, setLineSheet] = useState(null) // line index with an open note sheet
  const [showActions, setShowActions] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [showKirtanNote, setShowKirtanNote] = useState(false)
  // Arriving from a search result: scroll to the matched line and flash it.
  const [flashLine, setFlashLine] = useState(initialLine ?? null)
  useEffect(() => {
    if (initialLine == null) return
    const scroll = setTimeout(() => {
      document
        .getElementById(`kline-${id}-${initialLine}`)
        ?.scrollIntoView({ block: 'center' })
    }, 90) // let the page-in slide start first
    const clear = setTimeout(() => setFlashLine(null), 2600)
    return () => {
      clearTimeout(scroll)
      clearTimeout(clear)
    }
  }, [initialLine, id])

  if (!kirtan) {
    return (
      <div className="pt-safe px-4">
        <div className="pt-16 text-center text-sm text-muted">
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

  const plainLyrics = `${title}\n\n${(
    kirtan.lyrics[script] ||
    kirtan.lyrics.gu ||
    kirtan.lyrics.en ||
    ''
  )
    .replace(/^#+\s*/gm, '')
    .trim()}`
  const highlightedText = () =>
    `${title}\n\n${lines
      .filter((l) => l.type === 'line' && ann.lines[l.index]?.highlight)
      .map((l) => l.text)
      .join('\n')}`
  const hasHighlights = lines.some((l) => l.type === 'line' && ann.lines[l.index]?.highlight)

  const shareText = async (text) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text })
      } catch {}
    } else {
      await copyText(text)
    }
  }
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard.')
    } catch {}
  }

  // All lyric-line indices in the stanza containing `idx` (bounded by blank
  // lines) — powers select-the-whole-antara.
  const stanzaOf = (idx) => {
    const pos = lines.findIndex((l) => l.type === 'line' && l.index === idx)
    if (pos === -1) return [idx]
    let s = pos
    while (s > 0 && lines[s - 1].type === 'line') s--
    let e = pos
    while (e < lines.length - 1 && lines[e + 1].type === 'line') e++
    return lines.slice(s, e + 1).map((l) => l.index)
  }

  const toggleSelect = (idx) =>
    setSelected((s) => (s.includes(idx) ? s.filter((i) => i !== idx) : [...s, idx]))
  const clearSelection = () => setSelected([])
  const selectedText = () =>
    lines
      .filter((l) => l.type === 'line' && selected.includes(l.index))
      .map((l) => l.text)
      .join('\n')
  const allSelectedLit =
    selected.length > 0 && selected.every((i) => ann.lines[i]?.highlight)

  return (
    <article className="relative mx-auto max-w-2xl">
      {/* Hero wash — a soft gradient bleeding down from the top, album-page style */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent/25 via-fuchsia-500/[0.07] to-transparent" />

      {/* Pinned nav bar */}
      <div className="pt-safe sticky top-0 z-20 bg-night/85 backdrop-blur-xl">
        <div className="flex h-12 items-center px-1">
          <button
            onClick={onBack}
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-snow active:bg-surface"
          >
            <ChevronLeft size={26} sw={2} />
          </button>
          <p className="min-w-0 flex-1 truncate px-1 text-center font-lyrics text-[15px] font-medium">
            {title}
          </p>
          <button
            onClick={() => actions.toggleFavorite(id)}
            aria-label="Toggle favorite"
            className={`flex h-11 w-11 items-center justify-center rounded-full active:bg-surface ${
              fav ? 'text-punch' : 'text-muted'
            }`}
          >
            <Heart size={22} filled={fav} />
          </button>
          <button
            onClick={() => setShowActions(true)}
            aria-label="More actions"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface"
          >
            <Ellipsis size={22} />
          </button>
        </div>
      </div>

      <div className="px-5">
        <header className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-lyrics text-[30px] font-extrabold leading-tight tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-sm font-medium text-snow/60">
              {script === 'gu' ? kirtan.title.en : kirtan.title.gu}
            </p>
            {(kirtan.categories || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {kirtan.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-snow/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          {kirtan.audio && (
            <button
              onClick={() => player.playKirtan(id)}
              aria-label={
                player.current === id && player.playing ? 'Pause audio' : 'Play audio'
              }
              className="grad-brand mb-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg shadow-fuchsia-500/30 transition-transform active:scale-95"
            >
              {player.current === id && player.playing ? (
                <Pause size={24} />
              ) : (
                <Play size={24} className="ml-0.5" />
              )}
            </button>
          )}
        </header>

        {/* Script flip — segmented control */}
        <div className="mt-5 flex rounded-full bg-surface p-1 text-[15px]">
          <ScriptTab active={script === 'gu'} onClick={() => setScript('gu')}>
            ગુજરાતી
          </ScriptTab>
          <ScriptTab active={script === 'en'} onClick={() => setScript('en')}>
            English
          </ScriptTab>
        </div>

        {otherScriptMissing && (
          <p className="mt-3 text-xs text-punch">
            No {script === 'gu' ? 'Gujarati' : 'transliteration'} text yet — showing the other
            script. Add it via Edit.
          </p>
        )}

        {Object.keys(ann.lines).length === 0 && selected.length === 0 && (
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Tap a line to select it — then highlight, add a note, copy or share.
          </p>
        )}

        {/* Lyrics: tap lines to build a selection; the floating toolbar
            below acts on it. Annotations key off line index, shared
            across both scripts. */}
        <div
          className="mt-7 font-lyrics font-semibold leading-[1.75]"
          style={{ fontSize: `${1.25 * fontScale}rem` }}
        >
          {lines.map((l) =>
            l.type === 'break' ? (
              <div key={l.key} className="h-5" />
            ) : (
              <LyricLine
                key={l.key}
                line={l}
                domId={`kline-${id}-${l.index}`}
                flash={flashLine === l.index}
                selected={selected.includes(l.index)}
                annotation={ann.lines[l.index]}
                onTap={() => toggleSelect(l.index)}
              />
            )
          )}
        </div>

        {/* Kirtan-level note */}
        <section className="mb-6 mt-10 rounded-2xl border border-white/5 bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted">
              Note on this kirtan
            </h3>
            <button
              onClick={() => setShowKirtanNote(true)}
              className="-my-1 flex min-h-[36px] items-center text-sm font-medium text-accent-bright"
            >
              {ann.note ? 'Edit' : 'Add note'}
            </button>
          </div>
          {ann.note && (
            <p className="mt-1 whitespace-pre-wrap text-sm italic leading-relaxed text-accent-bright">
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
        <SheetRow
          icon={<ShareIcon size={20} />}
          onClick={() => {
            setShowActions(false)
            shareText(plainLyrics)
          }}
        >
          Share
        </SheetRow>
        <SheetRow
          icon={<Copy size={20} />}
          onClick={() => {
            setShowActions(false)
            copyText(plainLyrics)
          }}
        >
          Copy lyrics
        </SheetRow>
        {hasHighlights && (
          <SheetRow
            icon={<Highlighter size={20} />}
            onClick={() => {
              setShowActions(false)
              shareText(highlightedText())
            }}
          >
            Share highlighted lines
          </SheetRow>
        )}
        <div className="mt-1 flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="text-base">Text size</span>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-card">
            <button
              onClick={() => setFontScale(Math.max(0.85, +(fontScale - 0.125).toFixed(3)))}
              aria-label="Smaller text"
              className="flex h-10 w-12 items-center justify-center rounded-l-full active:bg-surface"
            >
              <Minus size={18} />
            </button>
            <span className="w-10 text-center text-sm text-muted">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              onClick={() => setFontScale(Math.min(1.6, +(fontScale + 0.125).toFixed(3)))}
              aria-label="Larger text"
              className="flex h-10 w-12 items-center justify-center rounded-r-full active:bg-surface"
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

      {/* Floating selection toolbar — appears when any lines are selected,
          docked above the tab bar (and above the mini player when active),
          well clear of the text it acts on. */}
      {selected.length > 0 && (
        <SelectionBar
          lifted={!!player.current && !player.expanded}
          count={selected.length}
          allLit={allSelectedLit}
          canNote={selected.length === 1}
          hasNote={selected.length === 1 && !!ann.lines[selected[0]]?.note}
          onHighlight={() => {
            actions.setHighlights(id, selected, !allSelectedLit)
            clearSelection()
          }}
          onStanza={() =>
            setSelected((s) => [...new Set(s.flatMap((i) => stanzaOf(i)))])
          }
          onNote={() => {
            setLineSheet(selected[0])
            clearSelection()
          }}
          onCopy={() => {
            copyText(selectedText())
            clearSelection()
          }}
          onShare={() => {
            shareText(selectedText())
            clearSelection()
          }}
          onClear={clearSelection}
        />
      )}

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
      className={`min-h-[40px] flex-1 select-none rounded-full font-lyrics transition-all ${
        active ? 'bg-snow font-semibold text-night' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

function LyricLine({ line, domId, flash, selected, annotation, onTap }) {
  const highlighted = annotation?.highlight
  const note = annotation?.note

  return (
    <div id={domId} className={`-mx-2 px-2 ${flash ? 'search-flash' : ''}`}>
      <button
        onClick={onTap}
        className={`-ml-2 w-full select-none rounded-md py-0.5 pl-2 pr-1 text-left transition-all ${
          highlighted ? 'glow' : 'text-snow/90'
        } ${selected ? 'bg-white/10 ring-1 ring-inset ring-snow/30' : ''}`}
      >
        {line.text}
        {note && (
          <Pencil size={13} className="ml-2 inline-block align-baseline text-accent-bright" />
        )}
      </button>
      {note && (
        <p className="mb-1.5 border-l-2 border-accent pl-3 font-ui text-[13px] font-normal italic leading-normal text-accent-bright">
          {note}
        </p>
      )}
    </div>
  )
}

// Compact contextual toolbar for the current line selection. Deliberately not
// a bottom sheet: it doesn't cover the lyrics, and because selection is our
// own (not the browser's), no system text menu ever competes with it.
function SelectionBar({
  lifted,
  count,
  allLit,
  canNote,
  hasNote,
  onHighlight,
  onStanza,
  onNote,
  onCopy,
  onShare,
  onClear,
}) {
  return (
    <div
      className={`fixed inset-x-0 z-40 ${
        lifted
          ? 'bottom-[calc(130px+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(64px+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <div className="animate-sheet-up mx-auto max-w-2xl px-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-card/95 px-1.5 py-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <BarBtn
            icon={<Highlighter size={19} />}
            label={allLit ? 'Remove' : 'Highlight'}
            onClick={onHighlight}
          />
          <BarBtn
            icon={<Pencil size={19} />}
            label={hasNote ? 'Edit note' : 'Note'}
            onClick={onNote}
            disabled={!canNote}
          />
          <BarBtn icon={<Plus size={19} />} label="Stanza" onClick={onStanza} />
          <BarBtn icon={<Copy size={19} />} label="Copy" onClick={onCopy} />
          <BarBtn icon={<ShareIcon size={19} />} label="Share" onClick={onShare} />
          <span className="mx-0.5 h-7 w-px bg-white/10" />
          <BarBtn
            icon={<X size={19} />}
            label={count === 1 ? '1 line' : `${count} lines`}
            onClick={onClear}
          />
        </div>
      </div>
    </div>
  )
}

function BarBtn({ icon, label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-[50px] select-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-snow transition-colors active:bg-white/10 disabled:opacity-30"
    >
      {icon}
      <span className="text-[9.5px] leading-none text-muted">{label}</span>
    </button>
  )
}

// Bottom-sheet note editor shared by line notes and the kirtan note.
// Closing the backdrop keeps edits (implicit save), matching native note apps.
function NoteSheet({ title, subtitle, placeholder, initial, onDone }) {
  const [text, setText] = useState(initial)
  return (
    <Sheet open onClose={() => onDone(text)} title={title}>
      {subtitle && (
        <p className="mb-2 truncate border-l-2 border-accent pl-3 font-lyrics text-sm text-muted">
          {subtitle}
        </p>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        autoFocus
        placeholder={placeholder}
        className="w-full rounded-xl bg-card p-3 text-base outline-none focus:ring-2 focus:ring-accent/70"
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onDone(text)}
          className="min-h-[44px] flex-1 rounded-full bg-snow text-base font-semibold text-night active:opacity-80"
        >
          Done
        </button>
        {initial && (
          <button
            onClick={() => onDone('')}
            className="min-h-[44px] rounded-full bg-punch/10 px-5 text-base font-medium text-punch active:bg-punch/20"
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
        <p className="px-3 py-2 text-sm text-muted">No playlists yet — create one below.</p>
      )}
      {state.playlists.map((p) => {
        const inList = p.kirtanIds.includes(kirtanId)
        return (
          <SheetRow
            key={p.id}
            onClick={() => actions.togglePlaylistItem(p.id, kirtanId)}
            trailing={
              inList ? (
                <Check size={20} className="text-accent-bright" />
              ) : (
                <span className="h-5 w-5 rounded-full border border-line" />
              )
            }
          >
            <span className="block truncate">{p.name}</span>
            <span className="block text-xs text-muted">{p.kirtanIds.length} kirtans</span>
          </SheetRow>
        )
      })}
      <div className="mt-2 flex gap-2 border-t border-line pt-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-full bg-card px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-accent/70"
        />
        <button
          onClick={create}
          className="min-h-[44px] shrink-0 rounded-full bg-snow px-5 text-base font-semibold text-night active:opacity-80"
        >
          Create
        </button>
      </div>
    </div>
  )
}
