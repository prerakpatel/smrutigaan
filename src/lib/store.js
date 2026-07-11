// Data layer. Everything the app persists flows through here so the
// storage backend can be swapped later (SQLite, Supabase, etc.) without
// touching components. For now: seed JSON + localStorage overlay.
//
// Shape:
// {
//   kirtans:    [{ id, title:{gu,en}, lyrics:{gu,en}, categories:[], updatedAt }]
//   favorites:  [kirtanId]
//   playlists:  [{ id, name, kirtanIds:[] }]
//   annotations:{ [kirtanId]: { note, lines: { [lineIndex]: { highlight, note } } } }
// }

import { useEffect, useState } from 'react'
import seed from '../data/kirtans.json'
import { newId } from './text'
import { deleteAudio } from './audioStore'

const STORAGE_KEY = 'smruti-gaan:v1'

// Canonical library order: by the source `number`. Seed ids are "k_NNN" so
// number is recoverable from the id even if a record lost it; anything else
// (editor-added, non-numeric id) sorts to the end.
export function numberOf(k) {
  if (typeof k.number === 'number') return k.number
  const m = /^k_(\d+)$/.exec(k.id || '')
  return m ? +m[1] : Number.MAX_SAFE_INTEGER
}
const sortKirtans = (arr) => [...arr].sort((a, b) => numberOf(a) - numberOf(b))

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // spread over defaults so states saved by older versions gain new keys
    if (raw) return migrate({ sharedPlaylists: [], ...JSON.parse(raw) })
  } catch (e) {
    console.error('Could not read saved library, starting from seed.', e)
  }
  return {
    kirtans: seed,
    favorites: [],
    playlists: [],
    sharedPlaylists: [], // snapshots of playlists shared with me
    annotations: {},
  }
}

// The bundled seed only applies on a device's very first visit — afterwards
// localStorage wins. Adopt targeted seed improvements that existing installs
// would otherwise never receive: newly attached audio, and the scrub of
// lyrics stored in a legacy pre-Unicode encoding (unrenderable PUA glyphs).
function migrate(state) {
  const seedById = new Map(seed.map((k) => [k.id, k]))
  state.kirtans = (state.kirtans || []).map((k) => {
    const s = seedById.get(k.id)
    let out = k
    // restore source order stripped by an early cloud round-trip
    if (out.number == null) {
      const n = s ? s.number : numberOf(k)
      if (n !== Number.MAX_SAFE_INTEGER) out = { ...out, number: n }
    }
    if (!s) return out
    if (!out.audio && s.audio) out = { ...out, audio: s.audio }
    if (out.lyrics?.gu && /[\uE000-\uF8FF]/.test(out.lyrics.gu)) {
      out = {
        ...out,
        lyrics: { ...out.lyrics, gu: s.lyrics.gu },
        title: { ...out.title, gu: s.title.gu },
      }
    }
    return out
  })
  state.kirtans = sortKirtans(state.kirtans)
  return state
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Could not save library.', e)
  }
}

function stampAndPrune(s, kirtanId) {
  const a = s.annotations[kirtanId]
  if (!a) return
  if (!a.note && Object.keys(a.lines).length === 0) delete s.annotations[kirtanId]
  else a.updatedAt = new Date().toISOString()
}

export function useStore() {
  const [state, setState] = useState(load)

  useEffect(() => {
    save(state)
  }, [state])

  const update = (fn) => setState((s) => fn(structuredClone(s)))

  const actions = {
    // ---- kirtans ----
    saveKirtan(kirtan) {
      update((s) => {
        const i = s.kirtans.findIndex((k) => k.id === kirtan.id)
        const stamped = { ...kirtan, updatedAt: new Date().toISOString() }
        if (i >= 0) s.kirtans[i] = stamped
        else {
          // new kirtans sort after the existing library
          const maxNum = s.kirtans.reduce((m, k) => {
            const n = numberOf(k)
            return n === Number.MAX_SAFE_INTEGER ? m : Math.max(m, n)
          }, 0)
          s.kirtans.push({ number: maxNum + 1, ...stamped, id: kirtan.id || newId() })
          s.kirtans = sortKirtans(s.kirtans)
        }
        return s
      })
    },
    deleteKirtan(id) {
      update((s) => {
        const gone = s.kirtans.find((k) => k.id === id)
        if (gone?.audio?.blobId) deleteAudio(gone.audio.blobId).catch(() => {})
        s.kirtans = s.kirtans.filter((k) => k.id !== id)
        s.favorites = s.favorites.filter((f) => f !== id)
        s.playlists.forEach((p) => (p.kirtanIds = p.kirtanIds.filter((k) => k !== id)))
        delete s.annotations[id]
        return s
      })
    },

    // ---- favorites ----
    toggleFavorite(id) {
      update((s) => {
        s.favorites = s.favorites.includes(id)
          ? s.favorites.filter((f) => f !== id)
          : [...s.favorites, id]
        return s
      })
    },

    // ---- playlists ----
    createPlaylist(name) {
      const id = newId()
      update((s) => {
        s.playlists.push({ id, name, kirtanIds: [] })
        return s
      })
      return id
    },
    renamePlaylist(id, name) {
      update((s) => {
        const p = s.playlists.find((p) => p.id === id)
        if (p) p.name = name
        return s
      })
    },
    deletePlaylist(id) {
      update((s) => {
        s.playlists = s.playlists.filter((p) => p.id !== id)
        return s
      })
    },
    // copy a shared playlist into My lists
    importPlaylist(name, kirtanIds) {
      const id = newId()
      update((s) => {
        s.playlists.push({ id, name, kirtanIds: [...kirtanIds] })
        return s
      })
      return id
    },
    addSharedPlaylist(snap) {
      update((s) => {
        s.sharedPlaylists = [...s.sharedPlaylists.filter((p) => p.id !== snap.id), snap]
        return s
      })
    },
    removeSharedPlaylist(id) {
      update((s) => {
        s.sharedPlaylists = s.sharedPlaylists.filter((p) => p.id !== id)
        return s
      })
    },
    setSharedPlaylists(list) {
      update((s) => {
        s.sharedPlaylists = list
        return s
      })
    },
    togglePlaylistItem(playlistId, kirtanId) {
      update((s) => {
        const p = s.playlists.find((p) => p.id === playlistId)
        if (!p) return s
        p.kirtanIds = p.kirtanIds.includes(kirtanId)
          ? p.kirtanIds.filter((k) => k !== kirtanId)
          : [...p.kirtanIds, kirtanId]
        return s
      })
    },

    // ---- annotations ----
    // Every mutation stamps updatedAt (drives "recently annotated" sorting in
    // the Notes tab) and prunes empty entries so annotated counts stay honest.
    toggleHighlight(kirtanId, lineIndex) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        const line = (a.lines[lineIndex] ||= { highlight: false, note: '' })
        line.highlight = !line.highlight
        if (!line.highlight && !line.note) delete a.lines[lineIndex]
        stampAndPrune(s, kirtanId)
        return s
      })
    },
    // Bulk highlight/unhighlight — used for whole stanzas.
    setHighlights(kirtanId, lineIndices, on) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        for (const i of lineIndices) {
          const line = (a.lines[i] ||= { highlight: false, note: '' })
          line.highlight = on
          if (!line.highlight && !line.note) delete a.lines[i]
        }
        stampAndPrune(s, kirtanId)
        return s
      })
    },
    // A note is anchored to one line; `span` (optional, sorted) records the
    // full group of lines it covers when written against a multi-line
    // selection. Tapping any line in the span surfaces the note.
    setLineNote(kirtanId, lineIndex, note, span) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        const line = (a.lines[lineIndex] ||= { highlight: false, note: '' })
        line.note = note
        if (note && span && span.length > 1) line.span = [...span].sort((x, y) => x - y)
        else delete line.span
        if (!line.highlight && !line.note) delete a.lines[lineIndex]
        stampAndPrune(s, kirtanId)
        return s
      })
    },
    setKirtanNote(kirtanId, note) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        a.note = note
        stampAndPrune(s, kirtanId)
        return s
      })
    },

    // ---- cloud sync hooks ----
    // Replace the library with the cloud copy, but never let a cloud row
    // without audio strip audio this device already knows about (device
    // recordings are local by design; bundled demo audio may predate the
    // cloud copy).
    replaceKirtans(kirtans) {
      update((s) => {
        const localById = new Map(s.kirtans.map((k) => [k.id, k]))
        s.kirtans = sortKirtans(
          kirtans.map((k) => {
            const local = localById.get(k.id)
            const out = { ...k }
            // the cloud doesn't carry audio blobs or (yet) the number —
            // keep what this device already knows so order & audio survive
            if (!out.audio && local?.audio) out.audio = local.audio
            if (out.number == null) {
              const n = local?.number ?? numberOf(k)
              if (n !== Number.MAX_SAFE_INTEGER) out.number = n
            }
            return out
          })
        )
        return s
      })
    },
    applyUserData({ favorites, playlists, annotations, sharedPlaylists }) {
      update((s) => {
        if (favorites) s.favorites = favorites
        if (playlists) s.playlists = playlists
        if (annotations) s.annotations = annotations
        if (sharedPlaylists) s.sharedPlaylists = sharedPlaylists
        return s
      })
    },

    // ---- import / export (for moving data in and out during dev) ----
    exportJSON() {
      return JSON.stringify(state, null, 2)
    },
    importJSON(json) {
      const parsed = JSON.parse(json)
      setState(parsed)
    },
    resetToSeed() {
      localStorage.removeItem(STORAGE_KEY)
      setState(load())
    },
  }

  return { state, actions }
}
