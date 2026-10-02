// دانلود و بارگذاری فایل پشتیبان JSON
import { exportData, importData } from './store.js';
import { todayISO } from '../utils/dates.js';

export function downloadBackup() {
  const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `studia-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function restoreBackup(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('فایل خراب است یا JSON معتبر نیست.');
  }
  await importData(json);
}
