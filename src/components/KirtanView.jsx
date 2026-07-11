import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toLines } from '../lib/text'
import { useScrolledPast } from '../lib/useScrolled'
import Sheet, { SheetRow } from './Sheet'
import {
  Bookmark,
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
  canEdit = false,
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
  // Top bar is transparent over the hero gradient until the header scrolls away.
  const [sentinelRef, scrolled] = useScrolledPast()
  // One-time-per-session hint, flashed as a toast at the bottom instead of
  // occupying a permanent line in every kirtan.
  const [showHint, setShowHint] = useState(false)
  useEffect(() => {
    if (sessionStorage.getItem('smruti-gaan:line-hint')) return
    // flag inside the timeout, not at mount — StrictMode's throwaway first
    // mount would otherwise consume the one-per-session slot
    const show = setTimeout(() => {
      sessionStorage.setItem('smruti-gaan:line-hint', '1')
      setShowHint(true)
    }, 700)
    const hide = setTimeout(() => setShowHint(false), 6200)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [])
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
  const textOf = (indices) =>
    lines
      .filter((l) => l.type === 'line' && indices.includes(l.index))
      .map((l) => l.text)
      .join('\n')
  const allSelectedLit =
    selected.length > 0 && selected.every((i) => ann.lines[i]?.highlight)

  // Every line covered by some note (anchor or span) gets a dotted underline.
  const notedLines = new Set()
  Object.entries(ann.lines).forEach(([i, v]) => {
    if (v.note) (v.span || [+i]).forEach((x) => notedLines.add(x))
  })

  const viewedEntry = viewNote !== null ? ann.lines[viewNote] : null
  const viewedSpan = viewedEntry ? viewedEntry.span || [viewNote] : []
  const viewedLit = viewedSpan.length > 0 && viewedSpan.every((i) => ann.lines[i]?.highlight)

  return (
    <article className="relative mx-auto max-w-2xl">
      {/* Hero wash — flows under the (initially transparent) top bar, so the
          gradient owns the whole top of the page with no seam */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-accent/25 via-fuchsia-500/[0.07] to-transparent" />

      {/* scroll sentinel: once this leaves the viewport, the bar solidifies */}
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-10 w-px" />

      {/* Pinned nav bar — transparent at rest, blurred once scrolled */}
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
            className={`min-w-0 flex-1 truncate px-1 text-center font-lyrics text-[15px] font-medium transition-opacity duration-300 ${
              scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          >
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
            <h2 className="font-lyrics text-[30px] font-bold leading-tight tracking-tight">
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
                    className="rounded-full bg-veil/10 px-2.5 py-1 text-[11px] font-medium text-snow/80"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
            {/* Root kirtan note, surfaced where you'll actually see it */}
            {ann.note && (
              <button
                onClick={() => setShowKirtanNote(true)}
                className="mt-3 flex w-full items-start gap-2 rounded-xl bg-accent-soft/80 px-3 py-2 text-left active:opacity-80"
              >
                <Bookmark size={14} className="mt-0.5 shrink-0 text-accent-bright" />
                <span className="line-clamp-2 min-w-0 text-[13px] italic leading-snug text-accent-bright">
                  {ann.note}
                </span>
              </button>
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

        {otherScriptMissing && (
          <p className="mt-3 text-xs text-punch">
            No {script === 'gu' ? 'Gujarati' : 'transliteration'} text yet — showing the other
            script. Add it via Edit.
          </p>
        )}

        {/* Lyrics: tapping a line only ever selects it (the floating toolbar
            acts on the selection); a line's note opens via its pencil chip.
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
                noted={notedLines.has(l.index)}
                annotation={ann.lines[l.index]}
                onTap={() => toggleSelect(l.index)}
                onOpenNote={() => setViewNote(l.index)}
              />
            )
          )}
        </div>

        <div className="h-8" />
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
          icon={<Bookmark size={20} />}
          onClick={() => {
            setShowActions(false)
            setShowKirtanNote(true)
          }}
        >
          {ann.note ? 'Edit kirtan note' : 'Add kirtan note'}
        </SheetRow>
        {canEdit && (
          <SheetRow
            icon={<Pencil size={20} />}
            onClick={() => {
              setShowActions(false)
              onEdit()
            }}
          >
            Edit lyrics
          </SheetRow>
        )}
        <div className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5">
          <span className="text-base">Script</span>
          <div className="ml-auto flex rounded-full bg-card p-0.5 text-sm">
            <ScriptSeg active={script === 'gu'} onClick={() => setScript('gu')}>
              ગુજરાતી
            </ScriptSeg>
            <ScriptSeg active={script === 'en'} onClick={() => setScript('en')}>
              English
            </ScriptSeg>
          </div>
        </div>
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

      {/* Once-per-session hint toast — rises from the bottom, fades away */}
      <div
        aria-hidden={!showHint}
        className={`pointer-events-none fixed inset-x-0 bottom-[calc(18px+env(safe-area-inset-bottom,0px))] z-30 flex justify-center px-6 transition-all duration-500 ease-out ${
          showHint && selected.length === 0
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="rounded-full border border-veil/10 bg-card/95 px-4 py-2.5 text-center text-[12.5px] leading-snug text-muted shadow-xl backdrop-blur-xl">
          Tap a line to select it — then highlight, note, copy or share.
        </p>
      </div>

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
          {(full) => (
            <>
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
          {/* pinned to the bottom edge when the sheet is expanded */}
          <div
            className={`flex items-center justify-between rounded-2xl border border-accent/30 bg-night/60 px-1.5 py-1 ${
              full ? 'mt-auto' : 'mt-4'
            }`}
          >
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
            </>
          )}
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
          notedLines={notedLines}
          fontScale={fontScale}
          onOpenNote={(anchor) => setViewNote(anchor)}
          onClose={() => setFocusMode(false)}
        />
      )}
    </article>
  )
}

function ScriptSeg({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`min-h-[36px] select-none rounded-full px-3.5 font-lyrics transition-all ${
        active ? 'bg-snow font-semibold text-night' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}

// The line itself only ever toggles selection; the pencil chip (its own
// button, its own hit area) is the sole way in to the note — so note taps
// can't spill onto neighboring lines.
function LyricLine({ line, domId, flash, selected, noted, annotation, onTap, onOpenNote }) {
  const highlighted = annotation?.highlight
  const note = annotation?.note

  return (
    <div id={domId} className={`-mx-2 flex items-start gap-1 px-2 ${flash ? 'search-flash' : ''}`}>
      <button
        onClick={onTap}
        className={`-ml-2 min-w-0 flex-1 select-none rounded-md py-0.5 pl-2 text-left transition-all ${
          highlighted ? 'glow' : 'text-snow/90'
        } ${selected ? 'bg-veil/10 ring-1 ring-inset ring-snow/30' : ''} ${
          noted
            ? 'underline decoration-accent-bright/60 decoration-dotted decoration-2 underline-offset-[7px]'
            : ''
        }`}
      >
        {line.text}
      </button>
      {note && (
        <button
          onClick={onOpenNote}
          aria-label="View note on this line"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center self-start"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/30">
            <Pencil size={13} className="text-accent-bright" />
          </span>
        </button>
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
          ? 'bottom-[calc(80px+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(14px+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <div className="animate-sheet-up mx-auto max-w-2xl px-3">
        <div className="flex items-center justify-between rounded-2xl border border-accent/40 bg-card/95 bg-gradient-to-r from-accent/20 via-transparent to-fuchsia-500/15 px-1.5 py-1 shadow-2xl shadow-accent/25 backdrop-blur-xl">
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
          <span className="mx-0.5 h-7 w-px bg-veil/15" />
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
      className="flex min-w-[50px] select-none flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-snow transition-colors active:bg-veil/10 disabled:opacity-30"
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
function FocusView({ title, lines, ann, notedLines, fontScale, onOpenNote, onClose }) {
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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-veil/10 text-snow active:bg-veil/20"
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
            return (
              <p
                key={l.key}
                className={`-mx-2 select-none rounded-md px-2 py-1 ${
                  showHl && a?.highlight ? 'glow' : 'text-snow'
                } ${
                  notedLines.has(l.index)
                    ? 'underline decoration-accent-bright/60 decoration-dotted decoration-2 underline-offset-8'
                    : ''
                }`}
              >
                {l.text}
                {a?.note && (
                  <button
                    onClick={() => onOpenNote(l.index)}
                    aria-label="View note on this line"
                    className="ml-2.5 inline-flex h-8 w-8 items-center justify-center align-baseline"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/30">
                      <Pencil size={13} className="text-accent-bright" />
                    </span>
                  </button>
                )}
              </p>
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
      {(full) => (
        <>
          {subtitle && (
            <div className="mb-2 max-h-24 shrink-0 overflow-y-auto border-l-2 border-accent pl-3">
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
            className={`min-h-28 w-full rounded-xl bg-card p-3 text-base outline-none focus:ring-2 focus:ring-accent/70 ${
              full ? 'flex-1 resize-none' : ''
            }`}
          />
          <div className="mt-3 flex shrink-0 gap-2">
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
        </>
      )}
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
