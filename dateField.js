// انتخاب تاریخ شمسی با سه Select (موبایل‌پسند و بدون وابستگی)
import { h } from '../utils/dom.js';
import { MONTH_NAMES, isoToJalali, jalaliToISO, jalaliMonthLength, todayISO } from '../utils/dates.js';
import { toFa } from '../utils/format.js';

export function dateField({ label = 'تاریخ', value = todayISO() } = {}) {
  const nowY = isoToJalali(todayISO()).jy;
  const cur = isoToJalali(value);
  const years = [];
  for (let y = Math.min(nowY - 3, cur.jy); y <= Math.max(nowY + 2, cur.jy); y += 1) years.push(y);

  const daySel = h('select', { class: 'input', 'aria-label': 'روز' });
  const monthSel = h(
    'select',
    { class: 'input', 'aria-label': 'ماه' },
    MONTH_NAMES.map((m, i) => h('option', { value: i + 1 }, m)),
  );
  const yearSel = h(
    'select',
    { class: 'input', 'aria-label': 'سال' },
    years.map((y) => h('option', { value: y }, toFa(y))),
  );

  function fillDays(selectedDay) {
    const len = jalaliMonthLength(Number(yearSel.value), Number(monthSel.value));
    daySel.innerHTML = '';
    for (let d = 1; d <= len; d += 1) daySel.append(h('option', { value: d }, toFa(d)));
    daySel.value = String(Math.min(selectedDay, len));
  }

  yearSel.value = String(cur.jy);
  monthSel.value = String(cur.jm);
  fillDays(cur.jd);
  yearSel.addEventListener('change', () => fillDays(Number(daySel.value)));
  monthSel.addEventListener('change', () => fillDays(Number(daySel.value)));

  const el = h(
    'div',
    { class: 'field' },
    h('span', { class: 'label' }, label),
    h('div', { class: 'grid-3', style: { gridTemplateColumns: '0.8fr 1.3fr 1fr' } }, daySel, monthSel, yearSel),
  );

  return {
    el,
    get value() {
      return jalaliToISO(Number(yearSel.value), Number(monthSel.value), Number(daySel.value));
    },
  };
}
