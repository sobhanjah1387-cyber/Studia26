// فیلد درس: ورودی آزاد + پیشنهادها + دکمه‌های میان‌بر
import { h } from '../utils/dom.js';
import { DEFAULT_SUBJECTS } from '../data/defaults.js';
import { subjectsUsed } from '../services/store.js';

let counter = 0;

export function subjectField({ label = 'درس', value = '' } = {}) {
  counter += 1;
  const listId = `subjects-${counter}`;
  const used = subjectsUsed();
  const suggestions = [...new Set([...used, ...DEFAULT_SUBJECTS])];
  const quick = used.length ? used.slice(0, 6) : DEFAULT_SUBJECTS.slice(0, 6);

  const input = h('input', {
    class: 'input',
    type: 'text',
    list: listId,
    value,
    placeholder: 'مثلاً ریاضی',
    autocomplete: 'off',
    enterkeyhint: 'next',
  });
  const datalist = h('datalist', { id: listId }, suggestions.map((s) => h('option', { value: s })));
  const chips = h(
    'div',
    { class: 'chips' },
    quick.map((s) =>
      h(
        'button',
        {
          class: 'chip',
          type: 'button',
          onclick: () => {
            input.value = s;
            input.dispatchEvent(new Event('input'));
          },
        },
        s,
      ),
    ),
  );

  const el = h('div', { class: 'field' }, h('span', { class: 'label' }, label), input, datalist, chips);
  return {
    el,
    input,
    get value() {
      return input.value.trim();
    },
  };
}
