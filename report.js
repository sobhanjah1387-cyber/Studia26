// ساخت متن گزارش روزانه (متن ساده، مناسب واتس‌اپ و تلگرام)
import { formatDateLong, formatDateNumeric, formatDuration, formatPercent, toFa, formatTimeFa } from './format.js';
import { isDone, sumMinutes } from './stats.js';
import { todayISO } from './dates.js';

function label(emoji, useEmoji, text) {
  return useEmoji ? `${emoji} ${text}` : text;
}

const sameSubjectKey = (x) => x.subject || 'بدون درس';

export function buildReport(date, data, settings, today = todayISO()) {
  const opt = settings.report;
  const e = opt.emoji;
  const sessions = data.sessions.filter((s) => s.date === date && isDone(s));
  const plans = data.plans.filter((p) => p.date === date);
  const tests = data.tests.filter((t) => t.date === date);
  const note = (data.note || '').trim();

  const lines = [];
  lines.push(date === today ? 'گزارش مطالعه امروز' : `گزارش مطالعه ${formatDateNumeric(date)}`);
  lines.push('');

  if (opt.includeName && (settings.name || settings.grade)) {
    const parts = [];
    if (settings.name) parts.push(settings.name);
    if (settings.grade) parts.push(settings.grade);
    lines.push(label('👤', e, `دانش‌آموز: ${parts.join(' — ')}`));
  }
  lines.push(label('📅', e, `تاریخ: ${formatDateLong(date)}`));
  lines.push(label('⏱', e, `مجموع مطالعه: ${formatDuration(sumMinutes(sessions))}`));

  if (sessions.length) {
    lines.push('');
    lines.push(label('📚', e, 'درس‌ها:'));
    for (const s of sessions) {
      let line = `- ${sameSubjectKey(s)}`;
      if (opt.includeTopics && s.topic) line += ` — مبحث ${s.topic}`;
      line += ` — ${formatDuration(s.minutes)}`;
      if (opt.includeTimes && s.start && s.end) {
        line += ` (${formatTimeFa(s.start)} تا ${formatTimeFa(s.end)})`;
      }
      lines.push(line);
    }
  }

  if (tests.length) {
    lines.push('');
    lines.push(label('📝', e, 'تست‌ها:'));
    for (const t of tests) {
      let line = `- ${sameSubjectKey(t)}`;
      if (opt.includeTopics && t.topic) line += ` (${t.topic})`;
      line += `: ${toFa(t.total)} تست — ${toFa(t.correct)} درست — ${toFa(t.wrong)} غلط — ${toFa(t.blank)} نزده`;
      if (opt.includePercent) line += ` — ${formatPercent(t.percent)}`;
      if (opt.includeTopics && t.source) line += ` — ${t.source}`;
      lines.push(line);
    }
  }

  const done = plans.filter((p) => p.done);
  const pending = plans.filter((p) => !p.done);
  const planLine = (p) => {
    let line = `- ${sameSubjectKey(p)}`;
    if (opt.includeTopics && p.topic) line += ` — مبحث ${p.topic}`;
    return line;
  };

  if (done.length) {
    lines.push('');
    lines.push(label('✅', e, 'برنامه‌های انجام‌شده:'));
    done.forEach((p) => lines.push(planLine(p)));
  }
  if (pending.length) {
    lines.push('');
    lines.push(label('❌', e, 'برنامه‌های انجام‌نشده:'));
    pending.forEach((p) => {
      let line = planLine(p);
      if (opt.includeReasons && p.reason) line += ` (دلیل: ${p.reason})`;
      lines.push(line);
    });
  }

  if (opt.includeNotes && note) {
    lines.push('');
    lines.push(label('📌', e, 'توضیحات:'));
    lines.push(note);
  }

  if (!sessions.length && !tests.length && !plans.length && !note) {
    lines.push('');
    lines.push('برای این روز چیزی ثبت نشده است.');
  }

  return lines.join('\n');
}
