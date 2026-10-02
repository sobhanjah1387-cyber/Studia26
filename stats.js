// محاسبات آماری. همه‌ی توابع خالص‌اند و فقط روی آرایه‌های داده کار می‌کنند.
import { addDays, eachDay, diffDays, todayISO } from './dates.js';

export const isDone = (s) => s.done !== false;

export function sumMinutes(sessions) {
  return sessions.reduce((acc, s) => acc + (isDone(s) ? s.minutes || 0 : 0), 0);
}

export function minutesByDate(sessions) {
  const map = new Map();
  for (const s of sessions) {
    if (!isDone(s)) continue;
    map.set(s.date, (map.get(s.date) || 0) + (s.minutes || 0));
  }
  return map;
}

export function inRange(list, start, end) {
  return list.filter((x) => x.date >= start && x.date <= end);
}

function average(nums) {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export function subjectBreakdown(sessions) {
  const map = new Map();
  for (const s of sessions) {
    if (!isDone(s) || !s.subject) continue;
    map.set(s.subject, (map.get(s.subject) || 0) + (s.minutes || 0));
  }
  return [...map.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

export function summarizeDay(date, data) {
  const sessions = data.sessions.filter((s) => s.date === date);
  const plans = data.plans.filter((p) => p.date === date);
  const tests = data.tests.filter((t) => t.date === date);
  const plansDone = plans.filter((p) => p.done).length;
  return {
    date,
    minutes: sumMinutes(sessions),
    sessionCount: sessions.filter(isDone).length,
    testCount: tests.reduce((a, t) => a + (t.total || 0), 0),
    testEntries: tests.length,
    avgPercent: average(tests.map((t) => t.percent)),
    plansTotal: plans.length,
    plansDone,
    plansPending: plans.length - plansDone,
    planPercent: plans.length ? Math.round((plansDone / plans.length) * 100) : 0,
  };
}

export function summarizeRange(start, end, data, today = todayISO()) {
  const sessions = inRange(data.sessions, start, end);
  const plans = inRange(data.plans, start, end);
  const tests = inRange(data.tests, start, end);
  const byDate = minutesByDate(sessions);

  const days = eachDay(start, end);
  const lastCounted = end < today ? end : today;
  const elapsedDays = start > today ? 0 : diffDays(lastCounted, start) + 1;

  const perDay = days.map((date) => ({
    date,
    minutes: byDate.get(date) || 0,
    tests: tests.filter((t) => t.date === date).reduce((a, t) => a + (t.total || 0), 0),
    plansTotal: plans.filter((p) => p.date === date).length,
    plansDone: plans.filter((p) => p.date === date && p.done).length,
  }));

  const minutes = sumMinutes(sessions);
  let bestDay = null;
  for (const [date, m] of byDate) {
    if (!bestDay || m > bestDay.minutes) bestDay = { date, minutes: m };
  }
  const plansDone = plans.filter((p) => p.done).length;

  return {
    start,
    end,
    dayCount: days.length,
    elapsedDays,
    minutes,
    avgDaily: elapsedDays ? Math.round(minutes / elapsedDays) : 0,
    sessionCount: sessions.filter(isDone).length,
    testCount: tests.reduce((a, t) => a + (t.total || 0), 0),
    studyDays: byDate.size,
    bestDay,
    plansDone,
    plansPending: plans.length - plansDone,
    plansTotal: plans.length,
    avgPercent: average(tests.map((t) => t.percent)),
    perDay,
    bySubject: subjectBreakdown(sessions),
    testSeries: [...tests].sort((a, b) => (a.date < b.date ? -1 : 1)).map((t) => ({ date: t.date, percent: t.percent })),
  };
}

/** رکورد روزهای پشت‌سرهم مطالعه. اگر امروز هنوز مطالعه‌ای ثبت نشده، زنجیره از دیروز حساب می‌شود. */
export function computeStreak(minutesMap, today = todayISO()) {
  let cursor = minutesMap.get(today) > 0 ? today : addDays(today, -1);
  let current = 0;
  while (minutesMap.get(cursor) > 0) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  const dates = [...minutesMap.entries()].filter(([, m]) => m > 0).map(([d]) => d).sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    run = prev && diffDays(d, prev) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

export function recordDay(minutesMap) {
  let best = null;
  for (const [date, minutes] of minutesMap) {
    if (minutes > 0 && (!best || minutes > best.minutes)) best = { date, minutes };
  }
  return best;
}
