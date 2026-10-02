import { h } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { pageHead, planCard, sessionCard, testCard, marker, emptyState } from '../components/common.js';
import { openPlanForm, openSessionForm, openTestForm, openDuplicateForm } from '../components/forms.js';
import { getState } from '../services/store.js';
import { ui } from '../services/ui.js';
import {
  WEEK_HEADER, todayISO, jalaliMonthStart, jalaliDaysInMonth, shiftJalaliMonth, weekdayIndex, addDays, isoToJalali,
} from '../utils/dates.js';
import { formatMonthTitle, formatDateLong, formatDateFriendly, formatDuration, toFa } from '../utils/format.js';
import { summarizeDay, isDone } from '../utils/stats.js';

function dayStatus(date, data) {
  const hasStudy = data.sessions.some((s) => s.date === date && isDone(s) && s.minutes > 0);
  const plans = data.plans.filter((p) => p.date === date);
  let plan = null;
  if (plans.length) plan = plans.every((p) => p.done) ? 'full' : 'part';
  return { hasStudy, plan };
}

function calendar() {
  const data = getState();
  const today = todayISO();
  const first = jalaliMonthStart(ui.calendarMonth);
  const len = jalaliDaysInMonth(first);
  const offset = weekdayIndex(first);

  const grid = h('div', { class: 'cal-grid' }, WEEK_HEADER.map((d) => h('div', { class: 'cal-dow' }, d)));
  for (let i = 0; i < offset; i += 1) grid.append(h('div'));
  for (let n = 0; n < len; n += 1) {
    const date = addDays(first, n);
    const st = dayStatus(date, data);
    const classes = ['cal-day'];
    if (date === today) classes.push('today');
    if (date === ui.date) classes.push('selected');
    if (weekdayIndex(date) === 6) classes.push('friday');
    const dots = h('span', { class: 'dots' });
    if (st.hasStudy) dots.append(h('i', { class: 'dot-study' }));
    if (st.plan === 'full') dots.append(h('i', { class: 'dot-full' }));
    if (st.plan === 'part') dots.append(h('i', { class: 'dot-part' }));
    grid.append(
      h(
        'button',
        {
          class: classes.join(' '),
          type: 'button',
          'aria-label': formatDateLong(date),
          'aria-pressed': String(date === ui.date),
          onclick: () => { ui.date = date; rerender(); },
        },
        h('span', { class: 'num' }, toFa(isoToJalali(date).jd)),
        dots,
      ),
    );
  }

  return h(
    'section',
    { class: 'card' },
    h(
      'div',
      { class: 'cal-head' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ماه بعد', onclick: () => { ui.calendarMonth = shiftJalaliMonth(first, 1); rerender(); } }, icon('prev')),
      h('h2', null, formatMonthTitle(first)),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ماه قبل', onclick: () => { ui.calendarMonth = shiftJalaliMonth(first, -1); rerender(); } }, icon('next')),
    ),
    grid,
    h(
      'div',
      { class: 'legend' },
      h('span', null, h('i', { class: 'dot-study' }), 'مطالعه ثبت شده'),
      h('span', null, h('i', { class: 'dot-full' }), 'برنامه کامل'),
      h('span', null, h('i', { class: 'dot-part' }), 'برنامه ناقص'),
    ),
    h('div', { class: 'row', style: { marginTop: '10px', justifyContent: 'center' } },
      h('button', { class: 'btn small soft', type: 'button', onclick: () => { ui.date = todayISO(); ui.calendarMonth = todayISO(); rerender(); } }, 'برو به امروز')),
  );
}

let rerenderFn = () => {};
function rerender() { rerenderFn(); }

export function renderPlan(requestRender) {
  rerenderFn = requestRender;
  const data = getState();
  const date = ui.date;
  const sum = summarizeDay(date, data);
  const plans = data.plans.filter((p) => p.date === date).sort((a, b) => a.createdAt - b.createdAt);
  const sessions = data.sessions.filter((s) => s.date === date).sort((a, b) => (a.start || '').localeCompare(b.start || '') || a.createdAt - b.createdAt);
  const tests = data.tests.filter((t) => t.date === date).sort((a, b) => a.createdAt - b.createdAt);

  const prefillStudy = (plan) =>
    openSessionForm({ date, prefill: { subject: plan.subject, topic: plan.topic, minutes: plan.minutes } });

  const summary = h(
    'section',
    { class: 'card stack' },
    h('div', { class: 'section-head' }, h('h2', null, formatDateFriendly(date)), h('span', { class: 'muted small' }, formatDateLong(date))),
    sum.plansTotal ? marker(sum.planPercent, 'thin') : null,
    h(
      'div',
      { class: 'chips' },
      h('span', { class: 'chip' }, `مطالعه: ${formatDuration(sum.minutes)}`),
      h('span', { class: 'chip' }, `تست: ${toFa(sum.testCount)}`),
      h('span', { class: 'chip' }, `برنامه: ${toFa(sum.plansDone)} از ${toFa(sum.plansTotal)}`),
    ),
    h(
      'div',
      { class: 'row wrap' },
      h('button', { class: 'btn small soft', type: 'button', onclick: () => { location.hash = '#/report'; } }, icon('report'), 'گزارش این روز'),
      plans.length ? h('button', { class: 'btn small', type: 'button', onclick: () => openDuplicateForm({ fromDate: date }) }, icon('copy'), 'کپی برنامه به روز دیگر') : null,
    ),
  );

  const planSection = h(
    'section',
    { class: 'stack' },
    h('div', { class: 'section-head' }, h('h2', null, 'برنامه‌ی روز'),
      h('button', { class: 'btn small primary', type: 'button', onclick: () => openPlanForm({ date }) }, icon('plus'), 'افزودن')),
    plans.length
      ? plans.map((p) => planCard(p, { onEdit: (x) => openPlanForm({ plan: x }), onStudy: prefillStudy }))
      : emptyState('برنامه‌ای نیست', 'برای این روز چیزی نچیده‌ای. با «افزودن» شروع کن.'),
  );

  const sessionSection = h(
    'section',
    { class: 'stack' },
    h('div', { class: 'section-head' }, h('h2', null, 'مطالعه‌ها'),
      h('button', { class: 'btn small', type: 'button', onclick: () => openSessionForm({ date }) }, icon('plus'), 'ثبت')),
    sessions.length ? sessions.map((s) => sessionCard(s, { onEdit: (x) => openSessionForm({ session: x }) })) : h('p', { class: 'muted small' }, 'جلسه‌ای ثبت نشده.'),
  );

  const testSection = h(
    'section',
    { class: 'stack' },
    h('div', { class: 'section-head' }, h('h2', null, 'تست‌ها'),
      h('button', { class: 'btn small', type: 'button', onclick: () => openTestForm({ date }) }, icon('plus'), 'ثبت')),
    tests.length ? tests.map((t) => testCard(t, { onEdit: (x) => openTestForm({ test: x }) })) : h('p', { class: 'muted small' }, 'تستی ثبت نشده.'),
  );

  return h('div', { class: 'page' }, pageHead('برنامه و تقویم', 'یک روز را انتخاب کن و همه‌چیزش را ببین'), calendar(), summary, planSection, sessionSection, testSection);
}
