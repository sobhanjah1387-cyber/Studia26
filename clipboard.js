// کپی متن: Clipboard API و در صورت نبود، روش قدیمی execCommand.
export async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* ادامه با روش جایگزین */
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

export async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return true;
    }
  }
  return false;
}
