/**
 * منطق قیمت‌گذاری اختصاصی صنف شوینده و بهداشتی
 * آبشار قیمت (Waterfall) از lib/pricing اجرا می‌شود؛ اینجا ابزارهای تکمیلی است:
 * — قیمت هر لیتر / هر کیلو برای مقایسه شفاف
 * — نرخ‌نامه چندواحدی: کارتن، شرینک، پالت، گالن
 * — پیام پله بعدی: «۴ کارتن دیگر اضافه کن → ۵٪ ارزان‌تر و ارسال رایگان»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product, Settings } from '@/lib/types';

export interface UnitPriceRow {
  unit: string;
  /** تعداد در هر واحد (مثلاً ۱۲ بطری در شرینک) */
  qty: number;
  price: number;
  note: string;
}

/** قیمت هر لیتر (تومان) بر اساس قیمت واحد فروش فعلی */
export const perLiterPrice = (product: Product, unitPrice?: number): number | null => {
  const spec = product.dh;
  if (!spec?.volumeMl) return null;
  const price = unitPrice ?? product.basePrice;
  const liters = (spec.volumeMl / 1000) * Math.max(1, product.unitsPerCarton);
  return liters > 0 ? Math.round(price / liters) : null;
};

/** قیمت هر کیلوگرم (تومان) بر اساس قیمت واحد فروش فعلی */
export const perKgPrice = (product: Product, unitPrice?: number): number | null => {
  const spec = product.dh;
  if (!spec?.weightGr) return null;
  const price = unitPrice ?? product.basePrice;
  const kg = (spec.weightGr / 1000) * Math.max(1, product.unitsPerCarton);
  return kg > 0 ? Math.round(price / kg) : null;
};

/**
 * نرخ‌نامه واحدهای فروش: کارتن، شرینک، پالت، گالن
 * قیمت‌ها بر اساس قیمت پایه کارتن و با احتساب تخفیف ضمنی پالت محاسبه می‌شوند.
 */
export const unitPriceTable = (product: Product, cartonsPerPallet = 50): UnitPriceRow[] => {
  const rows: UnitPriceRow[] = [];
  const spec = product.dh;
  const perPiece = product.unitsPerCarton > 0 ? Math.round(product.basePrice / product.unitsPerCarton) : product.basePrice;

  if (product.unit === 'گالن') {
    rows.push({ unit: 'گالن', qty: 1, price: product.basePrice, note: product.packDesc });
    rows.push({ unit: 'کارتن', qty: 4, price: Math.round(product.basePrice * 4 * 0.98), note: '۴ گالنی — ۲٪ تخفیف کارتنی' });
    rows.push({ unit: 'پالت', qty: cartonsPerPallet * 4, price: Math.round(product.basePrice * cartonsPerPallet * 4 * 0.94), note: 'پالتی — ۶٪ تخفیف حجمی' });
    return rows;
  }

  rows.push({
    unit: `${product.packDesc.includes('بطری') ? 'بطری' : 'عدد'}`,
    qty: 1,
    price: perPiece,
    note: 'قیمت تک‌عدد (داخل کارتن)',
  });
  rows.push({ unit: product.unit === 'کارتن' ? 'کارتن' : product.unit, qty: product.unitsPerCarton, price: product.basePrice, note: product.packDesc });

  const shrinkCount = spec?.unitsPerShrink ?? 0;
  if (shrinkCount > 0 && shrinkCount < product.unitsPerCarton) {
    rows.push({
      unit: 'شرینک',
      qty: shrinkCount,
      price: Math.round(perPiece * shrinkCount * 0.99),
      note: `شرینک ${shrinkCount} عددی`,
    });
  }

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
 * پیشنهاد پله بعدی: «۴ کارتن دیگر اضافه کن → ۵٪ ارزان‌تر و ارسال رایگان»
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
export const dhFeatureBadges = (product: Product): { label: string; icon: string; tone: string }[] => {
  const spec = product.dh;
  if (!spec) return [];
  const out: { label: string; icon: string; tone: string }[] = [];
  if (spec.natural) out.push({ label: '🌿 طبیعی', icon: 'leaf', tone: 'success' });
  if (spec.isAntibacterial) out.push({ label: '💧 ضدباکتری', icon: 'shield', tone: 'info' });
  if (spec.childSafe) out.push({ label: '👶 کودک', icon: 'baby', tone: 'brand' });
  if (spec.fragrance && spec.fragrance !== 'بی‌رایحه') out.push({ label: `🌸 رایحه ${spec.fragrance}`, icon: 'flower', tone: 'vip' });
  if (spec.sensitiveSkin) out.push({ label: 'مناسب پوست حساس', icon: 'heart', tone: 'success' });
  if (spec.colorFree) out.push({ label: 'بدون رنگ', icon: 'droplet', tone: 'neutral' });
  if (spec.crueltyFree) out.push({ label: 'Cruelty-Free', icon: 'leaf', tone: 'success' });
  if (spec.hasBleach) out.push({ label: 'دارای سفیدکننده', icon: 'sparkle', tone: 'warning' });
  return out;
};
