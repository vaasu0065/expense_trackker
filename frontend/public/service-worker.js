const CACHE_NAME = "expense-tracker-v1";

// Files to cache for offline use
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png"
];

// Install — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests (always go to network for API)
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/auth/") ||
      event.request.url.includes("/expenses") ||
      event.request.url.includes("/budget") ||
      event.request.url.includes("/lendborrow")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache fresh responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
