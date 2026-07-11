// Cloud layer: offline-first sync against Supabase.
//
// Model:
// - The kirtan library is shared: pulled from the cloud on launch when online
//   (the local copy remains the offline source of truth), written only by
//   accounts in the `editors` table.
// - Personal data (favorites, playlists, annotations) writes locally first —
//   the app never waits on the network — and a debounced push mirrors it to
//   the signed-in user's row. On sign-in, cloud and local are merged.
// - Signed-out users keep today's local-only behavior.

import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const EDITOR_FLAG = 'smruti-gaan:editor'

const rowToKirtan = (r) => ({
  id: r.id,
  title: r.title || {},
  lyrics: r.lyrics || {},
  categories: r.categories || [],
  ...(r.audio ? { audio: r.audio } : {}),
  updatedAt: r.updated_at,
})

const kirtanToRow = (k) => ({
  id: k.id,
  title: k.title || {},
  lyrics: k.lyrics || {},
  categories: k.categories || [],
  // device-local audio files (IndexedDB blobs) never leave the device
  audio: k.audio && k.audio.url ? k.audio : null,
  updated_at: new Date().toISOString(),
})

// Merge personal data from two devices. Favorites union; playlists by id
// (cloud wins name conflicts, local-only ones are kept); annotations per
// kirtan by their updatedAt stamp.
function mergeUserData(local, cloud) {
  if (!cloud) return local
  const favorites = [...new Set([...(cloud.favorites || []), ...(local.favorites || [])])]
  const playlists = [...(cloud.playlists || [])]
  const seen = new Set(playlists.map((p) => p.id))
  for (const p of local.playlists || []) if (!seen.has(p.id)) playlists.push(p)
  const annotations = { ...(local.annotations || {}) }
  for (const [id, a] of Object.entries(cloud.annotations || {})) {
    const l = annotations[id]
    if (!l || (a.updatedAt || '') >= (l.updatedAt || '')) annotations[id] = a
  }
  const sharedById = new Map(
    [...(local.sharedPlaylists || []), ...(cloud.sharedPlaylists || [])].map((p) => [p.id, p])
  )
  return { favorites, playlists, annotations, sharedPlaylists: [...sharedById.values()] }
}

const rowToSharedSnap = (r) => ({
  id: r.id,
  name: r.name,
  kirtanIds: r.kirtan_ids || [],
  owner: r.owner_email || '',
  ownerId: r.owner_id,
  fetchedAt: new Date().toISOString(),
})

export function useCloud(state, actions) {
  const [session, setSession] = useState(null)
  const [isEditor, setIsEditor] = useState(() => localStorage.getItem(EDITOR_FLAG) === '1')
  const [syncedAt, setSyncedAt] = useState(null)
  const lastPushed = useRef(null)
  const mergedForUser = useRef(null) // guards the one-time merge per sign-in

  // --- auth state ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // --- am I an editor? (cached so editor UI works offline) ---
  useEffect(() => {
    if (!session) {
      setIsEditor(false)
      localStorage.removeItem(EDITOR_FLAG)
      return
    }
    supabase
      .from('editors')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return // offline or schema missing — keep cached value
        const ed = !!data
        setIsEditor(ed)
        if (ed) localStorage.setItem(EDITOR_FLAG, '1')
        else localStorage.removeItem(EDITOR_FLAG)
      })
  }, [session])

  // --- pull the shared library on launch (keep local seed if cloud empty) ---
  useEffect(() => {
    let gone = false
    supabase
      .from('kirtans')
      .select('*')
      .then(({ data, error }) => {
        if (gone || error || !data || data.length === 0) return
        actions.replaceKirtans(data.map(rowToKirtan))
      })
    return () => {
      gone = true
    }
  }, [])

  // --- personal data: merge once per sign-in, then debounced push ---
  useEffect(() => {
    if (!session) {
      mergedForUser.current = null
      return
    }
    if (mergedForUser.current === session.user.id) return
    mergedForUser.current = session.user.id
    supabase
      .from('user_data')
      .select('data')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return
        const local = {
          favorites: state.favorites,
          playlists: state.playlists,
          annotations: state.annotations,
          sharedPlaylists: state.sharedPlaylists,
        }
        const merged = mergeUserData(local, data?.data)
        actions.applyUserData(merged)
      })
  }, [session])

  useEffect(() => {
    if (!session) return
    const payload = {
      favorites: state.favorites,
      playlists: state.playlists,
      annotations: state.annotations,
      sharedPlaylists: state.sharedPlaylists,
    }
    const json = JSON.stringify(payload)
    if (json === lastPushed.current) return
    const t = setTimeout(() => {
      supabase
        .from('user_data')
        .upsert({
          user_id: session.user.id,
          data: payload,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (!error) {
            lastPushed.current = json
            setSyncedAt(new Date())
          }
        })
    }, 2000)
    return () => clearTimeout(t)
  }, [session, state.favorites, state.playlists, state.annotations, state.sharedPlaylists])

  // --- refresh "shared with me" snapshots on launch (they live-update) ---
  const refreshedShared = useRef(false)
  useEffect(() => {
    if (refreshedShared.current || state.sharedPlaylists.length === 0) return
    refreshedShared.current = true
    supabase
      .from('shared_playlists')
      .select('*')
      .in(
        'id',
        state.sharedPlaylists.map((p) => p.id)
      )
      .then(({ data, error }) => {
        if (error || !data) return
        const fresh = new Map(data.map((r) => [r.id, rowToSharedSnap(r)]))
        actions.setSharedPlaylists(
          state.sharedPlaylists.map((p) => fresh.get(p.id) || p)
        )
      })
  }, [state.sharedPlaylists])

  // --- editor write-through for the shared library ---
  const pushKirtan = async (k) => {
    if (!isEditor || !session) return
    const { error } = await supabase.from('kirtans').upsert(kirtanToRow(k))
    if (error) alert(`Saved on this device, but the cloud save failed: ${error.message}`)
  }
  const removeKirtan = async (id) => {
    if (!isEditor || !session) return
    const { error } = await supabase.from('kirtans').delete().eq('id', id)
    if (error) alert(`Deleted on this device, but the cloud delete failed: ${error.message}`)
  }
  // one-time bulk publish of the local library (seeding the cloud)
  const publishAll = async () => {
    if (!isEditor || !session) return
    const rows = state.kirtans.map(kirtanToRow)
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from('kirtans').upsert(rows.slice(i, i + 100))
      if (error) {
        alert(`Publish failed at ${i}: ${error.message}`)
        return
      }
    }
    alert(`Published ${rows.length} kirtans to the cloud.`)
  }

  // --- playlist sharing ---
  const sharePlaylist = async (p) => {
    if (!session) {
      alert('Sign in (Settings → Account) to share playlists.')
      return null
    }
    const { error } = await supabase.from('shared_playlists').upsert({
      id: p.id,
      owner_id: session.user.id,
      owner_email: session.user.email,
      name: p.name,
      kirtan_ids: p.kirtanIds,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      alert(`Could not share this playlist: ${error.message}`)
      return null
    }
    return `${window.location.origin}/?sp=${p.id}`
  }
  const stopSharing = async (id) => {
    const { error } = await supabase.from('shared_playlists').delete().eq('id', id)
    if (error) alert(`Could not stop sharing: ${error.message}`)
    return !error
  }
  const fetchSharedPlaylist = async (id) => {
    const { data, error } = await supabase
      .from('shared_playlists')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return null
    return rowToSharedSnap(data)
  }

  // --- sign-in / out ---
  const signInGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  const signInEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    alert(error ? `Could not send the link: ${error.message}` : 'Check your email for the sign-in link.')
  }
  const signOut = () => supabase.auth.signOut()

  return {
    session,
    isEditor,
    syncedAt,
    pushKirtan,
    removeKirtan,
    publishAll,
    sharePlaylist,
    stopSharing,
    fetchSharedPlaylist,
    signInGoogle,
    signInEmail,
    signOut,
  }
}
