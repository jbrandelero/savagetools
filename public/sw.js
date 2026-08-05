// Minimal service worker — its presence (with a fetch handler) makes the app
// installable as a PWA. Network passthrough; no offline caching yet.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {
  // Let the browser handle the request normally.
})
