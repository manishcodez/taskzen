/**
 * Taskzen service worker — privacy-safe caching only.
 *
 * NEVER caches:
 * - /api/* (auth, tasks, subjects, profile, admin, cron, etc.)
 * - HTML/RSC navigations for app pages (may include user-specific payloads)
 * - Cookies / tokens (not available to SW as readable secrets; we also avoid caching responses that carry Set-Cookie)
 *
 * MAY cache:
 * - Precached offline shell (/offline)
 * - Static hashed assets under /_next/static/
 * - Public PWA icons under /icons/
 */

const VERSION = "taskzen-pwa-v1";
const STATIC_CACHE = `${VERSION}-static`;
const SHELL_CACHE = `${VERSION}-shell`;

const PRECACHE_URLS = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("taskzen-pwa-") && key !== STATIC_CACHE && key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)
  );
}

function isNavigationRequest(request) {
  return request.mode === "navigate" || (request.method === "GET" && request.headers.get("accept")?.includes("text/html"));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never intercept or cache private API traffic.
  if (isApiRequest(url)) {
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const offline = await cache.match("/offline");
          return offline || new Response("You are offline.", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        const response = await fetch(request);
        // Only cache successful opaque-safe same-origin static responses.
        if (response.ok && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      })(),
    );
  }
});
