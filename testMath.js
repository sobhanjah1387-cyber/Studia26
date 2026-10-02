// محاسبات تست با فرمول درصد کنکوری:
// درصد = ((درست × ۳) − غلط) ÷ (کل × ۳) × ۱۰۰

export function calcPercent(total, correct, wrong) {
  if (!total || total <= 0) return 0;
  const raw = ((correct * 3 - wrong) / (total * 3)) * 100;
  return Math.round(raw * 10) / 10;
}

/**
 * ورودی‌ها عدد صحیح نامنفی هستند. اگر «کل» وارد شده باشد «نزده» از روی آن محاسبه می‌شود؛
 * در غیر این صورت «کل» = درست + غلط + نزده.
 * خروجی: { ok, error?, value? }
 */
export function normalizeTest({ total, correct, wrong, blank }) {
  const c = correct || 0;
  const w = wrong || 0;
  let t = total || 0;
  let b = blank || 0;
  if (t > 0) {
    if (c + w > t) {
      return { ok: false, error: 'مجموع درست و غلط از تعداد کل تست بیشتر است.' };
    }
    b = t - c - w;
  } else {
    t = c + w + b;
    if (t <= 0) return { ok: false, error: 'تعداد تست را وارد کن.' };
  }
  return {
    ok: true,
    value: { total: t, correct: c, wrong: w, blank: b, percent: calcPercent(t, c, w) },
  };
}
