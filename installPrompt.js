// نگه‌داشتن رویداد beforeinstallprompt برای دکمه‌ی «نصب برنامه»
let deferred = null;
const listeners = new Set();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  listeners.forEach((fn) => fn(true));
});

window.addEventListener('appinstalled', () => {
  deferred = null;
  listeners.forEach((fn) => fn(false));
});

export function canInstall() {
  return Boolean(deferred);
}

export function onInstallAvailability(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  );
}

export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  listeners.forEach((fn) => fn(false));
  return choice.outcome === 'accepted';
}
