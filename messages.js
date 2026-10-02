// پیام‌های کوتاه و انگیزشی

import { formatDuration } from '../utils/format.js';

const NUDGES = [
  'هر جلسه‌ی کوچک، یک قدم به هدفه.',
  'مهم نیست چقدر، مهم اینه که امروز هم شروع کردی.',
  'ثبات از شدت مهم‌تره.',
  'یک مبحث را کامل ببند، بعد برو سراغ بعدی.',
];

/** پیام مناسب وضعیت مطالعه‌ی امروز */
export function studyMessage(minutes, goalMinutes, seed = 0) {
  if (!minutes) return 'هنوز جلسه‌ای ثبت نشده؛ اولین جلسه‌ی امروزت را شروع کن ✏️';
  const base = `امروز ${formatDuration(minutes)} مطالعه کردی`;
  const ratio = goalMinutes > 0 ? minutes / goalMinutes : 0;
  if (ratio >= 1) return `${base}؛ هدف روزانه کامل شد 🎉`;
  if (ratio >= 0.75) return `${base}؛ خیلی نزدیکی 🔥`;
  if (ratio >= 0.4) return `${base} 👏`;
  return `${base}؛ ${NUDGES[seed % NUDGES.length]}`;
}

export function planMessage(done, total) {
  if (!total) return 'برای امروز برنامه‌ای نچیدی.';
  if (done === total) return 'همه‌ی برنامه‌ی امروز انجام شد ✅';
  if (done === 0) return 'هنوز هیچ برنامه‌ای تیک نخورده.';
  return 'ادامه بده، چیزی نمونده.';
}
