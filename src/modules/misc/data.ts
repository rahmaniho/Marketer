/**
 * لایه داده ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Brand, Bundle, Category, Compliance, Offer, Product, Supplier } from '@/lib/types';
import categoriesRaw from '../../../data/misc/categories.json';
import brandsRaw from '../../../data/misc/brands.json';
import productsRaw from '../../../data/misc/products.json';
import offersRaw from '../../../data/misc/offers.json';
import bundlesRaw from '../../../data/misc/bundles.json';
import complianceRaw from '../../../data/misc/compliance.json';
import suppliersRaw from '../../../data/misc/suppliers.json';
import { buildBrand, buildBundle, buildCategory, buildCompliance, buildOffer, buildProduct, buildSupplier } from './build';
import type {
  BrandRow,
  BundleRow,
  CategoriesFile,
  ComplianceRow,
  OfferRow,
  ProductRow,
  SupplierRow,
} from './types';

// JSON خام با cast نوع‌دهی می‌شود (union typeها در JSON متنی نیستند)
const miscCategories = categoriesRaw as unknown as CategoriesFile;
const miscBrands = brandsRaw.brands as unknown as BrandRow[];
const miscProductRows = productsRaw.products as unknown as ProductRow[];
const miscOffers = offersRaw.offers as unknown as OfferRow[];
const miscBundles = bundlesRaw.bundles as unknown as BundleRow[];
const miscCompliance = complianceRaw.items as unknown as ComplianceRow[];
const miscSuppliers = suppliersRaw.suppliers as unknown as SupplierRow[];

// ───────────────────────────────────────────── دسته‌بندی‌های ماژول (هشت شاخه اصلی)
export const msCategories: Category[] = [
  ...miscCategories.roots.map((r) => buildCategory(r, null)),
  ...miscCategories.children.map((r) => buildCategory(r, r.parentId ?? null)),
];

// ───────────────────────────────────────────── برندها (ایرانی + خارجی)
export const msBrands: Brand[] = miscBrands.map((row, i) => buildBrand(row, i));

/** یافتن شناسه برند با نام (تقریبی) */
export const msBrandIdOf = (name: string): string | undefined => {
  const found = msBrands.find(
    (b) => b.name === name || b.name.includes(name) || name.includes(b.name) || b.nameEn.toLowerCase() === name.toLowerCase(),
  );
  return found?.id;
};

const brandIdOrFirst = (name: string): string => msBrandIdOf(name) ?? msBrands[0].id;

// ───────────────────────────────────────────── محصولات (با ویژگی‌های تخصصی)
export const msProducts: Product[] = miscProductRows.map((row, i) => {
  const bid = brandIdOrFirst(row.brand);
  return buildProduct(row, i, bid, msBrands.find((b) => b.id === bid)?.country ?? 'ایران');
});

/** بازگرداندن شناسه محصول از روی نام (برای باندل‌ها) */
export const msProductIdOfName = (name: string): string | undefined =>
  msProducts.find((p) => p.name === name)?.id;

// دسته‌های هر برند از روی محصولاتش پر می‌شود
{
  const map = new Map<string, Set<string>>();
  msProducts.forEach((p) => {
    if (!map.has(p.brandId)) map.set(p.brandId, new Set());
    map.get(p.brandId)!.add(p.categoryId);
  });
  msBrands.forEach((b) => {
    const cats = map.get(b.id);
    if (cats && cats.size > 0) b.categoryIds = [...cats];
  });
}

// ───────────────────────────────────────────── آفرها و کمپین‌های فصلی
export const msOffers: Offer[] = miscOffers.map((o) => buildOffer(o, brandIdOrFirst));

// ───────────────────────────────────────────── باندل‌های پیشنهادی
export const msBundles: Bundle[] = miscBundles.map((b) => buildBundle(b, msProductIdOfName));

// ───────────────────────────────────────────── مجوزها و استانداردها
export const msCompliance: Compliance[] = miscCompliance.map((c) => buildCompliance(c, msBrandIdOf));

// ───────────────────────────────────────────── تأمین‌کنندگان و پخش‌کنندگان
export const msSuppliers: Supplier[] = miscSuppliers.map((s) => buildSupplier(s, msBrandIdOf));

// ───────────────────────────────────────────── توابع کمکی
export const msRootCategories = msCategories.filter((c) => !c.parentId);
export const msChildrenOf = (id: string) => msCategories.filter((c) => c.parentId === id);
export const msCategoryById = (id: string) => msCategories.find((c) => c.id === id);
export const msBrandById = (id: string) => msBrands.find((b) => b.id === id);
export const msProductById = (id: string) => msProducts.find((p) => p.id === id);
export const msProductsByBrand = (brandId: string) => msProducts.filter((p) => p.brandId === brandId);
export const msProductsByCategory = (categoryId: string) =>
  msProducts.filter((p) => p.categoryId === categoryId || msChildrenOf(categoryId).some((c) => c.id === p.categoryId));
export const msBundleById = (id: string) => msBundles.find((b) => b.id === id);
export const msComplianceForBrand = (brandId: string) => msCompliance.filter((c) => c.brandId === brandId);
