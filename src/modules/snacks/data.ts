/**
 * لایه داده ماژول «تنقلات»
 * — کارن سافت (Karen-soft.ir)
 */
import type { Brand, Bundle, Category, Compliance, Offer, Product, Supplier } from '@/lib/types';
import categoriesRaw from '../../../data/snacks/categories.json';
import brandsRaw from '../../../data/snacks/brands.json';
import productsRaw from '../../../data/snacks/products.json';
import offersRaw from '../../../data/snacks/offers.json';
import bundlesRaw from '../../../data/snacks/bundles.json';
import complianceRaw from '../../../data/snacks/compliance.json';
import suppliersRaw from '../../../data/snacks/suppliers.json';
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
const snCategoryRows = categoriesRaw as unknown as CategoriesFile;
const snBrandRows = brandsRaw.brands as unknown as BrandRow[];
const snProductRows = productsRaw.products as unknown as ProductRow[];
const snOfferRows = offersRaw.offers as unknown as OfferRow[];
const snBundleRows = bundlesRaw.bundles as unknown as BundleRow[];
const snComplianceRows = complianceRaw.items as unknown as ComplianceRow[];
const snSupplierRows = suppliersRaw.suppliers as unknown as SupplierRow[];

// ───────────────────────────────────────────── دسته‌بندی‌های ماژول (هشت شاخه اصلی)
export const snCategories: Category[] = [
  ...snCategoryRows.roots.map((r) => buildCategory(r, null)),
  ...snCategoryRows.children.map((r) => buildCategory(r, r.parentId ?? null)),
];

// ───────────────────────────────────────────── برندها (ایرانی + خارجی)
export const snBrands: Brand[] = snBrandRows.map((row, i) => buildBrand(row, i));

/** یافتن شناسه برند با نام (تقریبی) */
export const snBrandIdOf = (name: string): string | undefined => {
  const found = snBrands.find(
    (b) => b.name === name || b.name.includes(name) || name.includes(b.name) || b.nameEn.toLowerCase() === name.toLowerCase(),
  );
  return found?.id;
};

const brandIdOrFirst = (name: string): string => snBrandIdOf(name) ?? snBrands[0].id;

// ───────────────────────────────────────────── محصولات (با ویژگی‌های تخصصی)
export const snProducts: Product[] = snProductRows.map((row, i) => {
  const bid = brandIdOrFirst(row.brand);
  return buildProduct(row, i, bid, snBrands.find((b) => b.id === bid)?.country ?? 'ایران');
});

/** بازگرداندن شناسه محصول از روی نام (برای باندل‌ها) */
export const snProductIdOfName = (name: string): string | undefined =>
  snProducts.find((p) => p.name === name)?.id;

// دسته‌های هر برند از روی محصولاتش پر می‌شود
{
  const map = new Map<string, Set<string>>();
  snProducts.forEach((p) => {
    if (!map.has(p.brandId)) map.set(p.brandId, new Set());
    map.get(p.brandId)!.add(p.categoryId);
  });
  snBrands.forEach((b) => {
    const cats = map.get(b.id);
    if (cats && cats.size > 0) b.categoryIds = [...cats];
  });
}

// ───────────────────────────────────────────── آفرها و کمپین‌های فصلی
export const snOffers: Offer[] = snOfferRows.map((o) => buildOffer(o, brandIdOrFirst));

// ───────────────────────────────────────────── باندل‌های پیشنهادی
export const snBundles: Bundle[] = snBundleRows.map((b) => buildBundle(b, snProductIdOfName));

// ───────────────────────────────────────────── مجوزها و استانداردها
export const snCompliance: Compliance[] = snComplianceRows.map((c) => buildCompliance(c, snBrandIdOf));

// ───────────────────────────────────────────── تأمین‌کنندگان و پخش‌کنندگان
export const snSuppliers: Supplier[] = snSupplierRows.map((s) => buildSupplier(s, snBrandIdOf));

// ───────────────────────────────────────────── توابع کمکی
export const snRootCategories = snCategories.filter((c) => !c.parentId);
export const snChildrenOf = (id: string) => snCategories.filter((c) => c.parentId === id);
export const snCategoryById = (id: string) => snCategories.find((c) => c.id === id);
export const snBrandById = (id: string) => snBrands.find((b) => b.id === id);
export const snProductById = (id: string) => snProducts.find((p) => p.id === id);
export const snProductsByBrand = (brandId: string) => snProducts.filter((p) => p.brandId === brandId);
export const snProductsByCategory = (categoryId: string) =>
  snProducts.filter((p) => p.categoryId === categoryId || snChildrenOf(categoryId).some((c) => c.id === p.categoryId));
export const snBundleById = (id: string) => snBundles.find((b) => b.id === id);
export const snComplianceForBrand = (brandId: string) => snCompliance.filter((c) => c.brandId === brandId);
