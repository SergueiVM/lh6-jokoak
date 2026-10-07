const SHELL_CACHE = "lh6-jokoak-shell-v1";
const RUNTIME_CACHE = "lh6-jokoak-runtime-v1";
const SHELL_URLS = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith("lh6-jokoak-shell-") && key !== SHELL_CACHE)
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        event.waitUntil(
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(request, response.clone()))
            .catch(error => console.error("Ezin izan da edukia gordetako cachean gorde:", error))
        );
      }
      return response;
    } catch (error) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      const cachedResponse = await runtimeCache.match(request);
      if (cachedResponse) return cachedResponse;

      const shellCache = await caches.open(SHELL_CACHE);
      const shellResponse = await shellCache.match(request);
      if (shellResponse) return shellResponse;

      throw error;
    }
  })());
});
