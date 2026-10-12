/**
 * فیلترهای تخصصی ماژول شوینده و بهداشتی
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product } from '@/lib/types';

/** نوع کاربرد (فیلتر اصلی پنل مشتری) */
export const USE_CASES = ['لباسشویی', 'ظرفشویی', 'سطوح', 'بدن', 'مو', 'دهان و دندان'] as const;

/** رایحه‌ها */
export const FRAGRANCES = ['بی‌رایحه', 'لیمو', 'گل', 'وانیل', 'صابونی'] as const;

/** بازه حجم/وزن — ساشه، ۴۰۰ گرمی، ۱ کیلویی، ۵ کیلویی، گالن ۲۰ لیتری */
export interface SizeBucket {
  id: string;
  label: string;
  match: (p: Product) => boolean;
}

export const SIZE_BUCKETS: SizeBucket[] = [
  { id: 'sachet', label: 'ساشه', match: (p) => p.dh?.packaging === 'ساشه' },
  { id: 'small', label: '۴۰۰ گرمی / ۴۰۰ میلی‌لیتری', match: (p) => ((p.dh?.weightGr ?? 0) >= 300 && (p.dh?.weightGr ?? 0) <= 600) || ((p.dh?.volumeMl ?? 0) >= 300 && (p.dh?.volumeMl ?? 0) <= 500) },
  { id: 'medium', label: '۱ کیلویی / ۱ لیتری', match: (p) => ((p.dh?.weightGr ?? 0) >= 800 && (p.dh?.weightGr ?? 0) <= 1500) || ((p.dh?.volumeMl ?? 0) >= 800 && (p.dh?.volumeMl ?? 0) <= 1500) },
  { id: 'large', label: '۴ تا ۵ کیلویی', match: (p) => (p.dh?.weightGr ?? 0) >= 3500 && (p.dh?.weightGr ?? 0) <= 6000 },
  { id: 'gallon', label: 'گالن ۲۰ لیتری', match: (p) => (p.dh?.volumeMl ?? 0) >= 15000 || p.dh?.packaging === 'گالن' },
];

/** بسته‌بندی عمده */
export const BULK_PACKS = ['کارتن', 'شرینک', 'پالت'] as const;

export interface DhFilters {
  q?: string;
  categoryId?: string;
  brandIds?: string[];
  useCase?: string | null;
  fragrance?: string | null;
  sizeIds?: string[];
  antibacterial?: boolean;
  sensitiveSkin?: boolean;
  childSafe?: boolean;
  natural?: boolean;
  bulkPack?: string | null;
  hasOffer?: boolean;
  sort?: string;
}

export interface SmartSection {
  id: string;
  label: string;
  hint: string;
  match: (p: Product) => boolean;
}

/** دسته‌بندی هوشمند: «شوینده پرکاربرد»، «بهداشتی پرفروش»، «جدید»، «آفر ویژه» */
export const smartSections = (offeredProductIds: Set<string>): SmartSection[] => [
  { id: 'common', label: 'شوینده پرکاربرد', hint: 'پرتکرارترین اقلام سبد فروشگاه‌ها', match: (p) => p.module === 'detergent' && p.soldCount > 2500 },
  { id: 'top', label: 'بهداشتی پرفروش', hint: 'بالاترین فروش ماهانه بهداشتی', match: (p) => p.module === 'hygiene' && p.soldCount > 2500 },
  { id: 'new', label: 'جدید', hint: 'تازه‌واردهای کاتالوگ', match: (p) => Date.now() - +new Date(p.createdAt) < 150 * 86400000 },
  { id: 'offers', label: 'آفر ویژه', hint: 'دارای کمپین فعال', match: (p) => offeredProductIds.has(p.id) },
];

export const applyDhFilters = (products: Product[], f: DhFilters): Product[] => {
  let list = [...products];

  if (f.q?.trim()) {
    const q = f.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.dh?.fragrance ?? '').includes(q),
    );
  }
  if (f.categoryId) {
    list = list.filter((p) => p.categoryId === f.categoryId);
  }
  if (f.brandIds?.length) list = list.filter((p) => f.brandIds!.includes(p.brandId));
  if (f.useCase) list = list.filter((p) => p.dh?.useCases?.includes(f.useCase as string));
  if (f.fragrance) list = list.filter((p) => p.dh?.fragrance === f.fragrance);
  if (f.sizeIds?.length) {
    list = list.filter((p) => f.sizeIds!.some((sid) => SIZE_BUCKETS.find((b) => b.id === sid)?.match(p)));
  }
  if (f.antibacterial) list = list.filter((p) => p.dh?.isAntibacterial);
  if (f.sensitiveSkin) list = list.filter((p) => p.dh?.sensitiveSkin);
  if (f.childSafe) list = list.filter((p) => p.dh?.childSafe);
  if (f.natural) list = list.filter((p) => p.dh?.natural);
  if (f.bulkPack) list = list.filter((p) => p.dh?.bulkPack?.includes(f.bulkPack as 'کارتن'));

  switch (f.sort) {
    case 'price-asc':
      list.sort((a, b) => a.basePrice - b.basePrice);
      break;
    case 'price-desc':
      list.sort((a, b) => b.basePrice - a.basePrice);
      break;
    case 'sold':
      list.sort((a, b) => b.soldCount - a.soldCount);
      break;
    case 'new':
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      break;
    case 'per-unit':
      list.sort((a, b) => {
        const pa = (a.dh?.volumeMl ?? a.dh?.weightGr ?? 0) > 0 ? a.basePrice / ((a.dh?.volumeMl ?? a.dh?.weightGr ?? 1) * a.unitsPerCarton) : a.basePrice;
        const pb = (b.dh?.volumeMl ?? b.dh?.weightGr ?? 0) > 0 ? b.basePrice / ((b.dh?.volumeMl ?? b.dh?.weightGr ?? 1) * b.unitsPerCarton) : b.basePrice;
        return pa - pb;
      });
      break;
    default:
      list.sort((a, b) => b.soldCount / 1000 + b.rating - (a.soldCount / 1000 + a.rating));
  }
  return list;
};
