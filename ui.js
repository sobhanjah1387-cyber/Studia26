// وضعیت رابط کاربری که بین صفحه‌ها مشترک است (روز انتخاب‌شده، حالت آمار، ...)
import { todayISO } from '../utils/dates.js';

export const ui = {
  date: todayISO(), // روز انتخاب‌شده در صفحه‌های برنامه، مطالعه، تست و گزارش
  calendarMonth: todayISO(), // هر تاریخ داخل ماه نمایش‌داده‌شده
  statsMode: 'day', // day | week | month
  statsDate: todayISO(),
};

export function resetToToday() {
  const t = todayISO();
  ui.date = t;
  ui.calendarMonth = t;
  ui.statsDate = t;
}
