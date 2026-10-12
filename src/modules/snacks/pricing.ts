/**
 * منطق قیمت‌گذاری اختصاصی ماژول «تنقلات»
 * آبشار قیمت (Waterfall) از lib/pricing اجرا می‌شود؛ اینجا ابزارهای تکمیلی است:
 * — قیمت هر بسته / هر کارتن / هر شرینک (نرخ‌نامه چندواحدی)
 * — پیام پله بعدی: «۵ کارتن دیگر اضافه کن → ۶٪ ارزان‌تر»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product, Settings } from '@/lib/types';

export interface UnitPriceRow {
  unit: string;
  /** تعداد در هر واحد */
  qty: number;
  price: number;
  note: string;
}

/** قیمت هر ۱۰۰ گرم (تومان) — برای مقایسه شفاف تنقلات وزن‌دار */
export const per100gPrice = (product: Product, unitPrice?: number): number | null => {
  const spec = product.snacks;
  if (!spec?.weightGr) return null;
  const price = unitPrice ?? product.basePrice;
  const grams = spec.weightGr * Math.max(1, product.unitsPerCarton);
  return grams > 0 ? Math.round((price / grams) * 100) : null;
};

/**
 * نرخ‌نامه واحدهای فروش: تک‌بسته، کارتن، شرینک، پالت
 */
export const unitPriceTable = (product: Product, cartonsPerPallet = 50): UnitPriceRow[] => {
  const rows: UnitPriceRow[] = [];
  const perPiece = product.unitsPerCarton > 0 ? Math.round(product.basePrice / product.unitsPerCarton) : product.basePrice;

  rows.push({ unit: 'بسته', qty: 1, price: perPiece, note: 'قیمت تک‌بسته (داخل کارتن)' });
  rows.push({
    unit: product.unit === 'کارتن' ? 'کارتن' : product.unit,
    qty: product.unitsPerCarton,
    price: product.basePrice,
    note: product.packDesc,
  });
  rows.push({
    unit: 'شرینک',
    qty: Math.max(2, Math.round(product.unitsPerCarton / 3)),
    price: Math.round(perPiece * Math.max(2, Math.round(product.unitsPerCarton / 3)) * 0.99),
    note: 'شرینک نیم‌کارتنی — ۱٪ تخفیف',
  });
  rows.push({
    unit: 'پالت',
    qty: product.unitsPerCarton * cartonsPerPallet,
    price: Math.round(product.basePrice * cartonsPerPallet * 0.95),
    note: `پالت ${cartonsPerPallet} کارتنی — ۵٪ تخفیف`,
  });

  return rows;
};

export interface TierNudge {
  needQty: number;
  nextUnitPrice: number;
  extraSavePercent: number;
  message: string;
  freeShipping: boolean;
}

/**
 * پیشنهاد پله بعدی: «۵ کارتن دیگر اضافه کن → ۶٪ ارزان‌تر»
 */
export const nextTierNudge = (product: Product, qty: number, settings?: Settings): TierNudge | null => {
  const tiers = [...product.tiers].sort((a, b) => a.minQty - b.minQty);
  const next = tiers.find((t) => t.minQty > qty);
  if (!next) return null;

  const current = [...tiers].reverse().find((t) => qty >= t.minQty) ?? tiers[0];
  const extra = Math.max(0, next.discountPercent - current.discountPercent);
  const needQty = next.minQty - qty;

  const lineAtNext = next.price * next.minQty;
  const freeShipping = settings ? lineAtNext >= settings.freeShippingMin : false;

  const message = `${needQty} ${product.unit} دیگر اضافه کن → ${extra}٪ ارزان‌تر${freeShipping ? ' و ارسال رایگان' : ''}`;

  return {
    needQty,
    nextUnitPrice: next.price,
    extraSavePercent: extra,
    message,
    freeShipping,
  };
};

/** برچسب‌های تصویری محصول (نمادهای UI) */
export const snackFeatureBadges = (
  product: Product,
): { label: string; icon: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'vip' | 'accent' }[] => {
  const spec = product.snacks;
  if (!spec) return [];
  const out: { label: string; icon: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'vip' | 'accent' }[] = [];
  if (spec.flavor) out.push({ label: `😋 طعم ${spec.flavor}`, icon: 'candy', tone: 'warning' });
  if (spec.isSugarFree) out.push({ label: '🌿 بدون قند', icon: 'leaf', tone: 'success' });
  if (spec.isChocolateCoated) out.push({ label: '🍫 روکش شکلاتی', icon: 'cake', tone: 'brand' });
  if (spec.weightGr) out.push({ label: `${spec.weightGr} گرمی`, icon: 'package', tone: 'info' });
  if (spec.ageGroup && spec.ageGroup !== 'همه') out.push({ label: `ویژه ${spec.ageGroup}`, icon: 'users', tone: 'neutral' });
  if (spec.isSeasonal) out.push({ label: '🎁 فصلی', icon: 'gift', tone: 'vip' });
  return out;
};
