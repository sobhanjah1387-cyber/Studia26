// مقادیر پیش‌فرض برنامه

export const DEFAULT_SETTINGS = {
  name: '',
  grade: '',
  goal: '',
  counselor: '',
  dailyGoalMinutes: 300,
  weeklyGoalMinutes: 2100,
  dailyTestGoal: 50,
  reminders: { enabled: false, time: '20:00' },
  report: {
    emoji: true,
    includeName: true,
    includeTopics: true,
    includeTimes: false,
    includePercent: true,
    includeReasons: true,
    includeNotes: true,
  },
  stats: {
    streak: true,
    record: true,
    weekChart: true,
    subjects: true,
    testTrend: true,
  },
};

export const DEFAULT_SUBJECTS = [
  'ریاضی',
  'فیزیک',
  'شیمی',
  'زیست‌شناسی',
  'ادبیات فارسی',
  'عربی',
  'دین و زندگی',
  'زبان انگلیسی',
  'زمین‌شناسی',
  'هندسه',
  'حسابان',
  'گسسته و آمار',
  'اقتصاد',
  'ریاضی و آمار',
  'منطق',
  'فلسفه',
  'علوم و فنون ادبی',
];

export const STUDY_TYPES = [
  'درس‌خوانی',
  'تست‌زنی',
  'مرور',
  'جمع‌بندی',
  'حل تمرین',
  'کلاس یا فیلم آموزشی',
  'آزمون',
  'سایر',
];
