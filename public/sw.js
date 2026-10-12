/* ─────────────────────────────────────────────────────────────
   Service Worker سبک دموی بازارعمده (کارن سافت — Karen-soft.ir)
   راهبرد:
   • درخواست‌های ناوبری: Network-First با fallback به کش (آفلاین)
   • فایل‌های استاتیک هم‌دامنه (js/css/font/تصویر): Cache-First
   • درخواست‌های بیرونی: هرگز کش نمی‌شوند
   نسخه کش را با هر انتشار جدید تغییر دهید تا نسخه قدیمی پاک شود.
   ───────────────────────────────────────────────────────────── */
const CACHE_VERSION = 'bazaromdeh-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest', './favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isSameOrigin = (url) => new URL(url, self.location.origin).origin === self.location.origin;

const isStaticAsset = (pathname) =>
  /\.(?:js|mjs|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico|json|webmanifest)$/i.test(pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(request.url)) return; // فونت/API بیرونی کش نمی‌شود

  // ناوبری: شبکه اول، سپس نسخه کش‌شده، در نهایت صفحه اصلی
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('./index.html').then((index) => index || Response.error())),
        ),
    );
    return;
  }

  // استاتیک: کش اول با به‌روزرسانی پس‌زمینه
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_VERSION).then((cache) => cache.put(request, response.clone()));
              }
            })
            .catch(() => undefined);
          return cached;
        }
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => Response.error());
      }),
    );
  }
});

// اجازه به صفحه برای فعال‌سازی فوری نسخه جدید
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
