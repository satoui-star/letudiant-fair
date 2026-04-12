// L'Étudiant Salons — Service Worker
// Caches the QR page + static assets for offline use.
// The QR code itself is stored in localStorage (le_qr_cache) — this SW ensures
// the /qr shell loads even without a network connection.

const CACHE_NAME = 'letudiant-salons-v1'

// Resources to cache on install
const PRECACHE_URLS = [
  '/qr',
  '/home',
  '/offline',
]

// ── Install: precache shell pages ────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use individual adds so one failure doesn't block the rest
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Failed to precache ${url}:`, err)
          )
        )
      )
    }).then(() => self.skipWaiting())
  )
})

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: network-first for API, cache-first for pages ──────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API calls, auth, or third-party requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.origin !== self.location.origin
  ) {
    return
  }

  // Cache-first for the QR page (most critical for offline)
  if (url.pathname === '/qr') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
      })
    )
    return
  }

  // Network-first for everything else (stale-while-revalidate)
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
