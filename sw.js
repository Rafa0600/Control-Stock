// Control de Stock (GitHub Pages: rafa0600.github.io/Control-Stock/sw.js)
// IMPORTANTE: NO cachea nada de los workers (stock de Ecom, ventas de ML): eso siempre va a la red.
// Solo guarda la página (red primero, para que las actualizaciones lleguen al toque) y las fotos.
const CACHE_NAME = 'mikra-stock-v10';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Fotos de Mercado Libre: caché primero
    if (url.hostname.endsWith('mlstatic.com')) {
        event.respondWith(
            caches.match(req).then(c => c || fetch(req).then(r => {
                if (r.ok) { const cl = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(req, cl)); }
                return r;
            }).catch(() => new Response('', { status: 404 })))
        );
        return;
    }

    // La propia página (mismo origen): red primero, caché solo si no hay conexión
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(req).then(r => {
                if (r.ok) { const cl = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(req, cl)); }
                return r;
            }).catch(() => caches.match(req))
        );
    }
    // Todo lo demás (workers, ML, Ecom): sin tocar, directo a la red
});
