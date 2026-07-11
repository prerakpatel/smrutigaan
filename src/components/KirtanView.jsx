import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toLines } from '../lib/text'
import Sheet, { SheetRow } from './Sheet'
import {
  ChevronLeft,
  Copy,
  Heart,
  Highlighter,
  Ellipsis,
  Maximize,
  Pause,
  Pencil,
  Play,
  Plus,
  ShareIcon,
  Check,
  Minus,
  Music,
  Trash,
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
  const [noteTarget, setNoteTarget] = useState(null) // {anchor, span?} being edited
  const [viewNote, setViewNote] = useState(null) // anchor index of a note being viewed
  const [showActions, setShowActions] = useState(false)
  const [showPlaylists, setShowPlaylists] = useState(false)
  const [showKirtanNote, setShowKirtanNote] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
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

  // The note covering a line: its own, or one anchored elsewhere whose span
  // includes it (multi-line notes).
  const noteAt = (idx) => {
    const own = ann.lines[idx]
    if (own?.note) return { anchor: idx, ...own }
    for (const [k, v] of Object.entries(ann.lines)) {
      if (v.note && v.span?.includes(idx)) return { anchor: +k, ...v }
    }
    return null
  }

  const toggleSelect = (idx) =>
    setSelected((s) => (s.includes(idx) ? s.filter((i) => i !== idx) : [...s, idx]))
  const clearSelection = () => setSelected([])
  const textOf = (indices) =>
    lines
      .filter((l) => l.type === 'line' && indices.includes(l.index))
      .map((l) => l.text)
      .join('\n')
  const allSelectedLit =
    selected.length > 0 && selected.every((i) => ann.lines[i]?.highlight)

  // Tap behavior: lines carrying a note open it directly (the pencil mark is
  // just the indicator); everything else toggles selection.
  const tapLine = (idx) => {
    const n = noteAt(idx)
    if (n && selected.length === 0) setViewNote(n.anchor)
    else toggleSelect(idx)
  }

  const viewedEntry = viewNote !== null ? ann.lines[viewNote] : null
  const viewedSpan = viewedEntry ? viewedEntry.span || [viewNote] : []
  const viewedLit = viewedSpan.length > 0 && viewedSpan.every((i) => ann.lines[i]?.highlight)

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
            onClick={() => setFocusMode(true)}
            aria-label="Focus view for singing"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface"
          >
            <Maximize size={20} />
          </button>
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
            below acts on it. Lines with a note open it directly.
            Annotations key off line index, shared across both scripts. */}
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
                onTap={() => tapLine(l.index)}
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
          onHighlight={() => {
            actions.setHighlights(id, selected, !allSelectedLit)
            clearSelection()
          }}
          onStanza={() =>
            setSelected((s) => [...new Set(s.flatMap((i) => stanzaOf(i)))])
          }
          onNote={() => {
            const sorted = [...selected].sort((a, b) => a - b)
            setNoteTarget({
              anchor: sorted[0],
              span: sorted.length > 1 ? sorted : undefined,
            })
            clearSelection()
          }}
          onCopy={() => {
            copyText(textOf(selected))
            clearSelection()
          }}
          onShare={() => {
            shareText(textOf(selected))
            clearSelection()
          }}
          onClear={clearSelection}
        />
      )}

      {/* Note viewer — opened by tapping a line that carries a note. Its
          actions live inside the sheet, so nothing useful hides beneath it. */}
      {viewNote !== null && viewedEntry && (
        <Sheet open onClose={() => setViewNote(null)} title="Note" expandable>
          <div className="border-l-2 border-accent pl-3">
            {lines
              .filter((l) => l.type === 'line' && viewedSpan.includes(l.index))
              .map((l) => (
                <p key={l.key} className="font-lyrics text-sm leading-relaxed text-muted">
                  {l.text}
                </p>
              ))}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-base italic leading-relaxed text-accent-bright">
            {viewedEntry.note}
          </p>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/30 bg-night/60 px-1.5 py-1">
            <BarBtn
              icon={<Pencil size={19} />}
              label="Edit"
              onClick={() => {
                setNoteTarget({ anchor: viewNote, span: viewedEntry.span })
                setViewNote(null)
              }}
            />
            <BarBtn
              icon={<Highlighter size={19} />}
              label={viewedLit ? 'Remove' : 'Highlight'}
              onClick={() => actions.setHighlights(id, viewedSpan, !viewedLit)}
              accent
            />
            <BarBtn
              icon={<ShareIcon size={19} />}
              label="Share"
              onClick={() =>
                shareText(`${textOf(viewedSpan)}\n\n— ${viewedEntry.note}`)
              }
            />
            <BarBtn
              icon={<Trash size={19} />}
              label="Delete"
              onClick={() => {
                actions.setLineNote(id, viewNote, '')
                setViewNote(null)
              }}
            />
          </div>
        </Sheet>
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

      {/* Line/selection note editor */}
      {noteTarget !== null && (
        <NoteSheet
          title={noteTarget.span ? `Note on ${noteTarget.span.length} lines` : 'Note on this line'}
          subtitle={textOf(noteTarget.span || [noteTarget.anchor])}
          placeholder="Meaning, pronunciation, reminder…"
          initial={ann.lines[noteTarget.anchor]?.note || ''}
          onDone={(text) => {
            actions.setLineNote(id, noteTarget.anchor, text, noteTarget.span)
            setNoteTarget(null)
          }}
        />
      )}

      {/* Focus view — full-screen sing mode */}
      {focusMode && (
        <FocusView
          title={title}
          lines={lines}
          ann={ann}
          fontScale={fontScale}
          noteAt={noteAt}
          onOpenNote={(anchor) => setViewNote(anchor)}
          onClose={() => setFocusMode(false)}
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
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/30 align-baseline">
            <Pencil size={12} className="text-accent-bright" />
          </span>
        )}
      </button>
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
        <div className="flex items-center justify-between rounded-2xl border border-accent/40 bg-gradient-to-r from-[#211441]/95 via-card/95 to-[#3a1030]/95 px-1.5 py-1 shadow-2xl shadow-accent/25 backdrop-blur-xl">
          <BarBtn
            icon={<Highlighter size={18} />}
            label={allLit ? 'Remove' : 'Highlight'}
            onClick={onHighlight}
            accent
          />
          <BarBtn icon={<Pencil size={19} />} label="Note" onClick={onNote} />
          <BarBtn icon={<Plus size={19} />} label="Stanza" onClick={onStanza} />
          <BarBtn icon={<Copy size={19} />} label="Copy" onClick={onCopy} />
          <BarBtn icon={<ShareIcon size={19} />} label="Share" onClick={onShare} />
          <span className="mx-0.5 h-7 w-px bg-white/15" />
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

function BarBtn({ icon, label, onClick, accent = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex min-w-[50px] select-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-snow transition-colors active:bg-white/10 disabled:opacity-30"
    >
      {accent ? (
        <span className="grad-brand -my-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white">
          {icon}
        </span>
      ) : (
        icon
      )}
      <span className="text-[9.5px] leading-none text-snow/60">{label}</span>
    </button>
  )
}

// Full-screen "sing" view: nothing but the lyrics, bigger and bolder, over a
// frosted wash. Highlights can be toggled; noted lines stay tappable. Rendered
// through a portal so the tab bar and mini player can't paint over it, and the
// screen is kept awake while it's open (Wake Lock).
function FocusView({ title, lines, ann, fontScale, noteAt, onOpenNote, onClose }) {
  const [showHl, setShowHl] = useState(true)

  useEffect(() => {
    let lock = null
    const request = () =>
      navigator.wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {})
    request()
    const onVis = () => document.visibilityState === 'visible' && request()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])

  return createPortal(
    <div className="animate-fade-in fixed inset-0 z-[65] flex flex-col bg-night/80 backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45dvh] bg-gradient-to-b from-accent/25 via-fuchsia-500/[0.06] to-transparent" />

      <div className="pt-safe relative">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-3">
          <p className="min-w-0 flex-1 truncate pl-1 font-lyrics text-[15px] font-semibold text-snow/80">
            {title}
          </p>
          <button
            onClick={() => setShowHl((h) => !h)}
            aria-label={showHl ? 'Hide highlights' : 'Show highlights'}
            aria-pressed={showHl}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              showHl ? 'text-accent-bright' : 'text-muted'
            }`}
          >
            <Highlighter size={21} />
          </button>
          <button
            onClick={onClose}
            aria-label="Exit focus view"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-snow active:bg-white/20"
          >
            <X size={20} sw={2} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto overscroll-contain">
        <div
          className="mx-auto max-w-2xl px-6 pb-[max(env(safe-area-inset-bottom),4rem)] pt-4 font-lyrics font-bold leading-[1.7] tracking-tight"
          style={{ fontSize: `${1.5 * fontScale}rem` }}
        >
          {lines.map((l) => {
            if (l.type === 'break') return <div key={l.key} className="h-8" />
            const a = ann.lines[l.index]
            const n = noteAt(l.index)
            return (
              <button
                key={l.key}
                onClick={() => n && onOpenNote(n.anchor)}
                className={`-mx-2 block w-[calc(100%+16px)] select-none rounded-md px-2 py-1 text-left ${
                  showHl && a?.highlight ? 'glow' : 'text-snow'
                }`}
              >
                {l.text}
                {a?.note && (
                  <span className="ml-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/30 align-baseline">
                    <Pencil size={13} className="text-accent-bright" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

// Bottom-sheet note editor shared by line notes and the kirtan note.
// Closing the backdrop keeps edits (implicit save), matching native note apps.
function NoteSheet({ title, subtitle, placeholder, initial, onDone }) {
  const [text, setText] = useState(initial)
  return (
    <Sheet open onClose={() => onDone(text)} title={title} expandable>
      {subtitle && (
        <div className="mb-2 max-h-24 overflow-y-auto border-l-2 border-accent pl-3">
          <p className="whitespace-pre-wrap font-lyrics text-sm leading-relaxed text-muted">
            {subtitle}
          </p>
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        autoFocus
        placeholder={placeholder}
        className="min-h-28 w-full rounded-xl bg-card p-3 text-base outline-none focus:ring-2 focus:ring-accent/70"
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
