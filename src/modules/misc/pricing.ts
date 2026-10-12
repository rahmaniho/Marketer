/**
 * منطق قیمت‌گذاری اختصاصی ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * آبشار قیمت (Waterfall) از lib/pricing اجرا می‌شود؛ اینجا ابزارهای تکمیلی است:
 * — قیمت هر عدد / هر بسته / هر کارتن (نرخ‌نامه چندواحدی)
 * — پیام پله بعدی: «۳ کارتن دیگر اضافه کن → ۴٪ ارزان‌تر»
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

/** قیمت هر کیلوگرم (تومان) — برای اقلام وزن‌دار مثل غذای حیوانات */
export const perKgPrice = (product: Product, unitPrice?: number): number | null => {
  const spec = product.misc;
  if (!spec?.weightGr) return null;
  const price = unitPrice ?? product.basePrice;
  const kg = (spec.weightGr / 1000) * Math.max(1, product.unitsPerCarton);
  return kg > 0 ? Math.round(price / kg) : null;
};

/**
 * نرخ‌نامه واحدهای فروش: تک‌عدد/بسته، کارتن، شرینک، پالت
 */
export const unitPriceTable = (product: Product, cartonsPerPallet = 50): UnitPriceRow[] => {
  const rows: UnitPriceRow[] = [];
  const perPiece = product.unitsPerCarton > 0 ? Math.round(product.basePrice / product.unitsPerCarton) : product.basePrice;

  rows.push({
    unit: 'تک‌عدد',
    qty: 1,
    price: perPiece,
    note: 'قیمت تک‌عدد (داخل کارتن)',
  });
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
 * پیشنهاد پله بعدی: «۳ کارتن دیگر اضافه کن → ۴٪ ارزان‌تر»
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
export const miscFeatureBadges = (product: Product): { label: string; icon: string; tone: string }[] => {
  const spec = product.misc;
  if (!spec) return [];
  const out: { label: string; icon: string; tone: string }[] = [];
  if (spec.isSeasonal) out.push({ label: `🎁 فصلی (${spec.seasonName ?? 'مناسبتی'})`, icon: 'gift', tone: 'vip' });
  if (spec.material) out.push({ label: `جنس ${spec.material}`, icon: 'cube', tone: 'info' });
  if (spec.voltage || spec.wattage) out.push({ label: `⚡ ${spec.wattage ? `${spec.wattage} وات` : spec.voltage}`, icon: 'zap', tone: 'warning' });
  if (spec.compatibility) out.push({ label: `سازگار با ${spec.compatibility}`, icon: 'phone', tone: 'brand' });
  if (spec.animalType && spec.animalType !== 'سگ و گربه') out.push({ label: `🐾 ویژه ${spec.animalType}`, icon: 'heart', tone: 'success' });
  if (spec.ageGroup && spec.ageGroup !== 'عمومی') out.push({ label: `گروه سنی ${spec.ageGroup}`, icon: 'users', tone: 'neutral' });
  return out;
};
