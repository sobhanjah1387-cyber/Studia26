// حافظه‌ی برنامه: داده‌ها یک بار از دیتابیس خوانده و در حافظه نگه داشته می‌شوند؛
// هر تغییر هم در حافظه و هم (ناهمگام) در دیتابیس اعمال می‌شود.
import * as db from './db.js';
import { uid } from '../utils/id.js';
import { DEFAULT_SETTINGS } from '../data/defaults.js';

const listeners = new Set();
const state = {
  sessions: [],
  plans: [],
  tests: [],
  notes: [], // { id: 'YYYY-MM-DD', date, text }
  settings: structuredCloneSafe(DEFAULT_SETTINGS),
};

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function mergeSettings(saved) {
  const base = structuredCloneSafe(DEFAULT_SETTINGS);
  if (!saved || typeof saved !== 'object') return base;
  for (const key of Object.keys(base)) {
    if (saved[key] === undefined) continue;
    if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      base[key] = { ...base[key], ...(typeof saved[key] === 'object' ? saved[key] : {}) };
    } else {
      base[key] = saved[key];
    }
  }
  return base;
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (err) {
      console.error(err);
    }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function initStore() {
  await db.initDB();
  db.requestPersistentStorage();
  const [sessions, plans, tests, notes, meta] = await Promise.all([
    db.getAll('sessions'),
    db.getAll('plans'),
    db.getAll('tests'),
    db.getAll('notes'),
    db.getAll('meta'),
  ]);
  state.sessions = sessions;
  state.plans = plans;
  state.tests = tests;
  state.notes = notes;
  const savedSettings = meta.find((m) => m.id === 'settings');
  state.settings = mergeSettings(savedSettings && savedSettings.value);
}

export const getState = () => state;
export const getSettings = () => state.settings;

function persist(promise) {
  promise.catch((err) => console.error('خطا در ذخیره‌سازی', err));
}

export function add(collection, data) {
  const row = { ...data, id: data.id || uid(), createdAt: data.createdAt || Date.now() };
  state[collection].push(row);
  persist(db.put(collection, row));
  notify();
  return row;
}

/** silent=true: ذخیره بدون بازسازی صفحه (برای فیلدهایی که کاربر هنوز در حال تایپ در آن‌هاست) */
export function update(collection, id, patch, silent = false) {
  const idx = state[collection].findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const row = { ...state[collection][idx], ...patch, id };
  state[collection][idx] = row;
  persist(db.put(collection, row));
  if (!silent) notify();
  return row;
}

export function remove(collection, id) {
  const idx = state[collection].findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const [removed] = state[collection].splice(idx, 1);
  persist(db.remove(collection, id));
  notify();
  return removed;
}

/** بازگرداندن یک ردیف حذف‌شده (Undo) */
export function restore(collection, row) {
  if (state[collection].some((r) => r.id === row.id)) return;
  state[collection].push(row);
  persist(db.put(collection, row));
  notify();
}

export function saveSettings(patch, silent = false) {
  state.settings = mergeSettings({ ...state.settings, ...patch });
  persist(db.put('meta', { id: 'settings', value: state.settings }));
  if (!silent) notify();
}

export function getNote(date) {
  const n = state.notes.find((x) => x.id === date);
  return n ? n.text : '';
}

export function setNote(date, text, silent = false) {
  const trimmed = text.trim();
  const existing = state.notes.find((x) => x.id === date);
  if (!trimmed) {
    if (existing) {
      state.notes = state.notes.filter((x) => x.id !== date);
      persist(db.remove('notes', date));
      if (!silent) notify();
    }
    return;
  }
  const row = { id: date, date, text: trimmed };
  state.notes = [...state.notes.filter((x) => x.id !== date), row];
  persist(db.put('notes', row));
  if (!silent) notify();
}

export function subjectsUsed() {
  const counts = new Map();
  for (const list of [state.sessions, state.plans, state.tests]) {
    for (const r of list) {
      if (r.subject) counts.set(r.subject, (counts.get(r.subject) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

/** داده‌ی مناسب توابع آماری و گزارش */
export function dataForStats() {
  return { sessions: state.sessions, plans: state.plans, tests: state.tests };
}

// ---- پشتیبان‌گیری ----
export const BACKUP_VERSION = 1;

export function exportData() {
  return {
    app: 'studia',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    theme: localStorage.getItem('studia:theme') || 'system',
    settings: state.settings,
    sessions: state.sessions,
    plans: state.plans,
    tests: state.tests,
    notes: state.notes,
  };
}

const asArray = (v) => (Array.isArray(v) ? v.filter((r) => r && typeof r === 'object' && r.id) : []);

export async function importData(json) {
  if (!json || typeof json !== 'object' || json.app !== 'studia') {
    throw new Error('این فایل، پشتیبان Studia نیست.');
  }
  state.sessions = asArray(json.sessions);
  state.plans = asArray(json.plans);
  state.tests = asArray(json.tests);
  state.notes = asArray(json.notes);
  state.settings = mergeSettings(json.settings);
  if (['light', 'dark', 'system'].includes(json.theme)) {
    localStorage.setItem('studia:theme', json.theme);
  }
  await Promise.all([
    db.replaceAll('sessions', state.sessions),
    db.replaceAll('plans', state.plans),
    db.replaceAll('tests', state.tests),
    db.replaceAll('notes', state.notes),
    db.replaceAll('meta', [{ id: 'settings', value: state.settings }]),
  ]);
  notify();
}

export async function wipeAll() {
  state.sessions = [];
  state.plans = [];
  state.tests = [];
  state.notes = [];
  state.settings = structuredCloneSafe(DEFAULT_SETTINGS);
  await Promise.all(db.COLLECTIONS.map((c) => db.clear(c)));
  localStorage.removeItem('studia:theme');
  localStorage.removeItem('studia:lastReminder');
  notify();
}
