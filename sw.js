// Daybook offline support. Bump VERSION when the app changes.
const VERSION = 'daybook-v1';
const SHELL = ['./', 'index.html', 'plan.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return; // backups always go to the network
  const sameOrigin = url.origin === location.origin;
  const fresh = sameOrigin && (req.mode === 'navigate' || /\/(index\.html|plan\.json)?$/.test(url.pathname) || url.pathname.endsWith('plan.json'));
  if (fresh) { // network first, so plan and app updates arrive; cache when offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  if (sameOrigin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) { // cache first: Bible books, icons, fonts
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); } return r; })));
  }
});
