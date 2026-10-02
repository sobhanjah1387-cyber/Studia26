// قالب‌بندی اعداد، زمان و تاریخ برای نمایش فارسی
import { MONTH_NAMES, isoToJalali, weekdayName, todayISO, addDays } from './dates.js';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toFa(value) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[d]);
}

/** ارقام فارسی/عربی را به لاتین برمی‌گرداند (برای پارس کردن ورودی) */
export function toEn(value) {
  return String(value)
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function toInt(value, fallback = 0) {
  const n = parseInt(toEn(value), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** ۹۰ → «۱ ساعت و ۳۰ دقیقه» */
export function formatDuration(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return toFa(`${h} ساعت و ${r} دقیقه`);
  if (h) return toFa(`${h} ساعت`);
  return toFa(`${r} دقیقه`);
}

/** ۲۰۰ → «۳:۲۰» */
export function formatClock(totalMinutes) {
  const m = Math.max(0, Math.round(totalMinutes || 0));
  return toFa(`${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);
}

export function formatPercent(value) {
  const n = Math.round((value || 0) * 10) / 10;
  return `${toFa(n).replace('.', '٫')}٪`;
}

export function formatNumber(n) {
  return toFa(Math.round((n || 0) * 10) / 10).replace('.', '٫');
}

/** «چهارشنبه ۸ مهر ۱۴۰۵» */
export function formatDateLong(iso) {
  const { jy, jm, jd } = isoToJalali(iso);
  return toFa(`${weekdayName(iso)} ${jd} ${MONTH_NAMES[jm - 1]} ${jy}`);
}

/** «۸ مهر» */
export function formatDateShort(iso) {
  const { jm, jd } = isoToJalali(iso);
  return toFa(`${jd} ${MONTH_NAMES[jm - 1]}`);
}

/** «۱۴۰۵/۰۷/۰۸» */
export function formatDateNumeric(iso) {
  const { jy, jm, jd } = isoToJalali(iso);
  return toFa(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
}

export function formatMonthTitle(iso) {
  const { jy, jm } = isoToJalali(iso);
  return toFa(`${MONTH_NAMES[jm - 1]} ${jy}`);
}

/** برچسب دوستانه: امروز / دیروز / فردا یا تاریخ کامل */
export function formatDateFriendly(iso) {
  const t = todayISO();
  if (iso === t) return 'امروز';
  if (iso === addDays(t, -1)) return 'دیروز';
  if (iso === addDays(t, 1)) return 'فردا';
  return formatDateLong(iso);
}

export function formatTimeFa(hhmm) {
  return hhmm ? toFa(hhmm) : '';
}

/** دقیقه‌ی بین دو ساعت «HH:MM»؛ اگر پایان کوچک‌تر بود یعنی بعد از نیمه‌شب */
export function minutesBetween(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return diff;
}
