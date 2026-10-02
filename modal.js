// Bottom-sheet و دیالوگ تأیید
import { h } from '../utils/dom.js';
import { icon } from './icons.js';

let openCount = 0;

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}

/**
 * openSheet({ title, content, dialog }) → { close, el }
 * content می‌تواند Node یا تابعی باشد که (api) می‌گیرد و Node برمی‌گرداند.
 */
export function openSheet({ title, content, dialog = false, onClose }) {
  const overlay = document.getElementById('overlay');
  const previouslyFocused = document.activeElement;
  let closed = false;

  const backdrop = h('div', { class: `sheet-backdrop${dialog ? ' center' : ''}` });
  const api = {
    el: backdrop,
    close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      openCount = Math.max(0, openCount - 1);
      if (!openCount) lockScroll(false);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true });
      if (onClose) onClose();
    },
  };

  const onKey = (e) => {
    if (e.key === 'Escape') api.close();
  };

  const body = h('div', { class: 'sheet-body' }, typeof content === 'function' ? content(api) : content);
  const sheet = h(
    'div',
    { class: `sheet${dialog ? ' dialog' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h(
      'div',
      { class: 'sheet-head' },
      h('h2', null, title),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'بستن', onclick: api.close }, icon('close')),
    ),
    body,
  );
  backdrop.append(sheet);
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) api.close();
  });
  document.addEventListener('keydown', onKey);
  overlay.append(backdrop);
  openCount += 1;
  lockScroll(true);
  return api;
}

/** تأیید کاربر؛ Promise<boolean> */
export function confirmDialog({ title, message, confirmText = 'تأیید', cancelText = 'انصراف', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (v, api) => {
      answered = true;
      resolve(v);
      api.close();
    };
    openSheet({
      title,
      dialog: true,
      onClose: () => {
        if (!answered) resolve(false);
      },
      content: (api) => [
        h('p', { class: 'muted' }, message),
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => answer(false, api) }, cancelText),
          h('button', { class: `btn ${danger ? 'danger' : 'primary'}`, type: 'button', onclick: () => answer(true, api) }, confirmText),
        ),
      ],
    });
  });
}
