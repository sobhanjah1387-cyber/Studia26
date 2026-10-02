// لایه‌ی ذخیره‌سازی: IndexedDB، و در صورت نبود آن، localStorage.
// هر «مجموعه» (sessions, plans, tests, notes, meta) یک object store است.

const DB_NAME = 'studia';
const DB_VERSION = 1;
export const COLLECTIONS = ['sessions', 'plans', 'tests', 'notes', 'meta'];
const LS_PREFIX = 'studia:db:';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB در دسترس نیست'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of COLLECTIONS) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('دیتابیس مسدود شده است'));
  });
  return dbPromise;
}

const wrap = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

function lsRead(name) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + name) || '[]');
  } catch {
    return [];
  }
}

function lsWrite(name, rows) {
  localStorage.setItem(LS_PREFIX + name, JSON.stringify(rows));
}

let useFallback = false;

export async function initDB() {
  try {
    await openDB();
  } catch (err) {
    console.warn('استفاده از localStorage به‌جای IndexedDB:', err);
    useFallback = true;
  }
  return !useFallback;
}

export async function getAll(name) {
  if (useFallback) return lsRead(name);
  const db = await openDB();
  return wrap(db.transaction(name, 'readonly').objectStore(name).getAll());
}

export async function put(name, row) {
  if (useFallback) {
    const rows = lsRead(name).filter((r) => r.id !== row.id);
    rows.push(row);
    lsWrite(name, rows);
    return;
  }
  const db = await openDB();
  await wrap(db.transaction(name, 'readwrite').objectStore(name).put(row));
}

export async function remove(name, id) {
  if (useFallback) {
    lsWrite(name, lsRead(name).filter((r) => r.id !== id));
    return;
  }
  const db = await openDB();
  await wrap(db.transaction(name, 'readwrite').objectStore(name).delete(id));
}

export async function clear(name) {
  if (useFallback) {
    localStorage.removeItem(LS_PREFIX + name);
    return;
  }
  const db = await openDB();
  await wrap(db.transaction(name, 'readwrite').objectStore(name).clear());
}

/** جایگزینی کامل یک مجموعه (برای Import) */
export async function replaceAll(name, rows) {
  if (useFallback) {
    lsWrite(name, rows);
    return;
  }
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(name, 'readwrite');
    const store = tx.objectStore(name);
    store.clear();
    rows.forEach((r) => store.put(r));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch {
    /* بی‌اهمیت */
  }
}
