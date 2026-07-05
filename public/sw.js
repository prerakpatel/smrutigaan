// Minimal offline support: network-first with cache fallback for same-origin
// GET requests. After the first visit the whole app (and the lyrics bundled
// into it) keeps working with no connection — notes/favorites already live
// in localStorage. Registered only in production builds (see main.jsx).
const CACHE = 'smruti-gaan-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== 'GET' || url.origin !== location.origin) return
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await fetch(e.request)
        cache.put(e.request, fresh.clone())
        return fresh
      } catch {
        const cached =
          (await cache.match(e.request)) ||
          (e.request.mode === 'navigate' ? await cache.match('/') : undefined)
        return cached || Response.error()
      }
    })
  )
})
