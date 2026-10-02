import { h } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { pageHead, dayStepper, sessionCard, marker, emptyState } from '../components/common.js';
import { openSessionForm } from '../components/forms.js';
import { getState, getSettings } from '../services/store.js';
import { ui } from '../services/ui.js';
import { sumMinutes } from '../utils/stats.js';
import { formatClock, formatDuration, toFa } from '../utils/format.js';
import { isDone } from '../utils/stats.js';

export function renderStudy(requestRender) {
  const date = ui.date;
  const settings = getSettings();
  const sessions = getState()
    .sessions.filter((s) => s.date === date)
    .sort((a, b) => (a.start || '').localeCompare(b.start || '') || a.createdAt - b.createdAt);
  const total = sumMinutes(sessions);
  const goal = settings.dailyGoalMinutes;

  const summary = h(
    'section',
    { class: 'card stack' },
    h(
      'div',
      { class: 'section-head' },
      h('div', null, h('div', { class: 'card-title' }, 'مجموع مطالعه'), h('div', { class: 'hero-time num', style: { fontSize: '34px' } }, formatDuration(total))),
      goal ? h('div', { class: 'muted small num' }, `هدف: ${formatClock(goal)} ساعت`) : null,
    ),
    goal ? marker((total / goal) * 100) : null,
    h('div', { class: 'muted small' }, `${toFa(sessions.filter(isDone).length)} جلسه‌ی انجام‌شده`),
  );

  return h(
    'div',
    { class: 'page' },
    pageHead('مطالعه', 'ساعت‌های درس‌خواندنت'),
    dayStepper(date, (d) => { ui.date = d; requestRender(); }),
    summary,
    h('button', { class: 'btn primary big block', type: 'button', onclick: () => openSessionForm({ date }) }, icon('plus'), 'ثبت جلسه‌ی مطالعه'),
    sessions.length
      ? h('div', { class: 'stack' }, sessions.map((s) => sessionCard(s, { onEdit: (x) => openSessionForm({ session: x }) })))
      : emptyState('هنوز جلسه‌ای ثبت نشده', 'بعد از هر دور درس‌خواندن، مدتش را همین‌جا ثبت کن.'),
  );
}
