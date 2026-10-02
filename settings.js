import { h } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { pageHead } from '../components/common.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';
import { getSettings, saveSettings, wipeAll } from '../services/store.js';
import { getThemePreference, setThemePreference } from '../services/theme.js';
import { downloadBackup, restoreBackup } from '../services/backup.js';
import { notificationsSupported, requestReminderPermission } from '../services/reminders.js';
import { canInstall, promptInstall, isStandalone } from '../hooks/installPrompt.js';
import { toEn } from '../utils/format.js';

function section(title, ...children) {
  return h('section', { class: 'card settings-group' }, h('h2', null, title), ...children);
}

function textField(label, value, onSave, props = {}) {
  return h(
    'div',
    { class: 'field' },
    h('label', null, label),
    h('input', { class: 'input', type: 'text', value, onchange: (e) => onSave(e.target.value.trim()), ...props }),
  );
}

/** عدد اعشاری (ساعت) → دقیقه */
function hoursField(label, minutes, onSave, hint) {
  const input = h('input', {
    class: 'input num',
    type: 'text',
    inputmode: 'decimal',
    value: minutes ? String(Math.round((minutes / 60) * 100) / 100) : '',
    placeholder: '۰',
    onchange: (e) => {
      const n = parseFloat(toEn(e.target.value).replace('٫', '.').replace(',', '.'));
      onSave(Number.isFinite(n) && n > 0 ? Math.round(n * 60) : 0);
    },
  });
  return h('div', { class: 'field' }, h('label', null, label), input, hint ? h('span', { class: 'hint' }, hint) : null);
}

function countField(label, value, onSave) {
  return h(
    'div',
    { class: 'field' },
    h('label', null, label),
    h('input', {
      class: 'input num',
      type: 'text',
      inputmode: 'numeric',
      value: value ? String(value) : '',
      placeholder: '۰',
      onchange: (e) => {
        const n = parseInt(toEn(e.target.value), 10);
        onSave(Number.isFinite(n) && n > 0 ? n : 0);
      },
    }),
  );
}

function toggle(label, checked, onChange, hint) {
  const sw = h('button', {
    class: 'switch',
    type: 'button',
    role: 'switch',
    'aria-checked': String(checked),
    'aria-label': label,
    onclick: () => onChange(!checked),
  });
  return h('div', { class: 'switch-row' }, h('div', null, h('div', null, label), hint ? h('div', { class: 'hint small muted' }, hint) : null), sw);
}

export function renderSettings(requestRender) {
  const s = getSettings();
  const pref = getThemePreference();
  const silent = (patch) => saveSettings(patch, true);

  const themeButtons = [
    ['light', 'روشن'],
    ['dark', 'تیره'],
    ['system', 'سیستم'],
  ].map(([id, label]) =>
    h('button', { type: 'button', 'aria-pressed': String(pref === id), onclick: () => { setThemePreference(id); requestRender(); } }, label),
  );

  const appearance = section(
    'ظاهر برنامه',
    h('div', { class: 'segmented', role: 'group', 'aria-label': 'تم' }, themeButtons),
    h('p', { class: 'hint small muted' }, 'روشن: Light · تیره: Dark · سیستم: System Default'),
  );

  const user = section(
    'اطلاعات کاربر',
    textField('نام', s.name, (v) => silent({ name: v }), { placeholder: 'مثلاً علی', autocomplete: 'given-name' }),
    textField('پایه / مقطع تحصیلی', s.grade, (v) => silent({ grade: v }), { placeholder: 'مثلاً دوازدهم تجربی' }),
    textField('هدف مطالعه', s.goal, (v) => silent({ goal: v }), { placeholder: 'مثلاً رتبه‌ی زیر ۱۰۰۰ در کنکور' }),
    textField('نام مشاور (اختیاری)', s.counselor, (v) => silent({ counselor: v }), { placeholder: 'اختیاری' }),
  );

  const goals = section(
    'تنظیمات مطالعه',
    hoursField('هدف مطالعه‌ی روزانه (ساعت)', s.dailyGoalMinutes, (v) => silent({ dailyGoalMinutes: v }), 'مثلاً ۵ یا ۴٫۵'),
    hoursField('هدف مطالعه‌ی هفتگی (ساعت)', s.weeklyGoalMinutes, (v) => silent({ weeklyGoalMinutes: v })),
    countField('هدف تست روزانه (تعداد)', s.dailyTestGoal, (v) => silent({ dailyTestGoal: v })),
  );

  const reminderBlock = section(
    'یادآوری',
    notificationsSupported()
      ? toggle('یادآوری گزارش روزانه', s.reminders.enabled, async (on) => {
          if (on) {
            const res = await requestReminderPermission();
            if (res !== 'granted') {
              showToast('اجازه‌ی اعلان داده نشد؛ از تنظیمات مرورگر فعالش کن.');
              return;
            }
          }
          saveSettings({ reminders: { ...s.reminders, enabled: on } });
        }, 'وقتی برنامه باز یا در پس‌زمینه‌ی مرورگر زنده باشد، یادآوری نشان داده می‌شود.')
      : h('p', { class: 'muted small' }, 'مرورگر شما از اعلان پشتیبانی نمی‌کند.'),
    s.reminders.enabled
      ? h('div', { class: 'field' }, h('label', null, 'ساعت یادآوری'),
          h('input', { class: 'input', type: 'time', value: s.reminders.time, onchange: (e) => silent({ reminders: { ...s.reminders, time: e.target.value || '20:00' } }) }))
      : null,
  );

  const rep = s.report;
  const setRep = (k) => (v) => saveSettings({ report: { ...rep, [k]: v } });
  const format = section(
    'فرمت گزارش',
    toggle('نمایش ایموجی', rep.emoji, setRep('emoji')),
    toggle('نام و پایه‌ی دانش‌آموز در گزارش', rep.includeName, setRep('includeName')),
    toggle('نمایش مبحث‌ها', rep.includeTopics, setRep('includeTopics')),
    toggle('نمایش ساعت شروع و پایان', rep.includeTimes, setRep('includeTimes')),
    toggle('نمایش درصد تست‌ها', rep.includePercent, setRep('includePercent')),
    toggle('نمایش دلیل برنامه‌های انجام‌نشده', rep.includeReasons, setRep('includeReasons')),
    toggle('نمایش توضیحات روز', rep.includeNotes, setRep('includeNotes')),
  );

  const st = s.stats;
  const setSt = (k) => (v) => saveSettings({ stats: { ...st, [k]: v } });
  const statsBlock = section(
    'نمایش آمار',
    toggle('زنجیره‌ی روزهای مطالعه', st.streak, setSt('streak')),
    toggle('رکورد بیشترین مطالعه', st.record, setSt('record')),
    toggle('نمودار هفته در صفحه‌ی خانه', st.weekChart, setSt('weekChart')),
    toggle('سهم هر درس', st.subjects, setSt('subjects')),
    toggle('روند درصد تست‌ها', st.testTrend, setSt('testTrend')),
  );

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    class: 'sr-only',
    onchange: async (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const ok = await confirmDialog({
        title: 'بازیابی پشتیبان',
        message: 'اطلاعات فعلی با محتوای فایل جایگزین می‌شود. ادامه می‌دهی؟',
        confirmText: 'جایگزین کن',
        danger: true,
      });
      if (!ok) return;
      try {
        await restoreBackup(file);
        showToast('اطلاعات با موفقیت بازیابی شد ✅');
      } catch (err) {
        showToast(err.message || 'بازیابی ناموفق بود.');
      }
    },
  });

  const installBlock = !isStandalone() && canInstall()
    ? h('button', { class: 'btn soft block', type: 'button', onclick: async () => { await promptInstall(); requestRender(); } }, icon('install'), 'نصب Studia روی گوشی')
    : null;

  const data = section(
    'داده‌ها',
    h('p', { class: 'muted small' }, 'همه‌ی اطلاعات فقط روی همین دستگاه ذخیره می‌شود. برای جلوگیری از گم شدن، گاهی پشتیبان بگیر.'),
    h('button', { class: 'btn block', type: 'button', onclick: () => { downloadBackup(); showToast('فایل پشتیبان دانلود شد'); } }, icon('download'), 'Export Data — دریافت پشتیبان'),
    h('button', { class: 'btn block', type: 'button', onclick: () => fileInput.click() }, icon('upload'), 'Import Data — بازیابی از فایل'),
    fileInput,
    h('div', { class: 'divider' }),
    h('button', {
      class: 'btn danger block',
      type: 'button',
      onclick: async () => {
        const ok = await confirmDialog({
          title: 'پاک کردن تمام اطلاعات',
          message: 'همه‌ی جلسه‌ها، برنامه‌ها، تست‌ها، گزارش‌ها و تنظیمات برای همیشه پاک می‌شود و برگشت ندارد. اول پشتیبان گرفته‌ای؟',
          confirmText: 'بله، همه را پاک کن',
          danger: true,
        });
        if (!ok) return;
        await wipeAll();
        const { applyTheme } = await import('../services/theme.js');
        applyTheme('system');
        showToast('همه‌ی اطلاعات پاک شد');
      },
    }, icon('trash'), 'پاک کردن تمام اطلاعات'),
  );

  return h(
    'div',
    { class: 'page' },
    pageHead('تنظیمات', 'برنامه را با خودت هماهنگ کن'),
    appearance, user, goals, reminderBlock, format, statsBlock, installBlock, data,
    h('p', { class: 'about' }, 'Studia · استودیا — نسخه‌ی ۱٫۰'),
  );
}
