import type { Brand, Product } from '@/lib/types';
import { normalizeFa } from './format';

/** جست‌وجوی هوشمند: فارسی + لاتین + بارکد + نام برند و مترادف‌ها */
const SYNONYMS: Record<string, string[]> = {
  نوشابه: ['کوکاکولا', 'پپسی', 'زمزم', 'کولا'],
  ماست: ['لبنیات', 'دبه'],
  پنیر: ['لبنیات', 'ufo'],
  روغن: ['سرخ‌کردنی', 'مایع', 'جامد'],
  رب: ['گوجه'],
  ماکارونی: ['اسپاگتی', 'پاستا', 'رشته'],
  برنج: ['طارم', 'هاشمی'],
  چای: ['کیسه‌ای', 'سیاه'],
  بیسکویت: ['کراکر', 'ویفر', 'پتی‌بور'],
  شکلات: ['کاکائو', 'تخته'],
  دستمال: ['کاغذی', 'سلولزی'],
  آب: ['معدنی', 'آشامیدنی'],
  سوسیس: ['کالباس', 'گوشتی'],
  تخم: ['مرغ'],
  خرما: ['مضافتی', 'رطب'],
  زعفران: ['سرگل', 'نگین'],
};

export interface SearchHit {
  product: Product;
  score: number;
  matchedOn: 'name' | 'brand' | 'barcode' | 'category' | 'tag';
}

export const searchProducts = (
  products: Product[],
  brands: Brand[],
  query: string,
  limit = 60,
): SearchHit[] => {
  const q = normalizeFa(query);
  if (!q) return products.slice(0, limit).map((p) => ({ product: p, score: 1, matchedOn: 'name' as const }));

  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const expanded = new Set([q]);
  Object.entries(SYNONYMS).forEach(([key, values]) => {
    if (q.includes(normalizeFa(key))) values.forEach((v) => expanded.add(normalizeFa(v)));
    if (values.some((v) => q.includes(normalizeFa(v)))) expanded.add(normalizeFa(key));
  });

  const hits: SearchHit[] = [];
  products.forEach((p) => {
    const brand = brandMap.get(p.brandId);
    const name = normalizeFa(p.name);
    const nameEn = normalizeFa(p.nameEn);
    const brandName = normalizeFa(brand?.name ?? '');
    const brandEn = normalizeFa(brand?.nameEn ?? '');
    const barcode = normalizeFa(p.barcode);
    const sku = normalizeFa(p.sku);
    let score = 0;
    let matchedOn: SearchHit['matchedOn'] = 'name';

    expanded.forEach((term) => {
      if (!term) return;
      if (barcode === term || sku === term) {
        score = Math.max(score, 120);
        matchedOn = 'barcode';
        return;
      }
      if (name === term) score = Math.max(score, 100);
      else if (name.includes(term)) {
        score = Math.max(score, name.startsWith(term) ? 90 : 70);
        matchedOn = 'name';
      }
      if (brandName.includes(term) || brandEn.includes(term)) {
        score = Math.max(score, 60);
        if (score <= 60) matchedOn = 'brand';
      }
      if (nameEn.includes(term)) score = Math.max(score, 55);
      if (p.tags.some((t) => normalizeFa(t).includes(term))) {
        score = Math.max(score, 40);
        if (score <= 40) matchedOn = 'tag';
      }
      if (normalizeFa(p.packDesc).includes(term)) score = Math.max(score, 35);
    });

    // امتیاز مثبت برای کالاهای فعال و پرفروش
    if (score > 0) {
      score += Math.min(8, Math.round(p.soldCount / 2000));
      if (p.stock <= 0) score -= 30;
      hits.push({ product: p, score, matchedOn });
    }
  });

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
};

/** پیشنهادهای جست‌وجو */
export const searchSuggestions = (query: string, products: Product[], brands: Brand[]): string[] => {
  const q = normalizeFa(query);
  if (q.length < 2) return ['شیر پرچمدار', 'روغن سرخ‌کردنی', 'رب گوجه‌فرنگی', 'کنسرو تن ماهی', 'چای کیسه‌ای'];
  const out = new Set<string>();
  products.forEach((p) => {
    if (normalizeFa(p.name).includes(q)) out.add(p.name);
  });
  brands.forEach((b) => {
    if (normalizeFa(b.name).includes(q)) out.add(b.name);
  });
  return [...out].slice(0, 6);
};
