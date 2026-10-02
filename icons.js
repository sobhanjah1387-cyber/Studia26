// آیکون‌های SVG درون‌خطی (stroke-based، ساده و سبک)
const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  test: '<path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="m8.5 13 2 2 4-4.5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.5 7.4l2 1.2M17.5 15.4l2 1.2M4.5 16.6l2-1.2M17.5 8.6l2-1.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 7.5 3 3"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
  copy: '<rect x="8.5" y="8.5" width="11" height="12" rx="2.5"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6.5a2 2 0 0 0-2 2v9.5a2 2 0 0 0 2 2h2"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  next: '<path d="m14.5 6-6 6 6 6"/>',
  prev: '<path d="m9.5 6 6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3 2-4.8 3.3-6.6.7-1 1.2-2.2 1.2-3.7 3.3 1.5 5.5 4.4 5.5 7.1 0 .6-.1 1.1-.3 1.6 1-.6 1.6-1.6 1.8-2.7 1.2 1.3 1.5 2.7 1.5 4.3 0 3.5-2.6 6.2-6.5 6.2Z"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3M12 13v4M8.5 20h7M9.5 17h5"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v6.5h14V13"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M5 19.5h14"/>',
  upload: '<path d="M12 15V4M8 8l4-4 4 4M5 15v4.5h14V15"/>',
  report: '<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-3-2-3 2-3-2-3 2v-16a1 1 0 0 1 1-1Z"/><path d="M9 8.5h6M9 12h6"/>',
  more: '<circle cx="5.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 20.5h4"/>',
  install: '<rect x="6" y="2.8" width="12" height="18.4" rx="3"/><path d="M12 8v6m-2.5-2.5L12 14l2.5-2.5"/>',
};

export function icon(name, size) {
  const span = document.createElement('span');
  span.style.display = 'inline-grid';
  span.style.placeItems = 'center';
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size || 22}" height="${size || 22}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
  return span.firstElementChild ? span.firstElementChild : span;
}
