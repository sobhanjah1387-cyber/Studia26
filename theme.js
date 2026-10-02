// تم: light / dark / system — انتخاب در localStorage ذخیره می‌شود.
const KEY = 'studia:theme';
const THEME_COLORS = { light: '#f6f7fb', dark: '#0f1220' };
const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

export function getThemePreference() {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

export function resolveTheme(pref = getThemePreference()) {
  if (pref === 'system') return media && media.matches ? 'dark' : 'light';
  return pref;
}

export function applyTheme(pref = getThemePreference()) {
  const theme = resolveTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
  document.querySelectorAll('meta[name="theme-color"][media]').forEach((m) => m.remove());
}

export function setThemePreference(pref) {
  if (pref === 'system') localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, pref);
  applyTheme(pref);
}

export function initTheme() {
  applyTheme();
  if (media) {
    const onChange = () => {
      if (getThemePreference() === 'system') applyTheme('system');
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else if (media.addListener) media.addListener(onChange);
  }
}
