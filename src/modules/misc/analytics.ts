/**
 * داده‌های تحلیلی و گزارش‌های تفکیکی ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * — فروش این ماژول در مقابل سایر ماژول‌ها، روند فصلی، سهم بازار، تحلیل سبد خرید
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product } from '@/lib/types';
import { msBrands, msProducts } from './data';

const M = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** فروش ماهانه تفکیکی به تومان (Mock) — چهار ماژول */
export const monthlySalesByModule = M.map((month, i) => {
  const nowruz = i === 11 || i === 0 ? 1.5 : i === 10 ? 1.28 : 1;
  const school = i === 5 || i === 6 ? 1.35 : 1;
  const summer = i >= 3 && i <= 5 ? 1.2 : 1;
  return {
    month,
    food: Math.round((3800 + ((i * 137) % 900)) * 1_000_000),
    detergent: Math.round((2100 + ((i * 211) % 700)) * nowruz * 1_000_000),
    hygiene: Math.round((1600 + ((i * 173) % 600)) * school * 1_000_000),
    misc: Math.round((1450 + ((i * 191) % 550)) * Math.max(school, summer) * 1_000_000),
  };
});

/** سهم بازار برندهای پرفروش ماژول (درصد — Mock) */
export const marketShare: { brand: string; stationery: number; battery: number; mobile: number; appliances: number; kitchen: number; pet: number }[] = [
  { brand: 'پارس خزر', stationery: 0, battery: 0, mobile: 0, appliances: 17.2, kitchen: 0, pet: 0 },
  { brand: 'کیان', stationery: 15.6, battery: 0, mobile: 0, appliances: 0, kitchen: 0, pet: 0 },
  { brand: 'کملیون', stationery: 0, battery: 19.4, mobile: 0, appliances: 0, kitchen: 0, pet: 0 },
  { brand: 'شیائومی', stationery: 0, battery: 0, mobile: 18.8, appliances: 0, kitchen: 0, pet: 0 },
  { brand: 'پارس اوپال', stationery: 0, battery: 0, mobile: 0, appliances: 0, kitchen: 14.1, pet: 0 },
  { brand: 'رویال کنین', stationery: 0, battery: 0, mobile: 0, appliances: 0, kitchen: 0, pet: 14.2 },
  { brand: 'پاپکو', stationery: 11.8, battery: 0, mobile: 0, appliances: 0, kitchen: 0, pet: 0 },
  { brand: 'دوراسل', stationery: 0, battery: 12.6, mobile: 0, appliances: 0, kitchen: 0, pet: 0 },
];

/** برندهای پرفروش ماژول از روی داده‌های کاتالوگ */
export const topBrandsOf = (limit = 5) => {
  const agg = new Map<string, { name: string; sold: number; revenue: number }>();
  msProducts.forEach((p) => {
    const b = msBrands.find((x) => x.id === p.brandId);
    const cur = agg.get(p.brandId) ?? { name: b?.name ?? 'نامشخص', sold: 0, revenue: 0 };
    cur.sold += p.soldCount;
    cur.revenue += p.soldCount * p.basePrice;
    agg.set(p.brandId, cur);
  });
  return [...agg.values()].sort((a, b) => b.sold - a.sold).slice(0, limit);
};

/** پیش‌بینی تقاضای فصلی (هوش مصنوعی — نمایشی) */
export const seasonalDemand = [
  { season: 'نوروز و شب عید', months: 'بهمن تا فروردین', index: 162, tip: 'جهش آجیل، شیرینی، کادویی و ظروف پذیرایی — تأمین پالتی پیش از بهمن', icon: 'gift' },
  { season: 'بازگشایی مدارس', months: 'مهر', index: 148, tip: 'اوج خرید لوازم‌التحریر، کوله، دفتر و مداد — پک‌های مدرسه را زودتر بچینید', icon: 'paper' },
  { season: 'ماه مبارک رمضان', months: 'اسفند تا فروردین (قمری)', index: 136, tip: 'زولبیا و بامیه، خرما و اقلام سفره افطار', icon: 'moon' },
  { season: 'تابستان', months: 'تیر تا شهریور', index: 121, tip: 'آب معدنی، بستنی، پنکه و لوازم سرمایشی رشد می‌کند', icon: 'star' },
];

/** تحلیل سبد خرید: کدام کالاها با هم خریداری می‌شوند */
export const basketPairs: { a: string; b: string; support: number; lift: number }[] = [
  { a: 'خودکار آبی یکبارمصرف', b: 'دفتر مشق ۱۰۰ برگ', support: 72, lift: 2.8 },
  { a: 'پاوربانک ۱۰۰۰۰ میلی‌آمپر', b: 'کابل USB-C شارژ سریع', support: 66, lift: 2.5 },
  { a: 'غذای خشک گربه بالغ ۱۰ کیلو', b: 'تشویقی سگ و گربه', support: 58, lift: 2.2 },
  { a: 'سرویس قابلمه ۱۰ پارچه استیل', b: 'ظروف نگهدارنده شیشه‌ای', support: 47, lift: 1.9 },
  { a: 'باتری قلمی بسته ۴ عددی', b: 'چراغ‌قوه LED شارژی', support: 41, lift: 1.8 },
];

/** اقلام حجیم/سنگین — نیازمند مدیریت انبار و بسته‌بندی ویژه */
export const bulkyItems = (): Product[] =>
  msProducts.filter((p) => (p.misc?.weightGr ?? 0) >= 5000 || /کارتن ۲|کارتن ۴|کیسه|سرویس/.test(p.packDesc)).slice(0, 14);

/** وزن تقریبی هر کارتن (کیلوگرم) — برای محاسبه ارسال */
export const cartonWeightKg = (product: Product): number => {
  const unitWeight = (product.misc?.weightGr ?? 500) / 1000;
  return Math.round(unitWeight * product.unitsPerCarton * 10) / 10;
};

/** هزینه ارسال بر اساس وزن (تومان) */
export const shippingCostByWeight = (kg: number): number => {
  const base = 280000;
  if (kg <= 20) return base;
  return Math.round(base + (kg - 20) * 9500);
};

/** پیشنهاد قیمت بهینه بر اساس نرخ رقبا (نمایشی) */
export const competitorPriceHints: { productName: string; ourPrice: number; marketAvg: number; suggestion: string }[] = [
  { productName: 'پاوربانک ۱۰۰۰۰ میلی‌آمپر شیائومی', ourPrice: 1650000, marketAvg: 1780000, suggestion: 'قیمت شما رقابتی است؛ برای سفارش بالای ۲۰ عدد ۳٪ تخفیف حجمی پیشنهاد دهید.' },
  { productName: 'پلوپز دیجیتال ۱.۸ لیتر پارس خزر', ourPrice: 3200000, marketAvg: 3050000, suggestion: 'بازار ۵٪ ارزان‌تر است — کمپین ۷٪ فصلی برای رقابت پیشنهاد می‌شود.' },
  { productName: 'باتری قلمی بسته ۴ عددی کملیون', ourPrice: 265000, marketAvg: 272000, suggestion: 'اختلاف ناچیز است؛ حجم فروش را با پله ۶۰ کارتنی بالا ببرید.' },
];

/** داده OCR بارکد/تاریخ (نمایشی) */
export const ocrDemo = {
  title: 'اسکن بارکد و تاریخ انقضا (نمایشی)',
  description: 'با دوربین موبایل بارکد کارتن اسکن می‌شود تا کالا در سفارش اضافه شود؛ برای اقلام فصلی و غذای حیوانات، تاریخ انقضا هم خوانده و با بچ انبار تطبیق داده می‌شود.',
  samples: [
    { code: '640003000123', label: 'باتری قلمی کملیون', expiry: '—', matched: true },
    { code: '640003000456', label: 'غذای خشک سگ رویال کنین', expiry: '1405/06/31', matched: true },
    { code: '640003000789', label: 'آجیل شب عید گلستان بهاران', expiry: '1405/01/15', matched: false },
  ],
};
