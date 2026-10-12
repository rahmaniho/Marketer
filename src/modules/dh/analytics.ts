/**
 * داده‌های تحلیلی و گزارش‌های تفکیکی ماژول شوینده و بهداشتی
 * — فروش شوینده vs بهداشتی vs غذایی، روند فصلی، سهم بازار، تحلیل سبد خرید
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product } from '@/lib/types';
import { dhBrands, dhProducts } from './data';

const M = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** فروش ماهانه تفکیکی به تومان (Mock) */
export const monthlySalesByModule = M.map((month, i) => {
  const nowruz = i === 11 || i === 0 ? 1.55 : i === 10 ? 1.3 : 1; // اوج خانه‌تکانی/نوروز
  const school = i === 5 || i === 6 ? 1.25 : 1; // بازگشایی مدارس
  return {
    month,
    food: Math.round((3800 + ((i * 137) % 900)) * 1_000_000),
    detergent: Math.round((2100 + ((i * 211) % 700)) * nowruz * 1_000_000),
    hygiene: Math.round((1600 + ((i * 173) % 600)) * school * 1_000_000),
  };
});

/** سهم بازار برندهای پرفروش هر دسته (Mock) */
export const marketShare = [
  { brand: 'گلرنگ', detergent: 18.4, hygiene: 7.2 },
  { brand: 'پاکسان', detergent: 11.2, hygiene: 6.1 },
  { brand: 'یونیلیور ایران', detergent: 10.8, hygiene: 8.4 },
  { brand: 'پریمکس', detergent: 8.9, hygiene: 0 },
  { brand: 'پارس‌حیات', detergent: 0, hygiene: 12.6 },
  { brand: 'مای', detergent: 0, hygiene: 9.8 },
  { brand: 'پرسیل', detergent: 7.6, hygiene: 0 },
  { brand: 'کولگیت', detergent: 0, hygiene: 5.4 },
];

/** برندهای پرفروش هر دسته از روی داده‌های کاتالوگ */
export const topBrandsOf = (module: 'detergent' | 'hygiene', limit = 5) => {
  const list = dhProducts.filter((p) => p.module === module);
  const agg = new Map<string, { name: string; sold: number; revenue: number }>();
  list.forEach((p) => {
    const b = dhBrands.find((x) => x.id === p.brandId);
    const cur = agg.get(p.brandId) ?? { name: b?.name ?? 'نامشخص', sold: 0, revenue: 0 };
    cur.sold += p.soldCount;
    cur.revenue += p.soldCount * p.basePrice;
    agg.set(p.brandId, cur);
  });
  return [...agg.values()].sort((a, b) => b.sold - a.sold).slice(0, limit);
};

/** پیش‌بینی تقاضای فصلی (هوش مصنوعی — نمایشی) */
export const seasonalDemand = [
  { season: 'نوروز / خانه‌تکانی', months: 'بهمن تا فروردین', index: 158, tip: 'افزایش ۵۸٪ تقاضای شوینده و پاک‌کننده — تأمین پالتی پیش از بهمن', icon: 'sparkles' },
  { season: 'بازگشایی مدارس', months: 'مهر', index: 126, tip: 'اوج خرید لکه‌بر کودک، دستمال و اقلام بهداشتی مدرسه', icon: 'award' },
  { season: 'تابستان', months: 'تیر تا شهریور', index: 112, tip: 'ضدعفونی‌کننده و شامپو بدن رشد می‌کند', icon: 'sun' },
  { season: 'پاییز / آنفلوآنزا', months: 'آبان تا آذر', index: 134, tip: 'پیش‌بینی جهش تقاضای ژل ضدعفونی، ماسک و محلول', icon: 'shield' },
];

/** تحلیل سبد خرید: کدام شوینده‌ها با هم خریداری می‌شوند */
export const basketPairs: { a: string; b: string; support: number; lift: number }[] = [
  { a: 'شامپو مو مای مدل ترمیمی ۴۰۰ میلی‌لیتری', b: 'نرم‌کننده مو پنتن ۴۰۰ میلی‌لیتری', support: 68, lift: 2.4 },
  { a: 'پودر ماشین لباسشویی گلرنگ آنزیم‌دار ۴ کیلویی', b: 'نرم‌کننده و خوشبوکننده گلناز ۱ لیتری', support: 61, lift: 2.1 },
  { a: 'مایع ظرفشویی پریمکس لیمویی ۱ لیتری', b: 'اسفنج ظرفشویی اسفنج پاک (کارتن ۲۴ عددی)', support: 57, lift: 1.9 },
  { a: 'پوشک بچه مولفیکس سایز ۳ (کارتن ۴ بسته‌ای)', b: 'دستمال مرطوب کودک پاپیون بسته ۷۲ عددی', support: 54, lift: 2.6 },
  { a: 'خمیردندان کولگیت ضد پوسیدگی ۱۰۰ گرمی', b: 'مسواک اورال بی مدل نرم (کارتن ۲۴ عددی)', support: 49, lift: 2.2 },
  { a: 'سفیدکننده و ضدعفونی‌کننده دامستوس ۱ لیتری', b: 'جرم‌گیر توالت هارپیک ۷۵۰ میلی‌لیتری', support: 42, lift: 1.8 },
];

/** هشدار انقضای محصولات بهداشتی (محاسبه از داده‌های کاتالوگ) */
export const expiryAlerts = (warnDays = 240) =>
  dhProducts
    .map((p) => ({ product: p, daysLeft: Math.round((+new Date(p.expiryDate) - Date.now()) / 86400000) }))
    .filter((x) => x.daysLeft < warnDays)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 8);

/** پیشنهاد قیمت بهینه بر اساس نرخ رقبا (Mock) */
export const competitorPriceHints: { productName: string; ourPrice: number; marketAvg: number; suggestion: string }[] = [
  { productName: 'مایع ظرفشویی پریمکس لیمویی ۱ لیتری', ourPrice: 2480000, marketAvg: 2620000, suggestion: 'قیمت شما ۵٪ زیر میانگین بازار — فضای افزایش ۲ تا ۳٪ بدون ریزش مشتری' },
  { productName: 'پودر ماشین لباسشویی اومو ۵۰۰ گرمی (کارتن ۲۴ عددی)', ourPrice: 2890000, marketAvg: 2810000, suggestion: '۳٪ بالاتر از میانگین — تخفیف پله ۵۱ کارتنی را ۱٪ تقویت کنید' },
  { productName: 'شامپو مو مای مدل ترمیمی ۴۰۰ میلی‌لیتری', ourPrice: 3840000, marketAvg: 3990000, suggestion: 'قیمت رقابتی — با باندل نرم‌کننده حاشیه سود را جبران کنید' },
];

/** اقلام حجیم (گالن و کارتن بزرگ) برای مدیریت موجودی انبار */
export const bulkyItems = (products: Product[] = dhProducts) =>
  products.filter((p) => p.dh?.packaging === 'گالن' || (p.dh?.weightGr ?? 0) >= 5000 || (p.dh?.volumeMl ?? 0) >= 2000);

/** وزن تقریبی هر کارتن (کیلوگرم) برای محاسبه هزینه ارسال */
export const cartonWeightKg = (p: Product): number => {
  const unitKg = (p.dh?.weightGr ?? 0) / 1000 || (p.dh?.volumeMl ?? 0) / 1000 || 0.5;
  return Number((unitKg * Math.max(1, p.unitsPerCarton) + 0.6).toFixed(1));
};

/** هزینه ارسال بر اساس وزن (تومان) — محاسبه‌گر لجستیک اقلام حجیم */
export const shippingCostByWeight = (totalKg: number): number => {
  if (totalKg <= 0) return 0;
  const base = 280000;
  const extra = Math.max(0, totalKg - 20) * 12000;
  return Math.round(base + extra);
};

/** OCR بارکد و تاریخ انقضا (نمایشی) */
export const ocrDemo = {
  title: 'OCR تشخیص بارکد و تاریخ انقضا',
  description: 'با دوربین موبایل، بارکد و تاریخ انقضای درج‌شده روی محصول خوانده و با کاتالوگ تطبیق داده می‌شود.',
  samples: [
    { code: '6262000012345', label: 'مایع ظرفشویی پریمکس', expiry: '1406/08/14', matched: true },
    { code: '6262000078901', label: 'شامپو مای ترمیمی', expiry: '1405/12/20', matched: true },
    { code: '6262000033311', label: 'نوار بهداشتی مولپد', expiry: '1407/02/09', matched: false },
  ],
};
