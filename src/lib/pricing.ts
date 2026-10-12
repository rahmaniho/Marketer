import type { CartLine, Contract, Customer, Offer, PriceBreakdownStep, PriceTier, Product } from './types';
import { categoryById } from '@/data/categories';

/**
 * موتور قیمت‌گذاری آبشاری (Waterfall Pricing)
 * ترتیب اعمال:
 *  ۱) قیمت پایه عمده
 *  ۲) قرارداد قیمت پیمانی مشتری
 *  ۳) تخفیف نقدی
 *  ۴) پله حجمی
 *  ۵) آفرهای کمپین فعال
 *  ۶) آفر اختصاصی مشتری VIP
 * سقف مجموع تخفیف‌ها ۳۵٪ تعیین شده است (قابل تنظیم در تنظیمات دمو).
 */
export const MAX_TOTAL_DISCOUNT = 35;

export interface OfferContext {
  offers: Offer[];
  qty: number;
  lineTotal: number;
  cartTotal?: number;
  customer?: Customer | null;
  contract?: Contract | null;
  isFirstOrder?: boolean;
  categoryIds?: string[];
  brandId?: string;
}

/** بررسی شرایط اعمال یک آفر */
export const offerApplies = (offer: Offer, ctx: OfferContext): { ok: boolean; reason: string } => {
  if (!offer.isActive) return { ok: false, reason: 'غیرفعال' };
  const now = Date.now();
  if (new Date(offer.startsAt).getTime() > now) return { ok: false, reason: 'شروع نشده' };
  if (new Date(offer.endsAt).getTime() < now) return { ok: false, reason: 'پایان‌یافته' };
  if (offer.vipOnly && ctx.customer?.tier !== 'VIP') return { ok: false, reason: 'فقط مشتریان VIP' };
  if (offer.firstOrderOnly && !ctx.isFirstOrder) return { ok: false, reason: 'فقط سفارش اول' };
  if (offer.minQty && ctx.qty < offer.minQty) return { ok: false, reason: `حداقل ${offer.minQty} کارتن` };
  if (offer.minCartAmount && (ctx.cartTotal ?? ctx.lineTotal) < offer.minCartAmount)
    return { ok: false, reason: 'حداقل مبلغ سبد' };
  const brandOk = offer.brandIds.length === 0 || (ctx.brandId ? offer.brandIds.includes(ctx.brandId) : false);
  const catOk =
    offer.categoryIds.length === 0 ||
    (ctx.categoryIds ?? []).some((c) => {
      const cat = categoryById(c);
      return offer.categoryIds.includes(c) || (cat?.parentId ? offer.categoryIds.includes(cat.parentId) : false);
    });
  const productScopeOk = offer.productIds.length === 0 || catOk || brandOk;
  if (!productScopeOk) return { ok: false, reason: 'خارج از حوزه آفر' };
  if (offer.productIds.length === 0 && (offer.brandIds.length > 0 || offer.categoryIds.length > 0)) {
    if (!brandOk && !catOk) return { ok: false, reason: 'خارج از برند/دسته آفر' };
  }
  return { ok: true, reason: 'معتبر' };
};

export const applicableOffers = (ctx: OfferContext): Offer[] =>
  ctx.offers.filter((o) => offerApplies(o, ctx).ok && o.percent > 0);

export interface PriceResult {
  basePrice: number;
  unitPrice: number;
  lineTotal: number;
  rawTotal: number;
  totalDiscount: number;
  discountPercent: number;
  steps: PriceBreakdownStep[];
  appliedOffers: Offer[];
  tierLabel: string;
  /** پیشنهاد پله بعدی: «۲ کارتن دیگر اضافه کن → ۳٪ ارزان‌تر» */
  nextTier?: PriceTier & { needQty: number; extraSave: number; newUnitPrice: number };
  vipApplied: boolean;
}

export const computePrice = (input: {
  product: Product;
  qty: number;
  offers: Offer[];
  customer?: Customer | null;
  contract?: Contract | null;
  isFirstOrder?: boolean;
  cartTotal?: number;
  cashPayment?: boolean;
}): PriceResult => {
  const { product, qty, offers, customer, contract, isFirstOrder, cartTotal, cashPayment } = input;
  const steps: PriceBreakdownStep[] = [];
  let unit = product.basePrice;
  let discountAcc = 0;

  steps.push({
    label: 'قیمت پایه عمده',
    detail: `${product.unit} ${product.unitsPerCarton} عددی`,
    amount: product.basePrice,
    percent: 0,
    kind: 'base',
  });

  const applyStep = (percent: number, label: string, detail: string, kind: PriceBreakdownStep['kind']) => {
    if (percent <= 0) return;
    const remaining = Math.max(0, MAX_TOTAL_DISCOUNT - discountAcc);
    const eff = Math.min(percent, remaining);
    if (eff <= 0) return;
    const before = unit;
    unit = Math.round((unit * (100 - eff)) / 100);
    discountAcc += eff;
    steps.push({ label, detail, amount: before - unit, percent: eff, kind });
  };

  // ۲) قرارداد پیمانی
  if (contract && contract.status !== 'expired' && contract.productIds.includes(product.id)) {
    applyStep(
      contract.discountPercent,
      'قرارداد قیمت پیمانی',
      `${contract.code} — ${contract.title}`,
      'contract',
    );
  }

  // ۳) تخفیف نقدی
  if (cashPayment && product.cashDiscountPercent > 0) {
    applyStep(product.cashDiscountPercent, 'تخفیف تسویه نقدی', 'پرداخت نقدی هنگام تحویل', 'cash');
  }

  // ۴) پله حجمی
  const tiers = [...product.tiers].sort((a, b) => a.minQty - b.minQty);
  const activeTier = [...tiers].reverse().find((t) => qty >= t.minQty) ?? tiers[0];
  if (activeTier.discountPercent > 0) {
    applyStep(
      activeTier.discountPercent,
      `پله حجمی ${activeTier.label}`,
      `${qty} ${product.unit} — پله ${activeTier.minQty} ${product.unit}`,
      'volume',
    );
  }

  // ۵) آفرهای کمپین
  const ctx: OfferContext = {
    offers,
    qty,
    lineTotal: unit * qty,
    cartTotal,
    customer,
    contract,
    isFirstOrder,
    categoryIds: [product.categoryId, categoryById(product.categoryId)?.parentId ?? ''].filter(Boolean),
    brandId: product.brandId,
  };
  const applied: Offer[] = [];
  applicableOffers(ctx)
    .filter((o) => o.kind !== 'vip')
    .forEach((o) => {
      applyStep(o.percent, o.title, `کمپین ${o.code}`, 'offer');
      applied.push(o);
    });

  // ۶) آفر VIP
  const vipOffer = offers.find((o) => o.kind === 'vip' && o.vipOnly);
  let vipApplied = false;
  if (customer?.tier === 'VIP' && vipOffer && offerApplies(vipOffer, ctx).ok) {
    applyStep(vipOffer.percent, 'تخفیف باشگاه VIP', 'سطح طلایی مشتری', 'vip');
    applied.push(vipOffer);
    vipApplied = true;
  }

  const rawTotal = product.basePrice * qty;
  const lineTotal = unit * qty;
  const nextTierRaw = tiers.find((t) => t.minQty > qty);
  const nextTier = nextTierRaw
    ? {
        ...nextTierRaw,
        needQty: nextTierRaw.minQty - qty,
        newUnitPrice: Math.round((product.basePrice * (100 - nextTierRaw.discountPercent)) / 100),
        extraSave: Math.max(0, (unit - Math.round((product.basePrice * (100 - nextTierRaw.discountPercent)) / 100)) * nextTierRaw.minQty),
      }
    : undefined;

  return {
    basePrice: product.basePrice,
    unitPrice: unit,
    lineTotal,
    rawTotal,
    totalDiscount: rawTotal - lineTotal,
    discountPercent: rawTotal > 0 ? Math.round(((rawTotal - lineTotal) / rawTotal) * 1000) / 10 : 0,
    steps,
    appliedOffers: applied,
    tierLabel: activeTier.label,
    nextTier,
    vipApplied,
  };
};

export interface CartTotals {
  subtotal: number;
  rawSubtotal: number;
  discountTotal: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  itemCount: number;
  cartonCount: number;
  freeShippingGap: number;
  lines: CartLine[];
}

export const computeCart = (input: {
  lines: CartLine[];
  offers: Offer[];
  customer?: Customer | null;
  contracts?: Contract[];
  taxPercent: number;
  freeShippingMin: number;
  shippingCost: number;
  cashPayment?: boolean;
  isFirstOrder?: boolean;
}): CartTotals => {
  const { lines, offers, customer, contracts = [], taxPercent, freeShippingMin, shippingCost, cashPayment, isFirstOrder } = input;
  const rawSubtotal = lines.reduce((s, l) => s + l.basePrice * l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discountTotal = rawSubtotal - subtotal;
  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const ship = subtotal >= freeShippingMin || lines.length === 0 ? 0 : shippingCost;
  return {
    rawSubtotal,
    subtotal,
    discountTotal,
    taxAmount,
    shippingCost: ship,
    grandTotal: subtotal + taxAmount + ship,
    itemCount: lines.length,
    cartonCount: lines.reduce((s, l) => s + l.qty, 0),
    freeShippingGap: Math.max(0, freeShippingMin - subtotal),
    lines,
  };
};

/** هشدار شفاف پله بعدی برای یک خط سبد */
export const tierHint = (line: CartLine, product: Product): string | null => {
  const tiers = [...product.tiers].sort((a, b) => a.minQty - b.minQty);
  const next = tiers.find((t) => t.minQty > line.qty);
  if (!next) return null;
  const need = next.minQty - line.qty;
  const gain = next.discountPercent - (tiers.filter((t) => line.qty >= t.minQty).pop()?.discountPercent ?? 0);
  if (gain <= 0) return null;
  return `${need} ${product.unit} دیگر اضافه کن → ${gain}٪ ارزان‌تر`;
};
