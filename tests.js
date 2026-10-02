import { h } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { pageHead, dayStepper, testCard, marker, emptyState } from '../components/common.js';
import { openTestForm } from '../components/forms.js';
import { getState, getSettings } from '../services/store.js';
import { ui } from '../services/ui.js';
import { summarizeDay } from '../utils/stats.js';
import { formatPercent, toFa } from '../utils/format.js';

export function renderTests(requestRender) {
  const date = ui.date;
  const settings = getSettings();
  const tests = getState().tests.filter((t) => t.date === date).sort((a, b) => a.createdAt - b.createdAt);
  const sum = summarizeDay(date, getState());
  const goal = settings.dailyTestGoal;

  const summary = h(
    'section',
    { class: 'card stack' },
    h(
      'div',
      { class: 'section-head' },
      h('div', null, h('div', { class: 'card-title' }, 'تست‌های این روز'), h('div', { class: 'hero-time num', style: { fontSize: '34px' } }, toFa(sum.testCount))),
      tests.length ? h('div', { class: 'stat', style: { padding: 0, textAlign: 'end' } }, h('span', { class: 'l' }, 'میانگین درصد'), h('span', { class: 'v num' }, formatPercent(sum.avgPercent))) : null,
    ),
    goal ? marker((sum.testCount / goal) * 100) : null,
    goal ? h('div', { class: 'muted small num' }, `هدف روزانه: ${toFa(goal)} تست`) : null,
  );

  return h(
    'div',
    { class: 'page' },
    pageHead('تست', 'نتیجه‌ی تست‌هایی که زده‌ای'),
    dayStepper(date, (d) => { ui.date = d; requestRender(); }),
    summary,
    h('button', { class: 'btn primary big block', type: 'button', onclick: () => openTestForm({ date }) }, icon('plus'), 'ثبت تست'),
    tests.length
      ? h('div', { class: 'stack' }, tests.map((t) => testCard(t, { onEdit: (x) => openTestForm({ test: x }) })))
      : emptyState('تستی ثبت نشده', 'تعداد درست، غلط و نزده را بنویس؛ درصد خودکار حساب می‌شود.'),
  );
}
