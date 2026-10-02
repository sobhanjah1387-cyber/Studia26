/* Service worker ساده: پیش‌کش شل برنامه + کش‌کردن بقیه‌ی فایل‌های همین دامنه.
   لیست PRECACHE هنگام Build به‌صورت خودکار توسط vite.config.js پر می‌شود. */
const VERSION = '__BUILD_VERSION__';
const CACHE = `studia-${VERSION}`;
const PRECACHE = /*__PRECACHE__*/ [];

const url = (p) => new URL(p, self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['./', ...PRECACHE].map(url)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('studia-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const target = new URL(req.url);
  if (target.origin !== self.location.origin) return;

  // صفحه‌ی اصلی: اول شبکه (برای گرفتن نسخه‌ی جدید)، در صورت آفلاین بودن از کش
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url('./'), copy));
          return res;
        })
        .catch(() => caches.match(url('./')).then((r) => r || caches.match(url('index.html')))),
    );
    return;
  }

  // بقیه: اول کش، بعد شبکه (فایل‌های Build با نام هش‌دار تغییرناپذیرند)
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list[0];
      if (open) return open.focus();
      return self.clients.openWindow(url('./#/report'));
    }),
  );
});
