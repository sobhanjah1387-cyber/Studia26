import { h } from '../utils/dom.js';
import { icon } from './icons.js';

export const ROUTES = [
  { path: '/home', label: 'خانه', icon: 'home' },
  { path: '/plan', label: 'برنامه', icon: 'calendar' },
  { path: '/study', label: 'مطالعه', icon: 'clock' },
  { path: '/tests', label: 'تست', icon: 'test' },
  { path: '/stats', label: 'آمار', icon: 'chart' },
  { path: '/settings', label: 'تنظیمات', icon: 'gear' },
];

export function buildNav() {
  const nav = document.getElementById('bottom-nav');
  nav.innerHTML = '';
  ROUTES.forEach((r) => {
    nav.append(
      h('a', { href: `#${r.path}`, dataset: { path: r.path } }, h('span', { class: 'ico' }, icon(r.icon)), h('span', null, r.label)),
    );
  });
}

export function markActive(path) {
  const base = path === '/report' ? '/plan' : path;
  document.querySelectorAll('#bottom-nav a').forEach((a) => {
    if (a.dataset.path === base) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}
