import { h } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { marker } from '../components/common.js';
import { barChart } from '../components/charts.js';
import { openSessionForm, openTestForm } from '../components/forms.js';
import { getState, getSettings, dataForStats } from '../services/store.js';
import { ui, resetToToday } from '../services/ui.js';
import { summarizeDay, summarizeRange, computeStreak, minutesByDate, recordDay } from '../utils/stats.js';
import { todayISO, startOfWeek, endOfWeek, diffDays, weekdayIndex } from '../utils/dates.js';
import { formatClock, formatDuration, formatDateShort, formatPercent, toFa } from '../utils/format.js';
import { studyMessage, planMessage } from '../data/messages.js';

const DAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export function renderHome() {
  const settings = getSettings();
  const data = dataForStats();
  const today = todayISO();
  const day = summarizeDay(today, data);
  const week = summarizeRange(startOfWeek(today), endOfWeek(today), data, today);
  const goal = settings.dailyGoalMinutes;
  const goalPct = goal ? (day.minutes / goal) * 100 : 0;
  const seed = diffDays(today, '2026-01-01');

  const greeting = settings.name ? `سلام ${settings.name} 👋` : 'سلام 👋';

  const brand = h(
    'header',
    { class: 'brand' },
    h('img', { src: './icons/icon-192.png', alt: '', width: 44, height: 44 }),
    h(
      'div',
      null,
      h('div', { class: 'brand-name' }, 'Studia'),
      h('div', { class: 'brand-sub' }, `استودیا · ${greeting}`),
    ),
  );

  const hero = h(
    'section',
    { class: 'card hero' },
    h(
      'div',
      { class: 'hero-top' },
      h('div', null, h('div', { class: 'hero-label' }, 'مطالعه‌ی امروز'), h('div', { class: 'hero-time num' }, formatClock(day.minutes))),
      goal ? h('div', { class: 'hero-goal num' }, `از ${formatClock(goal)} ساعت`, h('br'), `${toFa(Math.round(goalPct))}٪ هدف`) : null,
    ),
    goal ? marker(goalPct) : null,
    h('p', { class: 'hero-msg' }, studyMessage(day.minutes, goal, seed)),
  );

  const quick = h(
    'div',
    { class: 'quick' },
    h('button', { class: 'q-study', type: 'button', onclick: () => openSessionForm({ date: today }) }, icon('clock'), 'ثبت مطالعه'),
    h('button', { class: 'q-test', type: 'button', onclick: () => openTestForm({ date: today }) }, icon('test'), 'ثبت تست'),
    h(
      'button',
      { class: 'q-report', type: 'button', onclick: () => { resetToToday(); location.hash = '#/report'; } },
      icon('report'),
      'ثبت گزارش',
    ),
  );

  const testGoal = settings.dailyTestGoal;
  const stats = h(
    'div',
    { class: 'stat-grid' },
    h(
      'div',
      { class: 'card stat' },
      h('span', { class: 'l' }, 'تست‌های امروز'),
      h('span', { class: 'v num' }, toFa(day.testCount)),
      testGoal ? h('span', { class: 's' }, `هدف: ${toFa(testGoal)} تست`) : null,
    ),
    h(
      'div',
      { class: 'card stat' },
      h('span', { class: 'l' }, 'انجام برنامه‌ی امروز'),
      h('span', { class: 'v num' }, day.plansTotal ? `${toFa(day.planPercent)}٪` : '—'),
      h('span', { class: 's' }, planMessage(day.plansDone, day.plansTotal)),
    ),
    h('div', { class: 'card stat ok' }, h('span', { class: 'l' }, 'برنامه‌ی انجام‌شده'), h('span', { class: 'v num' }, toFa(day.plansDone))),
    h('div', { class: 'card stat no' }, h('span', { class: 'l' }, 'برنامه‌ی انجام‌نشده'), h('span', { class: 'v num' }, toFa(day.plansPending))),
  );

  const parts = [brand, hero, quick, stats];

  // رکوردها
  const pills = [];
  const map = minutesByDate(data.sessions);
  if (settings.stats.streak) {
    const { current } = computeStreak(map, today);
    pills.push(h('span', { class: 'pill' }, icon('flame'), current ? `${toFa(current)} روز پشت‌سرهم` : 'زنجیره‌ات را شروع کن'));
  }
  if (settings.stats.record) {
    const rec = recordDay(map);
    if (rec) pills.push(h('span', { class: 'pill alt' }, icon('trophy'), `رکورد: ${formatClock(rec.minutes)} ساعت · ${formatDateShort(rec.date)}`));
  }
  if (pills.length) parts.push(h('div', { class: 'pills' }, pills));

  // خلاصه‌ی هفته
  const weeklyGoal = settings.weeklyGoalMinutes;
  const weekCard = h(
    'section',
    { class: 'card stack' },
    h('div', { class: 'section-head' }, h('h2', null, 'این هفته'), h('span', { class: 'muted num' }, formatDuration(week.minutes))),
  );
  if (weeklyGoal) {
    weekCard.append(marker((week.minutes / weeklyGoal) * 100, 'thin'));
    weekCard.append(h('div', { class: 'chart-foot num' }, h('span', null, `هدف هفته: ${formatClock(weeklyGoal)} ساعت`), h('span', null, `میانگین روزانه: ${formatDuration(week.avgDaily)}`)));
  }
  if (settings.stats.weekChart) {
    const best = Math.max(0, ...week.perDay.map((d) => d.minutes));
    weekCard.append(
      barChart(
        week.perDay.map((d) => ({
          label: DAY_LETTERS[weekdayIndex(d.date)],
          value: d.minutes,
          today: d.date === today,
          best: best > 0 && d.minutes === best,
          title: `${formatDateShort(d.date)}: ${formatDuration(d.minutes)}`,
        })),
        { height: 130 },
      ),
    );
  }
  parts.push(weekCard);

  return h('div', { class: 'page' }, parts);
}
