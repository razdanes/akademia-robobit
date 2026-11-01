const V = 'robobit-v1', SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())))
self.addEventListener('fetch', e => {
  const r = e.request
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin || r.headers.has('range')) return
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put('/index.html', c)); return res }).catch(() => caches.match('/index.html'))); return }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.status === 200) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)) } return res }).catch(() => hit)
    return hit || net
  }))
})
