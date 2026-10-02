// ثبت service worker (فقط در نسخه‌ی Build)
export function registerServiceWorker() {
  if (!import.meta.env || !import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('ثبت service worker ناموفق بود', err);
    });
  });
}
