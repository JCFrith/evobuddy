const CACHE_NAME = "evobuddy-shell-v2";
// "/" is deliberately excluded: it's a server-side redirect dispatcher
// (see src/app/page.tsx), never real content. Precaching a followed
// redirect and serving it back for a later navigation is exactly what
// triggers Safari's "Response served by service worker has redirections"
// crash -- browsers reject a Response with redirected=true for
// navigation requests. /login is real, cacheable content and a
// reasonable offline landing page instead.
const APP_SHELL = ["/login", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API responses (avatar/game state must always be fresh and
  // authoritative from the server) -- network-only for /api/*.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigations (top-level page loads, including "/" which redirects
  // server-side) are never intercepted: a redirect followed inside this
  // fetch handler produces a Response with redirected=true, and handing
  // that back via respondWith() for a navigation is invalid per spec --
  // Chrome tolerates it, Safari hard-crashes the load with "Response
  // served by service worker has redirections". Letting the browser's
  // own navigation machinery run means redirects (like "/" -> "/login")
  // are followed correctly regardless of browser.
  if (request.mode === "navigate") {
    return;
  }

  // Cache-first for the static app shell / same-origin static assets,
  // falling back to network, so the app still opens offline.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
