// کار با تاریخ‌ها. همه‌ی تاریخ‌ها به صورت رشته‌ی ISO میلادی (YYYY-MM-DD) ذخیره می‌شوند
// و فقط هنگام نمایش به شمسی تبدیل می‌شوند.
import { toJalali, toGregorian, jalaliMonthLength } from './jalali.js';

export const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

// اندیس ۰ = یکشنبه (مطابق Date.getUTCDay)
export const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

// هفته‌ی ایرانی: شنبه تا جمعه
export const WEEK_HEADER = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const pad = (n) => String(n).padStart(2, '0');

export function toISO(y, m, d) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

export function todayISO() {
  const n = new Date();
  return toISO(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function toUTC(iso) {
  const { y, m, d } = parseISO(iso);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms) {
  const dt = new Date(ms);
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(iso, n) {
  return fromUTC(toUTC(iso) + n * 86400000);
}

export function diffDays(a, b) {
  return Math.round((toUTC(a) - toUTC(b)) / 86400000);
}

export function compareISO(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 0 = شنبه ... 6 = جمعه */
export function weekdayIndex(iso) {
  const sun0 = new Date(toUTC(iso)).getUTCDay();
  return (sun0 + 1) % 7;
}

export function weekdayName(iso) {
  return WEEKDAY_NAMES[new Date(toUTC(iso)).getUTCDay()];
}

export function startOfWeek(iso) {
  return addDays(iso, -weekdayIndex(iso));
}

export function endOfWeek(iso) {
  return addDays(startOfWeek(iso), 6);
}

export function isoToJalali(iso) {
  const { y, m, d } = parseISO(iso);
  return toJalali(y, m, d);
}

export function jalaliToISO(jy, jm, jd) {
  const { gy, gm, gd } = toGregorian(jy, jm, jd);
  return toISO(gy, gm, gd);
}

export function jalaliMonthStart(iso) {
  const { jy, jm } = isoToJalali(iso);
  return jalaliToISO(jy, jm, 1);
}

export function jalaliMonthEnd(iso) {
  const { jy, jm } = isoToJalali(iso);
  return jalaliToISO(jy, jm, jalaliMonthLength(jy, jm));
}

/** جابه‌جایی ماه شمسی؛ روز به ۱ برمی‌گردد */
export function shiftJalaliMonth(iso, delta) {
  const { jy, jm } = isoToJalali(iso);
  const idx = jy * 12 + (jm - 1) + delta;
  return jalaliToISO(Math.floor(idx / 12), (idx % 12) + 1, 1);
}

/** همه‌ی روزهای بین دو تاریخ (شامل هر دو) */
export function eachDay(startISO, endISO) {
  const out = [];
  for (let d = startISO; d <= endISO; d = addDays(d, 1)) out.push(d);
  return out;
}

export function jalaliDaysInMonth(iso) {
  const { jy, jm } = isoToJalali(iso);
  return jalaliMonthLength(jy, jm);
}

export { jalaliMonthLength };
