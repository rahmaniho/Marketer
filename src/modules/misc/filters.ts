/**
 * فیلترهای تخصصی ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Product, SeasonName } from '@/lib/types';

/** گروه‌های سنی (لوازم‌التحریر و غذای حیوانات) */
export const AGE_GROUPS = ['کودک', 'نوجوان', 'بزرگسال', 'عمومی'] as const;

/** نوع حیوان (محصولات حیوانات خانگی) */
export const ANIMAL_TYPES = ['سگ', 'گربه', 'سگ و گربه'] as const;

/** فصل‌های مناسبتی */
export const SEASONS: SeasonName[] = ['نوروز', 'رمضان', 'بازگشایی مدارس', 'تابستان', 'زمستان'];

/** متریال‌های پرتکرار (فیلتر چک‌باکسی) */
export const MATERIALS = [
  { id: 'plastic', label: 'پلاستیک', match: (m: string) => /پلاستیک|پلی|PP|PVC|ABS|سیلیکون|نایلون/i.test(m) },
  { id: 'steel', label: 'استیل و فلز', match: (m: string) => /استیل|فلز|آلومینیوم|روی/i.test(m) },
  { id: 'glass', label: 'شیشه', match: (m: string) => /شیشه|بوروسیلیکات|اوپال|چینی/i.test(m) },
  { id: 'paper', label: 'کاغذ و چوب', match: (m: string) => /کاغذ|چوب|مداد|فوم/i.test(m) },
  { id: 'other', label: 'سایر', match: (m: string) => m.length > 0 },
];

export interface MiscFilters {
  q?: string;
  categoryId?: string;
  brandIds?: string[];
  materialId?: string | null;
  ageGroup?: string | null;
  animalType?: string | null;
  compatibility?: string | null;
  isSeasonal?: boolean;
  seasonName?: string | null;
  hasOffer?: boolean;
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
  { id: 'top', label: 'پرفروش‌ترین‌ها', hint: 'بالاترین فروش ماهانه', match: (p) => p.soldCount > 2500 },
  { id: 'new', label: 'جدید', hint: 'تازه‌واردهای کاتالوگ', match: (p) => Date.now() - +new Date(p.createdAt) < 150 * 86400000 },
  { id: 'seasonal', label: 'فصلی و مناسبتی', hint: 'نوروز، رمضان، مدارس، تابستان', match: (p) => !!p.misc?.isSeasonal },
  { id: 'economy', label: 'اقتصادی', hint: 'بهترین قیمت برای سبد روزمره', match: (p) => p.badges.includes('economy') || p.basePrice < 300000 },
  { id: 'premium', label: 'پریمیوم', hint: 'کیفیت بالا و برندهای مطرح', match: (p) => p.badges.includes('premium') },
  { id: 'offers', label: 'آفر ویژه', hint: 'دارای کمپین فعال', match: (p) => offeredProductIds.has(p.id) },
];

export const applyMiscFilters = (products: Product[], f: MiscFilters): Product[] => {
  let list = [...products];

  if (f.q?.trim()) {
    const q = f.q.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.misc?.material ?? '').includes(q) ||
        (p.misc?.compatibility ?? '').includes(q),
    );
  }
  if (f.categoryId) {
    list = list.filter((p) => p.categoryId === f.categoryId);
  }
  if (f.brandIds?.length) list = list.filter((p) => f.brandIds!.includes(p.brandId));
  if (f.materialId) {
    const bucket = MATERIALS.find((m) => m.id === f.materialId);
    if (bucket) list = list.filter((p) => bucket.match(p.misc?.material ?? ''));
  }
  if (f.ageGroup) list = list.filter((p) => p.misc?.ageGroup === f.ageGroup);
  if (f.animalType) list = list.filter((p) => p.misc?.animalType === f.animalType);
  if (f.compatibility) list = list.filter((p) => (p.misc?.compatibility ?? '').includes(f.compatibility as string));
  if (f.isSeasonal) list = list.filter((p) => p.misc?.isSeasonal);
  if (f.seasonName) list = list.filter((p) => p.misc?.seasonName === f.seasonName);

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
