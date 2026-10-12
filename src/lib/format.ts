/** ابزارهای قالب‌بندی فارسی: عدد، مبلغ، تاریخ شمسی، زمان نسبی */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const toFa = (input: string | number): string =>
  String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/**
 * تبدیل ارقام فارسی (۰-۹) و عربی (٠-٩) به ارقام لاتین.
 * برای ورودی جست‌وجو، بارکد و مقایسه اعداد ضروری است.
 */
export const toEnDigits = (input: string): string =>
  String(input)
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/** جداکننده هزارگان + ارقام فارسی */
export const faNum = (n: number | undefined | null, fractionDigits = 0): string => {
  if (n === undefined || n === null || Number.isNaN(n)) return toFa('۰');
  return toFa(
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }),
  );
};

/** مبلغ به تومان */
export const toman = (n: number, withUnit = true): string =>
  `${faNum(Math.round(n))}${withUnit ? ' تومان' : ''}`;

/** مبلغ خلاصه مثل ۱.۲ میلیون */
export const tomanShort = (n: number): string => {
  if (Math.abs(n) >= 1_000_000_000) return `${faNum(n / 1_000_000_000, 1)} میلیارد تومان`;
  if (Math.abs(n) >= 1_000_000) return `${faNum(n / 1_000_000, 1)} میلیون تومان`;
  if (Math.abs(n) >= 1_000) return `${faNum(n / 1_000, 0)} هزار تومان`;
  return toman(n);
};

export const percentFa = (n: number, withSign = false): string =>
  `${withSign && n > 0 ? '+' : ''}${faNum(n, Number.isInteger(n) ? 0 : 1)}٪`;

// ---------------------------------------------------------------- تاریخ شمسی
const div = (a: number, b: number) => Math.floor(a / b);

/** تبدیل تاریخ میلادی به شمسی (الگوریتم استاندارد بدون وابستگی) */
export const toJalali = (date: Date): { jy: number; jm: number; jd: number } => {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  const gy2 = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy3 = gm > 2 ? gy2 + 1 : gy2;
  let days =
    365 * gy2 +
    div(gy3 + 3, 4) -
    div(gy3 + 99, 100) +
    div(gy3 + 399, 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
};

export const JALALI_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export const jalaliDate = (
  input: string | Date | number,
  style: 'short' | 'long' | 'monthYear' | 'weekday' = 'short',
): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const { jy, jm, jd } = toJalali(d);
  const p2 = (n: number) => toFa(String(n).padStart(2, '0'));
  switch (style) {
    case 'long':
      return `${toFa(jd)} ${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
    case 'monthYear':
      return `${JALALI_MONTHS[jm - 1]} ${toFa(jy)}`;
    case 'weekday':
      return `${WEEKDAYS[d.getDay()]} ${toFa(jd)} ${JALALI_MONTHS[jm - 1]}`;
    default:
      return `${toFa(jy)}/${p2(jm)}/${p2(jd)}`;
  }
};

export const jalaliDateTime = (input: string | Date): string => {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${jalaliDate(d)} — ساعت ${toFa(hh)}:${toFa(mm)}`;
};

export const timeAgo = (input: string | Date): string => {
  const d = input instanceof Date ? input : new Date(input);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (Number.isNaN(diff)) return '—';
  if (diff < 60) return 'لحظه‌ای پیش';
  if (diff < 3600) return `${faNum(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${faNum(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 86400 * 30) return `${faNum(Math.floor(diff / 86400))} روز پیش`;
  if (diff < 86400 * 365) return `${faNum(Math.floor(diff / (86400 * 30)))} ماه پیش`;
  return jalaliDate(d);
};

export const daysUntil = (input: string | Date): number => {
  const d = input instanceof Date ? input : new Date(input);
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
};

export const daysBetween = (a: string | Date, b: string | Date): number => {
  const d1 = a instanceof Date ? a : new Date(a);
  const d2 = b instanceof Date ? b : new Date(b);
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
};

/** افزودن روز به تاریخ */
export const addDays = (input: string | Date, days: number): string => {
  const d = input instanceof Date ? new Date(input) : new Date(input);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/** خروجی CSV با BOM برای اکسل فارسی */
export const toCsv = (rows: (string | number)[][]): string => {
  const body = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  return `\uFEFF${body}`;
};

export const downloadFile = (content: string | Blob, filename: string, type = 'text/csv;charset=utf-8') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportCsv = (rows: (string | number)[][], filename: string) =>
  downloadFile(toCsv(rows), filename, 'text/csv;charset=utf-8');

/** وزن‌دارکردن جست‌وجو: نرمال‌سازی حروف فارسی و اعداد */
export const normalizeFa = (s: string): string =>
  toEnDigits(s || '')
    .toLowerCase()
    .replace(/[ك]/g, 'ک')
    .replace(/[ي]/g, 'ی')
    .replace(/[ۀهٔ]/g, 'ه')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ؤو]/g, 'و')
    .replace(/[ئى]/g, 'ی')
    .replace(/[\u200c\u200f\u200e]/g, ' ')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const slugify = (s: string): string =>
  normalizeFa(s).replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-');
