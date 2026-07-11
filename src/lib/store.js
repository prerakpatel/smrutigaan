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

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Could not read saved library, starting from seed.', e)
  }
  return {
    kirtans: seed,
    favorites: [],
    playlists: [],
    annotations: {},
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Could not save library.', e)
  }
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
        else s.kirtans.push({ ...stamped, id: kirtan.id || newId() })
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
    toggleHighlight(kirtanId, lineIndex) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        const line = (a.lines[lineIndex] ||= { highlight: false, note: '' })
        line.highlight = !line.highlight
        if (!line.highlight && !line.note) delete a.lines[lineIndex]
        return s
      })
    },
    setLineNote(kirtanId, lineIndex, note) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        const line = (a.lines[lineIndex] ||= { highlight: false, note: '' })
        line.note = note
        if (!line.highlight && !line.note) delete a.lines[lineIndex]
        return s
      })
    },
    setKirtanNote(kirtanId, note) {
      update((s) => {
        const a = (s.annotations[kirtanId] ||= { note: '', lines: {} })
        a.note = note
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
