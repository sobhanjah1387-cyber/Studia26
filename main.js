import { initTheme } from './services/theme.js';
import { initStore, subscribe } from './services/store.js';
import { registerServiceWorker } from './services/pwa.js';
import { startReminders } from './services/reminders.js';
import { watchKeyboard } from './hooks/keyboard.js';
import { buildNav, markActive } from './components/nav.js';
import { clear, h } from './utils/dom.js';
import { renderHome } from './pages/home.js';
import { renderPlan } from './pages/plan.js';
import { renderStudy } from './pages/study.js';
import { renderTests } from './pages/tests.js';
import { renderStats } from './pages/stats.js';
import { renderSettings } from './pages/settings.js';
import { renderReport } from './pages/report.js';
import { resetToToday } from './services/ui.js';

const ROUTES = {
  '/home': renderHome,
  '/plan': renderPlan,
  '/study': renderStudy,
  '/tests': renderTests,
  '/stats': renderStats,
  '/settings': renderSettings,
  '/report': renderReport,
};

const main = document.getElementById('main');
let currentPath = null;
let scheduled = false;

function currentRoute() {
  const path = (location.hash || '').replace(/^#/, '') || '/home';
  return ROUTES[path] ? path : '/home';
}

function render({ keepScroll = true } = {}) {
  const path = currentRoute();
  const scroll = keepScroll && path === currentPath ? window.scrollY : 0;
  currentPath = path;
  markActive(path);
  clear(main);
  try {
    main.append(ROUTES[path](requestRender));
  } catch (err) {
    console.error(err);
    main.append(h('div', { class: 'empty' }, h('b', null, 'مشکلی پیش آمد'), 'صفحه را دوباره باز کن. اگر تکرار شد، از تنظیمات پشتیبان بگیر.'));
  }
  window.scrollTo(0, scroll);
}

function requestRender() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    render();
  });
}

async function start() {
  initTheme();
  buildNav();
  watchKeyboard();
  try {
    await initStore();
  } catch (err) {
    console.error(err);
    main.append(h('div', { class: 'empty' }, h('b', null, 'دسترسی به حافظه‌ی مرورگر ممکن نشد'), 'اگر در حالت ناشناس هستی، به حالت عادی برگرد.'));
    return;
  }
  subscribe(requestRender);
  window.addEventListener('hashchange', () => {
    if (currentRoute() === '/home') resetToToday();
    render({ keepScroll: false });
    main.focus({ preventScroll: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestRender();
  });
  render({ keepScroll: false });
  startReminders();
  registerServiceWorker();
}

start();
