// وقتی کیبورد موبایل باز می‌شود، نوار پایین را پنهان می‌کنیم تا چیدمان خراب نشود.
export function watchKeyboard() {
  const vv = window.visualViewport;
  if (!vv) return;
  const baseline = () => Math.max(window.innerHeight, vv.height);
  let full = baseline();
  const update = () => {
    if (Math.abs(window.innerHeight - full) > 120 && window.innerHeight > full) full = window.innerHeight;
    const open = full - vv.height > 140;
    document.documentElement.classList.toggle('kb-open', open);
  };
  vv.addEventListener('resize', update);
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      full = baseline();
      update();
    }, 400);
  });
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) {
      setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300);
    }
  });
}
