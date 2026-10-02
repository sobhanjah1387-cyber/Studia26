// یادآوری روزانه. مرورگر اجازه‌ی زمان‌بندی دقیق در پس‌زمینه را نمی‌دهد؛
// پس یادآوری وقتی کار می‌کند که برنامه باز یا در پس‌زمینه‌ی مرورگر زنده باشد.
import { getSettings } from './store.js';
import { todayISO } from '../utils/dates.js';

const LAST_KEY = 'studia:lastReminder';
let timer = null;

export function notificationsSupported() {
  return 'Notification' in window;
}

export async function requestReminderPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

async function showReminder() {
  const title = 'Studia · وقت گزارش امروزه';
  const options = {
    body: 'جلسه‌ها و تست‌های امروزت را ثبت کن و گزارش را برای مشاور بفرست.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    tag: 'studia-daily',
    dir: 'rtl',
    lang: 'fa',
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg && reg.showNotification) {
      await reg.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch (err) {
    console.warn('نمایش یادآوری ناموفق بود', err);
  }
}

function check() {
  const { reminders } = getSettings();
  if (!reminders.enabled || !notificationsSupported() || Notification.permission !== 'granted') return;
  const now = new Date();
  const [h, m] = (reminders.time || '20:00').split(':').map(Number);
  const due = now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  const today = todayISO();
  if (due && localStorage.getItem(LAST_KEY) !== today) {
    localStorage.setItem(LAST_KEY, today);
    showReminder();
  }
}

export function startReminders() {
  if (timer) clearInterval(timer);
  timer = setInterval(check, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
  check();
}
