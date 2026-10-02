# Studia · استودیا

اپ سبک، سریع و موبایل‌محور برای مدیریت مطالعه: ثبت ساعت مطالعه، برنامه‌ی روزانه، تست‌ها، آمار، تقویم شمسی و ساخت **گزارش آماده‌ی کپی برای مشاور**.
بدون Backend، بدون دیتابیس خارجی و بدون API Key؛ همه‌چیز روی دستگاه کاربر ذخیره می‌شود و به‌صورت PWA روی اندروید نصب می‌شود.

## امکانات

- داشبورد: مطالعه‌ی امروز، هدف روزانه با نوار پیشرفت، تست‌ها، درصد برنامه، زنجیره‌ی روزها، رکورد و خلاصه‌ی هفته
- ثبت مطالعه (درس، مبحث، مدت، ساعت شروع/پایان، نوع، وضعیت) با ویرایش، حذف و بازگردانی (Undo)
- برنامه‌ی روزانه با Checkbox، وضعیت «انجام شد / در انتظار»، دلیل انجام‌نشدن و کپی برنامه به روز دیگر
- ثبت تست با محاسبه‌ی خودکار «نزده» و درصد کنکوری: `((درست × ۳) − غلط) ÷ (کل × ۳) × ۱۰۰`
- آمار روزانه، هفتگی و ماهانه با نمودارهای SVG/CSS سبک (بدون کتابخانه‌ی نمودار)
- تقویم شمسی (هفته از شنبه) با نشانگر روزهای مطالعه و برنامه‌ی کامل/ناقص
- گزارش روزانه‌ی متنی (واتس‌اپ/تلگرام) با دکمه‌ی «کپی گزارش» و فرمت قابل تنظیم
- تم روشن / تیره / سیستم (ذخیره در `localStorage`)
- Export / Import پشتیبان JSON و پاک‌کردن همه‌ی اطلاعات با تأییدیه
- PWA: `manifest.webmanifest`، service worker، آیکون‌های maskable، کارکرد آفلاین

## اجرا روی کامپیوتر

نیازمند Node.js نسخه‌ی ۱۸٫۱۸ یا بالاتر (پیشنهاد: ۲۰).

```bash
npm install
npm run dev        # اجرای محیط توسعه: http://localhost:5173
npm test           # تست‌های منطق (درصد، آمار، گزارش، تاریخ شمسی)
npm run build      # ساخت نسخه‌ی نهایی در پوشه‌ی dist
npm run preview    # پیش‌نمایش نسخه‌ی Build
```

> service worker فقط در نسخه‌ی Build فعال می‌شود (نه در `npm run dev`).

## Deploy: GitHub Repository → Cloudflare Pages → Build → Deploy

### ۱. گذاشتن پروژه در GitHub

```bash
git init
git add .
git commit -m "Studia v1"
git branch -M main
git remote add origin https://github.com/<USERNAME>/studia.git
git push -u origin main
```

(یا در سایت GitHub یک Repository خالی بساز و فایل‌ها را با Upload یا `git push` بفرست. `package-lock.json` پس از اولین `npm install` ساخته می‌شود؛ پیشنهاد می‌کنم آن را هم commit کنی.)

### ۲. اتصال به Cloudflare Pages

1. وارد [dash.cloudflare.com](https://dash.cloudflare.com) شو و از منوی **Workers & Pages** گزینه‌ی **Create application** را بزن.
2. تب **Pages** و سپس **Connect to Git** را انتخاب کن و حساب GitHub را وصل کن.
3. Repository به نام `studia` را انتخاب کن و **Begin setup** را بزن.

### ۳. تنظیمات Build

| فیلد | مقدار |
| --- | --- |
| Production branch | `main` |
| Framework preset | `Vite` (یا None) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | خالی (ریشه‌ی پروژه) |

در بخش **Environment variables** مقدار `NODE_VERSION` را `20` بگذار.

### ۴. Deploy

روی **Save and Deploy** بزن. بعد از چند دقیقه آدرسی مثل `https://studia.pages.dev` ساخته می‌شود.
از این به بعد با هر `git push` روی شاخه‌ی `main`، نسخه‌ی جدید خودکار Build و Deploy می‌شود.

### ۵. نصب روی گوشی

آدرس را در **Chrome اندروید** باز کن و از منو **Install app** (یا «افزودن به صفحه‌ی اصلی») را بزن. بعد از نصب، برنامه تمام‌صفحه (Standalone) و حتی آفلاین باز می‌شود.
روی iPhone: Safari → Share → Add to Home Screen.

## معماری ذخیره‌سازی

- داده‌های ساختاریافته (جلسه‌ها، برنامه‌ها، تست‌ها، توضیحات روز، تنظیمات) در **IndexedDB** (`studia`) ذخیره می‌شوند؛ اگر در دسترس نبود، خودکار به `localStorage` برمی‌گردد.
- انتخاب تم در `localStorage` (کلید `studia:theme`) نگه‌داری می‌شود.
- تاریخ‌ها به‌صورت ISO میلادی ذخیره و فقط هنگام نمایش به شمسی تبدیل می‌شوند.
- چون داده‌ها فقط روی همان دستگاه هستند، حتماً گاهی از **تنظیمات ← Export Data** پشتیبان بگیر. پاک کردن اطلاعات مرورگر، داده‌ها را هم پاک می‌کند.

## ساختار پروژه

```
index.html
vite.config.js            پلاگین کوچک پیش‌کش service worker (بدون پکیج اضافه)
public/
  manifest.webmanifest
  sw.js                   service worker
  favicon.svg
  _headers                هدرهای کش برای Cloudflare Pages
  icons/                  لوگو و آیکون‌های PWA (SVG + PNG)
src/
  main.js                 شروع برنامه و Router (hash)
  pages/                  home, plan (تقویم), study, tests, stats, report, settings
  components/             فرم‌ها، مودال، Toast، نمودارها، منوی پایین، ...
  services/               db (IndexedDB), store, theme, backup, clipboard, reminders, pwa, ui
  hooks/                  installPrompt, keyboard
  utils/                  jalali, dates, format, stats, testMath, report, dom, id
  data/                   مقادیر پیش‌فرض و پیام‌ها
  styles/                 base.css, components.css, pages.css
tests/                    تست‌های منطق با node:test
.github/workflows/ci.yml  تست و Build روی هر push
```

## نکته‌ها

- **یادآوری:** مرورگرها اجازه‌ی زمان‌بندی دقیق اعلان در پس‌زمینه را بدون سرور Push نمی‌دهند. یادآوری وقتی نشان داده می‌شود که برنامه باز (یا در پس‌زمینه‌ی مرورگر زنده) باشد.
- **فونت:** برنامه از فونت‌های فارسی نصب‌شده‌ی دستگاه استفاده می‌کند. برای ظاهر یکدست می‌توانی فایل [Vazirmatn](https://github.com/rastikerdar/vazirmatn) را در `public/fonts/` بگذاری و در ابتدای `src/styles/base.css` یک `@font-face` اضافه کنی.
- **به‌روزرسانی:** با هر Build نسخه‌ی service worker عوض می‌شود و کاربر در باز شدن بعدی نسخه‌ی جدید را می‌گیرد.
