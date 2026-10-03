/* Service Worker لصفحة الروابط - يتيح التثبيت والعمل دون اتصال */
const CACHE_NAME = 'links-page-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './2.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // لا تخزّن طلبات حفظ/جلب الروابط، دائماً من الشبكة مع fallback للكاش للصفحة فقط
  if (url.pathname.endsWith('save.php') || url.pathname.endsWith('links.json')) {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }

  // استراتيجية: الشبكة أولاً ثم الكاش (مناسبة لصفحة روابط تتحدث باستمرار)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
  );
});
