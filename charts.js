// نمودارهای سبک بدون کتابخانه
import { h } from '../utils/dom.js';

/** نمودار ستونی. items: [{ label, value, title, today, best, on }] */
export function barChart(items, { dense = false, labelEvery = 1, height = 150 } = {}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const wrap = h('div', { class: `bars${dense ? ' dense' : ''}`, style: { height: `${height}px` }, role: 'img' });
  items.forEach((item, idx) => {
    const col = h('div', { class: 'col', title: item.title || '' });
    col.style.height = '3px';
    const bar = h(
      'div',
      { class: `bar${item.value > 0 ? ' on' : ''}${item.best ? ' best' : ''}${item.today ? ' today' : ''}` },
      col,
      h('div', { class: 'lbl' }, idx % labelEvery === 0 ? item.label : ''),
    );
    wrap.append(bar);
    requestAnimationFrame(() => {
      col.style.height = `${Math.max(3, (item.value / max) * (height - 28))}px`;
    });
  });
  return wrap;
}

/** نمودار میله‌ای افقی. items: [{ label, value, text }] */
export function hBarChart(items) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const box = h('div', { class: 'hbars' });
  for (const item of items) {
    const fill = h('div', { class: 'fill' });
    fill.style.width = '0%';
    box.append(
      h(
        'div',
        { class: 'hbar' },
        h('div', { class: 'top' }, h('span', null, item.label), h('span', { class: 'muted' }, item.text)),
        h('div', { class: 'track' }, fill),
      ),
    );
    requestAnimationFrame(() => {
      fill.style.width = `${Math.max(2, (item.value / max) * 100)}%`;
    });
  }
  return box;
}

/** نمودار خطی. points: [{ label, value }] — مقدارها می‌توانند منفی باشند */
export function lineChart(points) {
  const W = 320;
  const H = 150;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'line-chart');
  svg.setAttribute('role', 'img');
  const make = (tag, attrs, text) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text) el.textContent = text;
    return el;
  };
  if (!points.length) return svg;

  const values = points.map((p) => p.value);
  const lo = Math.min(0, ...values);
  const hi = Math.max(100, ...values);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (H - pad.t - pad.b);
  // نقطه‌ی اول سمت راست (RTL)
  const x = (i) => (points.length === 1 ? W / 2 : W - pad.r - (i / (points.length - 1)) * (W - pad.l - pad.r));

  [0, 50, 100].forEach((g) => svg.append(make('line', { class: 'grid', x1: pad.l, x2: W - pad.r, y1: y(g), y2: y(g) })));
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  if (points.length > 1) {
    svg.append(make('path', { class: 'area', d: `${d} L${x(points.length - 1).toFixed(1)} ${y(lo)} L${x(0).toFixed(1)} ${y(lo)} Z` }));
    svg.append(make('path', { class: 'path', d }));
  }
  points.forEach((p, i) => {
    svg.append(make('circle', { cx: x(i).toFixed(1), cy: y(p.value).toFixed(1), r: 4 }));
    if (points.length <= 8 || i % Math.ceil(points.length / 6) === 0) {
      svg.append(make('text', { x: x(i).toFixed(1), y: H - 6, 'text-anchor': 'middle' }, p.label));
    }
  });
  return svg;
}
