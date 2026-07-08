// Service worker mínimo para tornar o Combinagame instalável (PWA) e funcionar offline.
// Estratégia: stale-while-revalidate — serve do cache na hora e atualiza em segundo plano.
const CACHE = 'combinagame-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || !req.url.startsWith('http')) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || network
    })(),
  )
})
