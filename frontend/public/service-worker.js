const CACHE_NAME = "expense-tracker-pro-v2-" + new Date().toISOString().split("T")[0];

// Files to pre-cache
const STATIC_ASSETS = [
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

// Fetch — Network-First for HTML/navigate and API, Cache-First for static JS/CSS assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Always go network-first without caching for API calls and navigation (HTML pages)
  if (
    event.request.mode === "navigate" ||
    event.request.url.includes("/auth/") ||
    event.request.url.includes("/expenses") ||
    event.request.url.includes("/budget") ||
    event.request.url.includes("/lendborrow") ||
    event.request.url.includes("/service-worker.js")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => response)
        .catch(() => caches.match(event.request) || caches.match("/"))
    );
    return;
  }

  // Network-First with cache fallback for other files
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
