import { h } from '../utils/dom.js';

let root = null;

function getRoot() {
  if (!root) root = document.getElementById('toasts');
  return root;
}

/** showToast('متن', { actionLabel, onAction, duration }) */
export function showToast(message, opts = {}) {
  const { actionLabel, onAction, duration = actionLabel ? 6000 : 2600 } = opts;
  const el = h('div', { class: 'toast', role: 'status' }, h('span', null, message));
  let timer;
  const close = () => {
    clearTimeout(timer);
    el.remove();
  };
  if (actionLabel) {
    el.append(
      h(
        'button',
        {
          type: 'button',
          onclick: () => {
            close();
            if (onAction) onAction();
          },
        },
        actionLabel,
      ),
    );
  }
  const container = getRoot();
  while (container.children.length >= 2) container.firstChild.remove();
  container.append(el);
  timer = setTimeout(close, duration);
  return close;
}
