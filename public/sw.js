// Offline cache. Bump VERSION whenever any file this app uses changes (including srs.js).
const VERSION = 'v13';
const CACHE = `sight-words-${VERSION}`;
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'deck.js',
  'queue.js',
  'voices.js',
  'clips.js',
  'audio/clips.json',
  'srs.js',
  'manifest.webmanifest',
  'fonts/andika-400.woff2',
  'fonts/andika-700.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))).then(() => precacheClips(c)))
    .then(() => self.skipWaiting()));
});

// Recorded speech, so it works offline from the first launch. A clip that fails to download
// doesn't block the update; it's fetched (and cached) when first played instead.
function precacheClips(c) {
  return c.match('audio/clips.json').then((r) => r.json())
    .then((keys) => Promise.allSettled(keys.map((k) => c.add(new Request(`audio/${k}.mp3`, { cache: 'reload' })))))
    .catch(() => {});
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sight-words-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache first, falling back to network (and caching same-origin GETs).
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('index.html'))),
  );
});
