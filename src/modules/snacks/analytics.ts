/**
 * داده‌های تحلیلی و گزارش‌های تفکیکی ماژول «تنقلات»
 * — فروش این ماژول در مقابل سایر ماژول‌ها، روند فصلی، سهم بازار، تحلیل سبد خرید
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product } from '@/lib/types';
import { snBrands, snProducts } from './data';

const M = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** فروش ماهانه تفکیکی به تومان (Mock) — پنج ماژول */
export const monthlySalesByModule = M.map((month, i) => {
  const nowruz = i === 11 || i === 0 ? 1.55 : i === 10 ? 1.3 : 1;
  const school = i === 5 || i === 6 ? 1.3 : 1;
  return {
    month,
    food: Math.round((3800 + ((i * 137) % 900)) * 1_000_000),
    detergent: Math.round((2100 + ((i * 211) % 700)) * 1_000_000),
    hygiene: Math.round((1600 + ((i * 173) % 600)) * 1_000_000),
    misc: Math.round((1450 + ((i * 191) % 550)) * school * 1_000_000),
    snacks: Math.round((1950 + ((i * 181) % 650)) * Math.max(nowruz, school) * 1_000_000),
  };
});

/** سهم بازار برندهای پرفروش ماژول (درصد — Mock) */
export const marketShare: { brand: string; chips: number; chocolate: number; biscuit: number; gum: number; candy: number }[] = [
  { brand: 'مزمز', chips: 18.6, chocolate: 0, biscuit: 0, gum: 0, candy: 0 },
  { brand: 'چی‌توز', chips: 15.2, chocolate: 0, biscuit: 0, gum: 0, candy: 0 },
  { brand: 'شونیز', chips: 0, chocolate: 14.8, biscuit: 0, gum: 0, candy: 6.2 },
  { brand: 'شیرین عسل', chips: 5.4, chocolate: 11.6, biscuit: 8.2, gum: 0, candy: 0 },
  { brand: 'ویتانا', chips: 0, chocolate: 0, biscuit: 16.4, gum: 0, candy: 0 },
  { brand: 'بایودنت', chips: 0, chocolate: 0, biscuit: 0, gum: 21.3, candy: 0 },
  { brand: 'دینا', chips: 10.8, chocolate: 0, biscuit: 0, gum: 0, candy: 0 },
  { brand: 'مینو', chips: 7.2, chocolate: 8.4, biscuit: 7.6, gum: 0, candy: 5.8 },
];

/** برندهای پرفروش ماژول از روی داده‌های کاتالوگ */
export const topBrandsOf = (limit = 5) => {
  const agg = new Map<string, { name: string; sold: number; revenue: number }>();
  snProducts.forEach((p) => {
    const b = snBrands.find((x) => x.id === p.brandId);
    const cur = agg.get(p.brandId) ?? { name: b?.name ?? 'نامشخص', sold: 0, revenue: 0 };
    cur.sold += p.soldCount;
    cur.revenue += p.soldCount * p.basePrice;
    agg.set(p.brandId, cur);
  });
  return [...agg.values()].sort((a, b) => b.sold - a.sold).slice(0, limit);
};

/** پیش‌بینی تقاضای فصلی (هوش مصنوعی — نمایشی) */
export const seasonalDemand = [
  { season: 'نوروز و شب عید', months: 'بهمن تا فروردین', index: 168, tip: 'جهش شکلات، آبنبات، پاستیل و آجیل‌جات — تأمین پالتی پیش از بهمن', icon: 'gift' },
  { season: 'بازگشایی مدارس', months: 'مهر', index: 152, tip: 'اوج خرید بیسکویت، کیک، آدامس و تنقلات بوفه مدارس', icon: 'paper' },
  { season: 'ماه مبارک رمضان', months: 'ماه قمری', index: 138, tip: 'تافی، کارامل و تنقلات افطاری رشد می‌کند', icon: 'moon' },
  { season: 'تابستان و تعطیلات', months: 'تیر تا شهریور', index: 124, tip: 'چیپس، پاپ‌کورن و اسنک سینمایی پرتقاضا می‌شود', icon: 'star' },
];

/** تحلیل سبد خرید: کدام تنقلات با هم خریداری می‌شوند */
export const basketPairs: { a: string; b: string; support: number; lift: number }[] = [
  { a: 'چیپس ساده نمکی ۱۰۰ گرمی', b: 'پفک نمکی ۶۰ گرمی', support: 74, lift: 2.9 },
  { a: 'شکلات تخته‌ای شیری ۱۰۰ گرمی', b: 'آدامس نعنایی خنک', support: 58, lift: 2.2 },
  { a: 'بیسکویت ساده مادر', b: 'کیک لایه‌ای شکلاتی', support: 63, lift: 2.4 },
  { a: 'پاپ‌کورن نمکی ۷۰ گرمی', b: 'چیپس موج‌دار باربیکیو ۱۵۰ گرمی', support: 46, lift: 1.9 },
  { a: 'پاستیل میوه‌ای', b: 'آبنبات میوه‌ای', support: 52, lift: 2.1 },
];

/** نام مستعار سطرهای تحلیل سبد خرید (برای جدول‌های گزارش) */
export const BasketPairsRows = basketPairs;

/** اقلام حجیم/سنگین — نیازمند مدیریت انبار و بسته‌بندی ویژه */
export const bulkyItems = (): Product[] =>
  snProducts.filter((p) => (p.snacks?.weightGr ?? 0) >= 250 || p.unitsPerCarton >= 30).slice(0, 14);

/** وزن تقریبی هر کارتن (کیلوگرم) — برای محاسبه ارسال */
export const cartonWeightKg = (product: Product): number => {
  const unitWeight = (product.snacks?.weightGr ?? 100) / 1000;
  return Math.round(unitWeight * product.unitsPerCarton * 10) / 10;
};

/** هزینه ارسال بر اساس وزن (تومان) */
export const shippingCostByWeight = (kg: number): number => {
  const base = 260000;
  if (kg <= 20) return base;
  return Math.round(base + (kg - 20) * 9000);
};

/** پیشنهاد قیمت بهینه بر اساس نرخ رقبا (نمایشی) */
export const competitorPriceHints: { productName: string; ourPrice: number; marketAvg: number; suggestion: string }[] = [
  { productName: 'چیپس ساده نمکی مزمز ۱۰۰ گرمی', ourPrice: 165000, marketAvg: 172000, suggestion: 'قیمت شما رقابتی است؛ با پله ۸۰ کارتنی سهم بازار را نگه دارید.' },
  { productName: 'شکلات مغزدار فندقی پارمیدا', ourPrice: 285000, marketAvg: 270000, suggestion: 'بازار ۵٪ ارزان‌تر است — کمپین فصلی ۸٪ برای رقابت پیشنهاد می‌شود.' },
  { productName: 'آدامس بدون قند نعنایی بایودنت', ourPrice: 135000, marketAvg: 138000, suggestion: 'اختلاف ناچیز است؛ حجم فروش را با پله ۶۰ کارتنی بالا ببرید.' },
];

/** داده OCR بارکد/تاریخ (نمایشی) */
export const ocrDemo = {
  title: 'اسکن بارکد و تاریخ انقضا (نمایشی)',
  description: 'با دوربین موبایل بارکد کارتن اسکن می‌شود تا کالا در سفارش اضافه شود؛ برای اقلام تازه (کیک و کلوچه) تاریخ انقضا هم خوانده و با بچ انبار تطبیق داده می‌شود.',
  samples: [
    { code: '640004000123', label: 'چیپس ساده مزمز', expiry: '1405/08/20', matched: true },
    { code: '640004000456', label: 'کیک لایه‌ای دُرنا', expiry: '1405/03/15', matched: true },
    { code: '640004000789', label: 'شکلات مغزدار پارمیدا', expiry: '1405/11/01', matched: false },
  ],
};
