// Bump this when the caching strategy changes; old caches are deleted on activate.
// (A date-based name changed every time the browser restarted the worker, leaking caches.)
const CACHE_NAME = "expense-tracker-pro-v3";

// Files to pre-cache, including the app shell used as the offline fallback
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Install — cache static assets and skip waiting immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up all old caches immediately and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log("SW: Deleting old cache", k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Listen for messages from client (SKIP_WAITING, CLEAR_CACHE)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

function cacheResponse(request, response) {
  if (response && response.status === 200) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle this site's own files. API calls go to the backend's domain and
  // must never be cached (they hold per-user data that would outlive logout).
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/service-worker.js") return;

  // Pages: network-first so new deploys show up, falling back to the cached app shell offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => cacheResponse("/index.html", response))
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Build assets have content hashes in their names, so a cached copy is never stale
  if (url.pathname.startsWith("/static/")) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((response) => cacheResponse(event.request, response))
      )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => cacheResponse(event.request, response))
      .catch(() => caches.match(event.request))
  );
});
