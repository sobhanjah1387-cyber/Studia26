// اجزای مشترک صفحه‌ها: هدر، انتخاب روز، کارت‌های برنامه/مطالعه/تست
import { h } from '../utils/dom.js';
import { icon } from './icons.js';
import { showToast } from './toast.js';
import { confirmDialog } from './modal.js';
import { remove, restore, update } from '../services/store.js';
import { addDays, todayISO } from '../utils/dates.js';
import {
  formatDateFriendly, formatDateLong, formatDuration, formatPercent, formatTimeFa, toFa,
} from '../utils/format.js';
import { isDone } from '../utils/stats.js';

export function pageHead(title, subtitle) {
  return h('header', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, title), subtitle ? h('p', null, subtitle) : null));
}

/** انتخاب روز با دکمه‌های قبلی/بعدی. onChange(iso) */
export function dayStepper(date, onChange) {
  const today = todayISO();
  return h(
    'div',
    { class: 'stepper' },
    h('button', { class: 'nav', type: 'button', 'aria-label': 'روز بعد', onclick: () => onChange(addDays(date, 1)) }, icon('prev')),
    h(
      'button',
      { class: 'mid-btn', type: 'button', 'aria-label': 'برگشت به امروز', onclick: () => onChange(today) },
      h('div', { class: 'mid' }, h('b', null, formatDateFriendly(date)), h('span', null, date === today ? formatDateLong(date) : `${formatDateLong(date)} · برای برگشت به امروز بزن`)),
    ),
    h('button', { class: 'nav', type: 'button', 'aria-label': 'روز قبل', onclick: () => onChange(addDays(date, -1)) }, icon('next')),
  );
}

export function marker(percent, extra = '') {
  const fill = h('i');
  const bar = h('div', { class: `marker-bar ${extra}${percent >= 100 ? ' done' : ''}`, role: 'progressbar', 'aria-valuenow': String(Math.round(percent)), 'aria-valuemin': '0', 'aria-valuemax': '100' }, fill);
  requestAnimationFrame(() => {
    fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  });
  return bar;
}

export function emptyState(title, text) {
  return h('div', { class: 'empty' }, h('b', null, title), text);
}

/** حذف با امکان Undo */
export function deleteWithUndo(collection, row, label) {
  const removed = remove(collection, row.id);
  if (!removed) return;
  showToast(`${label} حذف شد`, { actionLabel: 'بازگردانی', onAction: () => restore(collection, removed) });
}

export async function confirmAndDelete(collection, row, label) {
  const ok = await confirmDialog({ title: `حذف ${label}`, message: 'این مورد حذف شود؟ بعد از حذف می‌توانی چند ثانیه فرصت بازگردانی داشته باشی.', confirmText: 'حذف', danger: true });
  if (ok) deleteWithUndo(collection, row, label);
}

function actionButtons(onEdit, onDelete, extra) {
  return h(
    'div',
    { class: 'actions-row' },
    extra || null,
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ویرایش', onclick: onEdit }, icon('edit')),
    h('button', { class: 'icon-btn danger', type: 'button', 'aria-label': 'حذف', onclick: onDelete }, icon('trash')),
  );
}

export function titleOf(row) {
  return h('div', { class: 'title' }, row.subject || 'بدون درس', row.topic ? h('span', { class: 't-topic muted' }, ` — ${row.topic}`) : null);
}

/** کارت یک آیتم برنامه با Checkbox */
export function planCard(plan, { onEdit, onStudy }) {
  const state = plan.done ? 'done' : 'pending';
  const check = h(
    'button',
    {
      class: 'check',
      type: 'button',
      role: 'checkbox',
      'aria-checked': String(plan.done),
      'aria-label': plan.done ? 'انجام شده' : 'انجام نشده',
      onclick: () => update('plans', plan.id, { done: !plan.done, reason: plan.done ? plan.reason : '' }),
    },
    icon('check'),
  );
  const canExplain = !plan.done && plan.date <= todayISO();
  const reason = canExplain
    ? h('div', { class: 'reason' }, h('input', {
        class: 'input',
        type: 'text',
        value: plan.reason || '',
        placeholder: 'اگر انجام نشد، دلیلش را بنویس',
        'aria-label': 'دلیل انجام نشدن',
        onchange: (e) => update('plans', plan.id, { reason: e.target.value.trim() }, true),
      }))
    : null;

  return h(
    'div',
    { class: 'item', dataset: { state } },
    check,
    h(
      'div',
      { class: 'body' },
      titleOf(plan),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: `badge ${plan.done ? 'ok' : 'no'}` }, plan.done ? 'انجام شد' : 'در انتظار'),
        plan.minutes ? h('span', { class: 'badge' }, formatDuration(plan.minutes)) : null,
      ),
      plan.note ? h('div', { class: 'note' }, plan.note) : null,
      reason,
      actionButtons(
        () => onEdit(plan),
        () => confirmAndDelete('plans', plan, 'برنامه'),
        onStudy
          ? h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'ثبت مطالعه برای این برنامه', title: 'ثبت مطالعه', onclick: () => onStudy(plan) }, icon('clock'))
          : null,
      ),
    ),
  );
}

export function sessionCard(session, { onEdit }) {
  const done = isDone(session);
  return h(
    'div',
    { class: 'item', dataset: { state: done ? 'done' : 'pending' } },
    h(
      'div',
      { class: 'body' },
      titleOf(session),
      h(
        'div',
        { class: 'meta' },
        h('span', { class: 'badge info' }, formatDuration(session.minutes)),
        h('span', { class: `badge ${done ? 'ok' : 'no'}` }, done ? 'انجام شد' : 'انجام نشد'),
        session.type ? h('span', { class: 'badge' }, session.type) : null,
        session.start && session.end ? h('span', { class: 'badge num' }, `${formatTimeFa(session.start)} تا ${formatTimeFa(session.end)}`) : null,
      ),
      session.note ? h('div', { class: 'note' }, session.note) : null,
      actionButtons(() => onEdit(session), () => confirmAndDelete('sessions', session, 'جلسه')),
    ),
  );
}

export function testCard(test, { onEdit }) {
  const cls = test.percent < 0 ? 'neg' : test.percent >= 60 ? 'good' : '';
  return h(
    'div',
    { class: 'item' },
    h(
      'div',
      { class: 'body' },
      titleOf(test),
      test.source ? h('div', { class: 'note' }, test.source) : null,
      h(
        'div',
        { class: 'mini-stats' },
        h('span', { class: 'badge' }, `${toFa(test.total)} تست`),
        h('span', { class: 'badge ok' }, `${toFa(test.correct)} درست`),
        h('span', { class: 'badge neg' }, `${toFa(test.wrong)} غلط`),
        h('span', { class: 'badge' }, `${toFa(test.blank)} نزده`),
        test.minutes ? h('span', { class: 'badge info' }, formatDuration(test.minutes)) : null,
      ),
      test.note ? h('div', { class: 'note' }, test.note) : null,
      actionButtons(() => onEdit(test), () => confirmAndDelete('tests', test, 'تست')),
    ),
    h('div', { class: `big-pct ${cls}` }, h('b', { class: 'num' }, formatPercent(test.percent)), h('span', null, 'درصد')),
  );
}
