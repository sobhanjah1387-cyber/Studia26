import test from 'node:test';
import assert from 'node:assert/strict';
import { calcPercent, normalizeTest } from '../src/utils/testMath.js';
import { summarizeDay, summarizeRange, computeStreak, minutesByDate, recordDay } from '../src/utils/stats.js';
import { buildReport } from '../src/utils/report.js';
import { DEFAULT_SETTINGS } from '../src/data/defaults.js';
import { formatDuration, formatClock, toFa, toEn, minutesBetween } from '../src/utils/format.js';
import { isoToJalali, jalaliToISO, startOfWeek, addDays } from '../src/utils/dates.js';

test('درصد کنکوری', () => {
  assert.equal(calcPercent(30, 24, 4), 75.6);
  assert.equal(calcPercent(10, 0, 10), -33.3);
  assert.equal(calcPercent(0, 0, 0), 0);
});

test('نرمال‌سازی تست', () => {
  const a = normalizeTest({ total: 30, correct: 24, wrong: 4, blank: 0 });
  assert.equal(a.value.blank, 2);
  const b = normalizeTest({ total: 0, correct: 5, wrong: 2, blank: 3 });
  assert.equal(b.value.total, 10);
  assert.equal(normalizeTest({ total: 10, correct: 8, wrong: 5, blank: 0 }).ok, false);
  assert.equal(normalizeTest({ total: 0, correct: 0, wrong: 0, blank: 0 }).ok, false);
});

test('قالب‌بندی', () => {
  assert.equal(formatDuration(90), '۱ ساعت و ۳۰ دقیقه');
  assert.equal(formatDuration(120), '۲ ساعت');
  assert.equal(formatDuration(45), '۴۵ دقیقه');
  assert.equal(formatClock(200), '۳:۲۰');
  assert.equal(toEn('۱۲۳'), '123');
  assert.equal(toFa(2026), '۲۰۲۶');
  assert.equal(minutesBetween('22:00', '00:30'), 150);
});

const data = {
  sessions: [
    { id: 1, date: '2026-09-30', subject: 'ریاضی', topic: 'مشتق', minutes: 90, done: true },
    { id: 2, date: '2026-09-30', subject: 'فیزیک', topic: '', minutes: 120, done: true },
    { id: 3, date: '2026-09-30', subject: 'شیمی', topic: '', minutes: 60, done: false },
    { id: 4, date: '2026-09-29', subject: 'ریاضی', topic: '', minutes: 30, done: true },
    { id: 5, date: '2026-09-28', subject: 'ریاضی', topic: '', minutes: 200, done: true },
    { id: 6, date: '2026-09-20', subject: 'ریاضی', topic: '', minutes: 50, done: true },
  ],
  plans: [
    { id: 1, date: '2026-09-30', subject: 'ریاضی', topic: 'حد', done: true },
    { id: 2, date: '2026-09-30', subject: 'فیزیک', topic: 'حرکت', done: false, reason: 'خسته بودم' },
  ],
  tests: [{ id: 1, date: '2026-09-30', subject: 'ریاضی', total: 30, correct: 24, wrong: 4, blank: 2, percent: 75.6 }],
};

test('خلاصه‌ی روز', () => {
  const d = summarizeDay('2026-09-30', data);
  assert.equal(d.minutes, 210);
  assert.equal(d.sessionCount, 2);
  assert.equal(d.testCount, 30);
  assert.equal(d.planPercent, 50);
});

test('خلاصه‌ی بازه و رکورد', () => {
  const r = summarizeRange('2026-09-26', '2026-10-02', data, '2026-09-30');
  assert.equal(r.minutes, 440);
  assert.equal(r.elapsedDays, 5);
  assert.equal(r.avgDaily, 88);
  assert.equal(r.bestDay.date, '2026-09-30');
  const map = minutesByDate(data.sessions);
  assert.equal(recordDay(map).minutes, 210);
  assert.deepEqual(computeStreak(map, '2026-09-30'), { current: 3, longest: 3 });
  // امروز هنوز مطالعه‌ای نشده: زنجیره نباید بشکند
  assert.equal(computeStreak(map, '2026-10-01').current, 3);
  assert.equal(computeStreak(map, '2026-10-03').current, 0);
});

test('گزارش', () => {
  const text = buildReport('2026-09-30', { ...data, note: 'روز خوبی بود' }, DEFAULT_SETTINGS, '2026-09-30');
  assert.match(text, /^گزارش مطالعه امروز/);
  assert.match(text, /مجموع مطالعه: ۳ ساعت و ۳۰ دقیقه/);
  assert.match(text, /- ریاضی — مبحث مشتق — ۱ ساعت و ۳۰ دقیقه/);
  assert.match(text, /۳۰ تست — ۲۴ درست — ۴ غلط — ۲ نزده/);
  assert.match(text, /\(دلیل: خسته بودم\)/);
  assert.match(text, /روز خوبی بود/);
  assert.doesNotMatch(text, /شیمی/);
  const plain = buildReport('2026-09-30', data, { ...DEFAULT_SETTINGS, report: { ...DEFAULT_SETTINGS.report, emoji: false } }, '2026-09-30');
  assert.doesNotMatch(plain, /📅/);
  const old = buildReport('2026-09-29', { ...data, note: '' }, DEFAULT_SETTINGS, '2026-09-30');
  assert.match(old, /^گزارش مطالعه ۱۴۰۵\/۰۷\/۰۷/);
});

test('تاریخ شمسی و هفته', () => {
  assert.deepEqual(isoToJalali('2026-09-30'), { jy: 1405, jm: 7, jd: 8 });
  assert.equal(jalaliToISO(1405, 1, 1), '2026-03-21');
  assert.equal(startOfWeek('2026-09-30'), '2026-09-26'); // شنبه
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});
