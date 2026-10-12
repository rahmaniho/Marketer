/**
 * فیلترهای تخصصی ماژول «تنقلات»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product } from '@/lib/types';

/** طعم‌های اصلی (فیلتر اصلی پنل مشتری) */
export const FLAVORS = ['نمکی', 'پنیری', 'سرکه', 'BBQ', 'کچاپ', 'پیتزا', 'میوه‌ای', 'شکلاتی'] as const;

/** گروه‌های سنی */
export const AGE_GROUPS = ['کودک', 'بزرگسال', 'همه'] as const;

/** بازه وزن */
export interface WeightBucket {
  id: string;
  label: string;
  match: (p: Product) => boolean;
}

export const WEIGHT_BUCKETS: WeightBucket[] = [
  { id: 'mini', label: 'کمتر از ۷۰ گرم (تک‌نفره)', match: (p) => (p.snacks?.weightGr ?? 0) > 0 && (p.snacks?.weightGr ?? 0) < 70 },
  { id: 'small', label: '۷۰ تا ۱۲۰ گرم', match: (p) => (p.snacks?.weightGr ?? 0) >= 70 && (p.snacks?.weightGr ?? 0) <= 120 },
  { id: 'medium', label: '۱۲۰ تا ۲۵۰ گرم', match: (p) => (p.snacks?.weightGr ?? 0) > 120 && (p.snacks?.weightGr ?? 0) <= 250 },
  { id: 'large', label: 'بزرگ‌تر از ۲۵۰ گرم (خانواده)', match: (p) => (p.snacks?.weightGr ?? 0) > 250 },
];

/** بسته‌بندی فروش */
export const PACKAGINGS = ['بسته', 'کارتن', 'شرینک'] as const;

export interface SnackFilters {
  q?: string;
  categoryId?: string;
  brandIds?: string[];
  flavor?: string | null;
  ageGroup?: string | null;
  weightIds?: string[];
  packaging?: string | null;
  isSugarFree?: boolean;
  isChocolateCoated?: boolean;
  isSeasonal?: boolean;
  sort?: string;
}

export interface SmartSection {
  id: string;
  label: string;
  hint: string;
  match: (p: Product) => boolean;
}

/** دسته‌بندی هوشمند: «پرفروش»، «جدید»، «فصلی»، «اقتصادی»، «پریمیوم» */
export const smartSections = (offeredProductIds: Set<string>): SmartSection[] => [
  { id: 'top', label: 'پرفروش‌ترین‌ها', hint: 'بالاترین فروش ماهانه', match: (p) => p.soldCount > 3000 },
  { id: 'new', label: 'جدید', hint: 'تازه‌واردهای کاتالوگ', match: (p) => Date.now() - +new Date(p.createdAt) < 150 * 86400000 },
  { id: 'seasonal', label: 'فصلی و مناسبتی', hint: 'نوروز، مدارس، رمضان', match: (p) => !!p.snacks?.isSeasonal },
  { id: 'economy', label: 'اقتصادی', hint: 'بهترین قیمت برای سبد روزمره', match: (p) => p.badges.includes('economy') || p.basePrice < 150000 },
  { id: 'premium', label: 'پریمیوم', hint: 'کیفیت بالا و برندهای مطرح', match: (p) => p.badges.includes('premium') },
  { id: 'sugar-free', label: 'بدون قند', hint: 'انتخاب سالم‌تر', match: (p) => !!p.snacks?.isSugarFree },
  { id: 'offers', label: 'آفر ویژه', hint: 'دارای کمپین فعال', match: (p) => offeredProductIds.has(p.id) },
];

export const applySnackFilters = (products: Product[], f: SnackFilters): Product[] => {
  let list = [...products];

  if (f.q?.trim()) {
    const q = f.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.snacks?.flavor ?? '').includes(q),
    );
  }
  if (f.categoryId) {
    list = list.filter((p) => p.categoryId === f.categoryId);
  }
  if (f.brandIds?.length) list = list.filter((p) => f.brandIds!.includes(p.brandId));
  if (f.flavor) list = list.filter((p) => p.snacks?.flavor === f.flavor);
  if (f.ageGroup) list = list.filter((p) => p.snacks?.ageGroup === f.ageGroup);
  if (f.weightIds?.length) {
    list = list.filter((p) => f.weightIds!.some((wid) => WEIGHT_BUCKETS.find((b) => b.id === wid)?.match(p)));
  }
  if (f.packaging) list = list.filter((p) => p.snacks?.packaging === f.packaging);
  if (f.isSugarFree) list = list.filter((p) => p.snacks?.isSugarFree);
  if (f.isChocolateCoated) list = list.filter((p) => p.snacks?.isChocolateCoated);
  if (f.isSeasonal) list = list.filter((p) => p.snacks?.isSeasonal);

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
        const pa = a.unitsPerCarton > 0 ? a.basePrice / a.unitsPerCarton : a.basePrice;
        const pb = b.unitsPerCarton > 0 ? b.basePrice / b.unitsPerCarton : b.basePrice;
        return pa - pb;
      });
      break;
    default:
      list.sort((a, b) => b.soldCount / 1000 + b.rating - (a.soldCount / 1000 + a.rating));
  }
  return list;
};
