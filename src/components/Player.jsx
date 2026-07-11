import { useEffect, useRef, useState } from 'react'
import { getAudio } from '../lib/audioStore'
import { ChevronDown, Music, Pause, Play, SkipBack, SkipForward, X } from './icons'

// One <audio> element for the whole app, owned here and never unmounted, so
// playback survives any navigation — backing out of a kirtan, searching,
// switching tabs. Components subscribe to its events for progress instead of
// mirroring currentTime into app-level state (which would re-render the whole
// tree several times a second).
export function usePlayer(kirtans) {
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null) // blob URL to revoke when the track changes
  const [current, setCurrent] = useState(null) // kirtan id
  const [queue, setQueue] = useState([])
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const ensureAudio = () => {
    if (!audioRef.current) audioRef.current = new Audio()
    return audioRef.current
  }

  const nowPlaying = current ? kirtans.find((k) => k.id === current) : null

  const load = async (id, autoplay = true) => {
    const k = kirtans.find((k) => k.id === id)
    if (!k?.audio) return
    const a = ensureAudio()
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    let src = k.audio.url || ''
    if (k.audio.blobId) {
      try {
        const blob = await getAudio(k.audio.blobId)
        if (!blob) return
        src = URL.createObjectURL(blob)
        objectUrlRef.current = src
      } catch {
        return
      }
    }
    a.src = src
    setCurrent(id)
    if (autoplay) a.play().catch(() => {})
  }

  // mirror the element's play/pause state into React
  useEffect(() => {
    const a = ensureAudio()
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    return () => {
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
    }
  }, [])

  // auto-advance through the queue; re-bound so it sees the fresh queue
  useEffect(() => {
    const a = ensureAudio()
    const onEnded = () => {
      const i = queue.indexOf(current)
      if (i >= 0 && i < queue.length - 1) load(queue[i + 1])
    }
    a.addEventListener('ended', onEnded)
    return () => a.removeEventListener('ended', onEnded)
  }, [queue, current, kirtans])

  const api = {
    audioEl: ensureAudio,
    current,
    nowPlaying,
    queue,
    playing,
    expanded,
    setExpanded,
    // Tap play on the kirtan that's already loaded → toggle; otherwise start
    // it, with an optional queue for playlist playback.
    playKirtan(id, queueIds) {
      if (id === current) {
        api.toggle()
        return
      }
      setQueue(queueIds && queueIds.length ? queueIds : [id])
      load(id)
    },
    toggle() {
      const a = ensureAudio()
      if (!a.src) return
      if (a.paused) a.play().catch(() => {})
      else a.pause()
    },
    hasNext: queue.indexOf(current) >= 0 && queue.indexOf(current) < queue.length - 1,
    hasPrev: queue.indexOf(current) > 0,
    next() {
      const i = queue.indexOf(current)
      if (i >= 0 && i < queue.length - 1) load(queue[i + 1])
    },
    // Native player convention: prev restarts the track unless tapped within
    // the first seconds, in which case it goes to the previous one.
    prev() {
      const a = ensureAudio()
      const i = queue.indexOf(current)
      if (a.currentTime > 3 || i <= 0) a.currentTime = 0
      else load(queue[i - 1])
    },
    seek(t) {
      ensureAudio().currentTime = t
    },
    close() {
      const a = ensureAudio()
      a.pause()
      a.removeAttribute('src')
      a.load()
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      setCurrent(null)
      setQueue([])
      setExpanded(false)
      setPlaying(false)
    },
  }

  // Lock-screen / headphone / car controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    if (!nowPlaying) {
      navigator.mediaSession.metadata = null
      return
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying.title.gu || nowPlaying.title.en || 'Kirtan',
      artist: nowPlaying.title.en || 'Smruti Gaan',
      album: 'Smruti Gaan',
    })
    const set = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {}
    }
    set('play', () => api.toggle())
    set('pause', () => api.toggle())
    set('previoustrack', () => api.prev())
    set('nexttrack', () => api.next())
    set('seekto', (e) => api.seek(e.seekTime))
  }, [current, queue, kirtans])

  return api
}

// Progress subscription local to whichever player UI is mounted.
function useProgress(player) {
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  useEffect(() => {
    const a = player.audioEl()
    const onTime = () => setTime(a.currentTime || 0)
    const onDur = () => setDur(isFinite(a.duration) ? a.duration : 0)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('durationchange', onDur)
    a.addEventListener('loadedmetadata', onDur)
    onTime()
    onDur()
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('durationchange', onDur)
      a.removeEventListener('loadedmetadata', onDur)
    }
  }, [player.current])
  return { time, dur }
}

const fmt = (s) => {
  if (!isFinite(s) || s <= 0) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function titles(k, script) {
  const main = script === 'gu' ? k.title.gu || k.title.en : k.title.en || k.title.gu
  const sub = script === 'gu' ? k.title.en : k.title.gu
  return { main, sub }
}

// Docked above the tab bar on root screens; hugs the bottom edge on detail
// pages where the tab bar is hidden. Tap to expand into the full player.
export function MiniPlayer({ player, script, docked = true }) {
  const k = player.nowPlaying
  const { time, dur } = useProgress(player)
  if (!k) return null
  const { main, sub } = titles(k, script)
  const pct = dur ? Math.min(100, (time / dur) * 100) : 0

  return (
    <div
      className={`fixed inset-x-0 z-40 ${
        docked
          ? 'bottom-[calc(60px+env(safe-area-inset-bottom,0px))]'
          : 'bottom-[calc(10px+env(safe-area-inset-bottom,0px))]'
      }`}
    >
      <div className="mx-auto max-w-2xl px-2">
        <div className="relative overflow-hidden rounded-xl border border-veil/10 bg-card/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex items-center pr-1">
            <button
              onClick={() => player.setExpanded(true)}
              className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
            >
              <span className="grad-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white">
                {player.playing ? <Equalizer /> : <Music size={18} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-lyrics text-sm font-semibold">{main}</span>
                <span className="block truncate text-[11px] text-muted">{sub}</span>
              </span>
            </button>
            <button
              onClick={player.toggle}
              aria-label={player.playing ? 'Pause' : 'Play'}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-snow"
            >
              {player.playing ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button
              onClick={player.close}
              aria-label="Close player"
              className="flex h-11 w-8 shrink-0 items-center justify-center text-muted active:text-snow"
            >
              <X size={16} sw={2} />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-veil/10">
            <div className="h-full bg-accent-bright" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Full-screen Now Playing.
export function FullPlayer({ player, script, onOpenLyrics }) {
  const k = player.nowPlaying
  const { time, dur } = useProgress(player)
  if (!k) return null
  const { main, sub } = titles(k, script)
  const pct = dur ? Math.min(100, (time / dur) * 100) : 0

  return (
    <div className="animate-sheet-up fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-night">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55dvh] bg-gradient-to-b from-accent/30 via-fuchsia-500/10 to-transparent" />

      <div className="pt-safe relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-6">
        <div className="flex h-14 items-center justify-between">
          <button
            onClick={() => player.setExpanded(false)}
            aria-label="Minimize player"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-snow active:bg-veil/10"
          >
            <ChevronDown size={26} sw={2} />
          </button>
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-snow/70">
            Now playing
          </span>
          <span className="w-9" />
        </div>

        <div className="flex min-h-56 flex-1 items-center justify-center py-6">
          <div
            className={`grad-brand flex aspect-square w-3/5 max-w-64 items-center justify-center rounded-[2rem] text-white shadow-2xl shadow-fuchsia-500/30 transition-transform duration-500 ${
              player.playing ? 'scale-100' : 'scale-90'
            }`}
          >
            <Music size={88} sw={1.1} />
          </div>
        </div>

        <div className="pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <p className="truncate font-lyrics text-2xl font-extrabold tracking-tight">{main}</p>
          <p className="mt-1 truncate text-sm font-medium text-snow/60">{sub}</p>

          <input
            type="range"
            min={0}
            max={dur || 0}
            step={0.1}
            value={Math.min(time, dur || 0)}
            onChange={(e) => player.seek(+e.target.value)}
            aria-label="Seek"
            className="player-range mt-5 w-full"
            style={{
              background: `linear-gradient(to right, #A78BFA ${pct}%, rgba(255,255,255,0.15) ${pct}%)`,
            }}
          />
          <div className="mt-1.5 flex justify-between text-[11px] font-medium text-snow/50">
            <span>{fmt(time)}</span>
            <span>{fmt(dur)}</span>
          </div>

          <div className="mt-3 flex items-center justify-center gap-8">
            <button
              onClick={player.prev}
              aria-label="Previous"
              className="flex h-12 w-12 items-center justify-center text-snow active:scale-95"
            >
              <SkipBack size={30} />
            </button>
            <button
              onClick={player.toggle}
              aria-label={player.playing ? 'Pause' : 'Play'}
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-snow text-night shadow-xl transition-transform active:scale-95"
            >
              {player.playing ? <Pause size={30} /> : <Play size={30} className="ml-1" />}
            </button>
            <button
              onClick={player.next}
              aria-label="Next"
              className={`flex h-12 w-12 items-center justify-center active:scale-95 ${
                player.hasNext ? 'text-snow' : 'text-snow/30'
              }`}
            >
              <SkipForward size={30} />
            </button>
          </div>

          <button
            onClick={() => {
              player.setExpanded(false)
              onOpenLyrics(k.id)
            }}
            className="mx-auto mt-5 flex min-h-[40px] items-center justify-center rounded-full bg-veil/10 px-5 text-sm font-medium text-snow active:bg-veil/20"
          >
            View lyrics
          </button>
        </div>
      </div>
    </div>
  )
}

// Three animated bars shown in the mini player while audio is playing.
function Equalizer() {
  return (
    <span className="eq flex h-4 items-end gap-[2.5px]" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}
