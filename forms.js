// فرم‌های ثبت/ویرایش: جلسه‌ی مطالعه، برنامه، تست و کپی برنامه
import { h } from '../utils/dom.js';
import { openSheet } from './modal.js';
import { showToast } from './toast.js';
import { dateField } from './dateField.js';
import { subjectField } from './subjectField.js';
import { icon } from './icons.js';
import { add, update, getState } from '../services/store.js';
import { STUDY_TYPES } from '../data/defaults.js';
import { minutesBetween, toEn, toInt, formatDateLong, formatDuration, toFa } from '../utils/format.js';
import { normalizeTest, calcPercent } from '../utils/testMath.js';
import { todayISO } from '../utils/dates.js';
import { formatPercent } from '../utils/format.js';
import { uid } from '../utils/id.js';

const numInput = (props = {}) =>
  h('input', { class: 'input num', type: 'text', inputmode: 'numeric', pattern: '[0-9۰-۹]*', autocomplete: 'off', ...props });

function field(label, control, hint) {
  return h('div', { class: 'field' }, h('label', null, label), control, hint ? h('span', { class: 'hint' }, hint) : null);
}

function unitInput(input, unit) {
  return h('div', { class: 'input-unit' }, input, h('span', null, unit));
}

function statusToggle(initial, { yes = 'انجام شد', no = 'انجام نشد' } = {}) {
  let done = initial;
  const bYes = h('button', { type: 'button', class: 'ok' }, yes);
  const bNo = h('button', { type: 'button', class: 'no' }, no);
  const sync = () => {
    bYes.setAttribute('aria-pressed', String(done));
    bNo.setAttribute('aria-pressed', String(!done));
  };
  bYes.onclick = () => { done = true; sync(); };
  bNo.onclick = () => { done = false; sync(); };
  sync();
  return { el: h('div', { class: 'segmented', role: 'group' }, bYes, bNo), get value() { return done; } };
}

function errorBox() {
  const el = h('div', { class: 'error', role: 'alert', hidden: true });
  return {
    el,
    show(msg) {
      el.textContent = msg;
      el.hidden = false;
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    },
  };
}

function actions(api, saveLabel) {
  return h(
    'div',
    { class: 'sheet-actions' },
    h('button', { class: 'btn', type: 'button', onclick: api.close }, 'انصراف'),
    h('button', { class: 'btn primary', type: 'submit' }, saveLabel),
  );
}

// ---------------------------------------------------------------- جلسه‌ی مطالعه
export function openSessionForm({ session = null, date = todayISO(), prefill = {} } = {}) {
  const init = { ...prefill, ...(session || {}) };
  const isEdit = Boolean(session);

  openSheet({
    title: isEdit ? 'ویرایش جلسه‌ی مطالعه' : 'ثبت مطالعه',
    content: (api) => {
      const dateCtl = dateField({ value: init.date || date });
      const subject = subjectField({ value: init.subject || '' });
      const topic = h('input', { class: 'input', type: 'text', value: init.topic || '', placeholder: 'مثلاً مشتق و کاربرد آن', enterkeyhint: 'next' });
      const hours = numInput({ placeholder: '۰', value: init.minutes ? String(Math.floor(init.minutes / 60)) : '' });
      const mins = numInput({ placeholder: '۰', value: init.minutes ? String(init.minutes % 60) : '' });
      const start = h('input', { class: 'input', type: 'time', value: init.start || '' });
      const end = h('input', { class: 'input', type: 'time', value: init.end || '' });
      const type = h('select', { class: 'input' }, STUDY_TYPES.map((t) => h('option', { value: t }, t)));
      type.value = init.type && STUDY_TYPES.includes(init.type) ? init.type : STUDY_TYPES[0];
      const note = h('textarea', { class: 'input', placeholder: 'اختیاری', rows: 2 }, init.note || '');
      const status = statusToggle(init.done !== false);
      const err = errorBox();

      let durationTouched = Boolean(init.minutes);
      [hours, mins].forEach((i) => i.addEventListener('input', () => { durationTouched = true; }));
      const autoDuration = () => {
        if (!start.value || !end.value) return;
        const total = minutesBetween(start.value, end.value);
        if (!durationTouched || (!toInt(hours.value) && !toInt(mins.value))) {
          hours.value = String(Math.floor(total / 60));
          mins.value = String(total % 60);
          durationTouched = false;
        }
      };
      start.addEventListener('change', autoDuration);
      end.addEventListener('change', autoDuration);

      const form = h(
        'form',
        { class: 'stack', novalidate: true, style: { gap: '14px' } },
        dateCtl.el,
        subject.el,
        field('مبحث', topic),
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'مدت مطالعه'),
          h('div', { class: 'grid-2' }, unitInput(hours, 'ساعت'), unitInput(mins, 'دقیقه'))),
        h('div', { class: 'grid-2' }, field('ساعت شروع', start), field('ساعت پایان', end)),
        field('نوع مطالعه', type),
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'وضعیت'), status.el),
        field('توضیحات', note),
        err.el,
        actions(api, isEdit ? 'ذخیره‌ی تغییرات' : 'ثبت مطالعه'),
      );

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        let minutes = toInt(hours.value) * 60 + toInt(mins.value);
        if (!minutes && start.value && end.value) minutes = minutesBetween(start.value, end.value);
        if (!subject.value) return err.show('نام درس را وارد کن.');
        if (status.value && minutes <= 0) return err.show('مدت مطالعه را وارد کن (یا ساعت شروع و پایان).');
        const data = {
          date: dateCtl.value,
          subject: subject.value,
          topic: topic.value.trim(),
          minutes,
          start: start.value,
          end: end.value,
          type: type.value,
          note: note.value.trim(),
          done: status.value,
        };
        if (isEdit) update('sessions', session.id, data);
        else add('sessions', data);
        api.close();
        showToast(isEdit ? 'تغییرات ذخیره شد' : `ثبت شد: ${formatDuration(minutes)} ${data.subject}`);
      });
      return form;
    },
  });
}

// ---------------------------------------------------------------- برنامه
export function openPlanForm({ plan = null, date = todayISO() } = {}) {
  const isEdit = Boolean(plan);
  const init = plan || {};

  openSheet({
    title: isEdit ? 'ویرایش برنامه' : 'افزودن به برنامه',
    content: (api) => {
      const dateCtl = dateField({ value: init.date || date });
      const subject = subjectField({ value: init.subject || '' });
      const topic = h('input', { class: 'input', type: 'text', value: init.topic || '', placeholder: 'مثلاً فصل دوم', enterkeyhint: 'next' });
      const hours = numInput({ placeholder: '۰', value: init.minutes ? String(Math.floor(init.minutes / 60)) : '' });
      const mins = numInput({ placeholder: '۰', value: init.minutes ? String(init.minutes % 60) : '' });
      const note = h('textarea', { class: 'input', rows: 2, placeholder: 'اختیاری' }, init.note || '');
      const status = statusToggle(Boolean(init.done), { yes: 'انجام شده', no: 'انجام نشده' });
      const reason = h('input', { class: 'input', type: 'text', value: init.reason || '', placeholder: 'مثلاً وقت کم آوردم' });
      const reasonField = field('دلیل انجام نشدن', reason);
      const err = errorBox();

      const syncReason = () => { reasonField.hidden = status.value || !isEdit; };
      status.el.addEventListener('click', syncReason);
      syncReason();

      const form = h(
        'form',
        { class: 'stack', novalidate: true, style: { gap: '14px' } },
        dateCtl.el,
        subject.el,
        field('مبحث', topic),
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'زمان یا مدت موردنظر'),
          h('div', { class: 'grid-2' }, unitInput(hours, 'ساعت'), unitInput(mins, 'دقیقه'))),
        field('توضیحات', note),
        isEdit ? h('div', { class: 'field' }, h('span', { class: 'label' }, 'وضعیت'), status.el) : null,
        isEdit ? reasonField : null,
        err.el,
        actions(api, isEdit ? 'ذخیره‌ی تغییرات' : 'افزودن'),
      );

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!subject.value) return err.show('نام درس را وارد کن.');
        const done = isEdit ? status.value : false;
        const data = {
          date: dateCtl.value,
          subject: subject.value,
          topic: topic.value.trim(),
          minutes: toInt(hours.value) * 60 + toInt(mins.value),
          note: note.value.trim(),
          done,
          reason: done ? '' : isEdit ? reason.value.trim() : '',
        };
        if (isEdit) update('plans', plan.id, data);
        else add('plans', data);
        api.close();
        showToast(isEdit ? 'تغییرات ذخیره شد' : 'به برنامه اضافه شد');
      });
      return form;
    },
  });
}

// ---------------------------------------------------------------- تست
export function openTestForm({ test = null, date = todayISO() } = {}) {
  const isEdit = Boolean(test);
  const init = test || {};

  openSheet({
    title: isEdit ? 'ویرایش تست' : 'ثبت تست',
    content: (api) => {
      const dateCtl = dateField({ value: init.date || date });
      const subject = subjectField({ value: init.subject || '' });
      const topic = h('input', { class: 'input', type: 'text', value: init.topic || '', placeholder: 'مثلاً تابع و حد', enterkeyhint: 'next' });
      const source = h('input', { class: 'input', type: 'text', value: init.source || '', placeholder: 'مثلاً آزمون قلم‌چی یا کتاب مبتکران', enterkeyhint: 'next' });
      const total = numInput({ value: init.total ? String(init.total) : '', placeholder: '۰' });
      const correct = numInput({ value: isEdit ? String(init.correct) : '', placeholder: '۰' });
      const wrong = numInput({ value: isEdit ? String(init.wrong) : '', placeholder: '۰' });
      const blank = numInput({ value: isEdit ? String(init.blank) : '', placeholder: '۰' });
      const hours = numInput({ placeholder: '۰', value: init.minutes ? String(Math.floor(init.minutes / 60)) : '' });
      const mins = numInput({ placeholder: '۰', value: init.minutes ? String(init.minutes % 60) : '' });
      const note = h('textarea', { class: 'input', rows: 2, placeholder: 'اختیاری' }, init.note || '');
      const err = errorBox();
      const percentEl = h('b', { class: 'num' }, '—');
      const percentBox = h('div', { class: 'card flat row', style: { justifyContent: 'space-between' } },
        h('span', { class: 'muted' }, 'درصد (محاسبه‌ی خودکار)'), percentEl);

      let blankTouched = isEdit && !init.total;
      blank.addEventListener('input', () => { blankTouched = true; });

      const recalc = () => {
        const t = toInt(total.value);
        const c = toInt(correct.value);
        const w = toInt(wrong.value);
        if (t > 0 && !blankTouched) blank.value = String(Math.max(0, t - c - w));
        if (t > 0) {
          blank.readOnly = true;
          blank.value = String(Math.max(0, t - c - w));
        } else {
          blank.readOnly = false;
        }
        const res = normalizeTest({ total: t, correct: c, wrong: w, blank: toInt(blank.value) });
        percentEl.textContent = res.ok ? formatPercent(res.value.percent) : '—';
      };
      [total, correct, wrong, blank].forEach((i) => i.addEventListener('input', recalc));
      recalc();

      const form = h(
        'form',
        { class: 'stack', novalidate: true, style: { gap: '14px' } },
        dateCtl.el,
        subject.el,
        field('مبحث', topic),
        field('نام آزمون یا منبع', source),
        field('تعداد کل تست', total),
        h('div', { class: 'grid-3' }, field('درست', correct), field('غلط', wrong),
          field('نزده', blank)),
        h('span', { class: 'hint muted small' }, 'اگر تعداد کل را بنویسی، «نزده» خودکار حساب می‌شود؛ اگر ننویسی، کل = درست + غلط + نزده.'),
        percentBox,
        h('div', { class: 'field' }, h('span', { class: 'label' }, 'زمان صرف‌شده'),
          h('div', { class: 'grid-2' }, unitInput(hours, 'ساعت'), unitInput(mins, 'دقیقه'))),
        field('توضیحات', note),
        err.el,
        actions(api, isEdit ? 'ذخیره‌ی تغییرات' : 'ثبت تست'),
      );

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!subject.value) return err.show('نام درس را وارد کن.');
        const res = normalizeTest({
          total: toInt(total.value),
          correct: toInt(correct.value),
          wrong: toInt(wrong.value),
          blank: toInt(blank.value),
        });
        if (!res.ok) return err.show(res.error);
        const data = {
          date: dateCtl.value,
          subject: subject.value,
          topic: topic.value.trim(),
          source: source.value.trim(),
          ...res.value,
          minutes: toInt(hours.value) * 60 + toInt(mins.value),
          note: note.value.trim(),
        };
        if (isEdit) update('tests', test.id, data);
        else add('tests', data);
        api.close();
        showToast(isEdit ? 'تغییرات ذخیره شد' : `تست ثبت شد: ${formatPercent(data.percent)}`);
      });
      return form;
    },
  });
}

// ---------------------------------------------------------------- کپی برنامه‌ی یک روز
export function openDuplicateForm({ fromDate }) {
  const plans = getState().plans.filter((p) => p.date === fromDate);
  if (!plans.length) {
    showToast('برای این روز برنامه‌ای نیست.');
    return;
  }
  openSheet({
    title: 'کپی برنامه به روز دیگر',
    content: (api) => {
      const target = dateField({ label: 'کپی به تاریخ', value: todayISO() === fromDate ? todayISO() : todayISO() });
      const err = errorBox();
      const form = h(
        'form',
        { class: 'stack', novalidate: true, style: { gap: '14px' } },
        h('p', { class: 'muted' }, `${toFa(plans.length)} آیتم از برنامه‌ی ${formatDateLong(fromDate)} کپی می‌شود (بدون تیک انجام).`),
        target.el,
        err.el,
        actions(api, 'کپی برنامه'),
      );
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (target.value === fromDate) return err.show('تاریخ مقصد باید با روز مبدأ فرق داشته باشد.');
        plans.forEach((p) =>
          add('plans', {
            id: uid(),
            date: target.value,
            subject: p.subject,
            topic: p.topic,
            minutes: p.minutes,
            note: p.note,
            done: false,
            reason: '',
          }),
        );
        api.close();
        showToast(`${toFa(plans.length)} آیتم به ${formatDateLong(target.value)} کپی شد`);
      });
      return form;
    },
  });
}

export { icon, calcPercent };
