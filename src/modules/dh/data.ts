/**
 * لایه داده ماژول شوینده و بهداشتی — مونتاژ موجودیت‌ها از JSON خام
 * داده‌ها در پوشه‌های جداگانه /data/detergent/ و /data/hygiene/ نگهداری می‌شوند.
 * — کارن سافت (Karen-soft.ir)
 */
import type { Brand, Bundle, Category, Compliance, Offer, Product, Supplier } from '@/lib/types';
import { buildBrand, buildBundle, buildCategory, buildCompliance, buildOffer, buildProduct, buildSupplier } from './build';

import detCategoriesRaw from '../../../data/detergent/categories.json';
import detBrandsRaw from '../../../data/detergent/brands.json';
import detProductsRaw from '../../../data/detergent/products.json';
import detOffersRaw from '../../../data/detergent/offers.json';
import detBundlesRaw from '../../../data/detergent/bundles.json';
import detComplianceRaw from '../../../data/detergent/compliance.json';
import detSuppliersRaw from '../../../data/detergent/suppliers.json';

import hygCategoriesRaw from '../../../data/hygiene/categories.json';
import hygBrandsRaw from '../../../data/hygiene/brands.json';
import hygProductsRaw from '../../../data/hygiene/products.json';
import hygOffersRaw from '../../../data/hygiene/offers.json';
import hygBundlesRaw from '../../../data/hygiene/bundles.json';
import hygComplianceRaw from '../../../data/hygiene/compliance.json';
import hygSuppliersRaw from '../../../data/hygiene/suppliers.json';

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
const detCategories = detCategoriesRaw as unknown as CategoriesFile;
const detBrands = detBrandsRaw.brands as unknown as BrandRow[];
const detProducts = detProductsRaw.products as unknown as ProductRow[];
const detOffers = detOffersRaw.offers as unknown as OfferRow[];
const detBundles = detBundlesRaw.bundles as unknown as BundleRow[];
const detCompliance = detComplianceRaw.items as unknown as ComplianceRow[];
const detSuppliers = detSuppliersRaw.suppliers as unknown as SupplierRow[];

const hygCategories = hygCategoriesRaw as unknown as CategoriesFile;
const hygBrands = hygBrandsRaw.brands as unknown as BrandRow[];
const hygProducts = hygProductsRaw.products as unknown as ProductRow[];
const hygOffers = hygOffersRaw.offers as unknown as OfferRow[];
const hygBundles = hygBundlesRaw.bundles as unknown as BundleRow[];
const hygCompliance = hygComplianceRaw.items as unknown as ComplianceRow[];
const hygSuppliers = hygSuppliersRaw.suppliers as unknown as SupplierRow[];

// ───────────────────────────────────────────── دسته‌بندی‌های ماژول (سه شاخه اصلی)
export const dhCategories: Category[] = [
  ...detCategories.roots.map((r) => buildCategory(r, null)),
  ...detCategories.children.map((r) => buildCategory(r, r.parentId ?? null)),
  ...hygCategories.roots.map((r) => buildCategory(r, null)),
  ...hygCategories.children.map((r) => buildCategory(r, r.parentId ?? null)),
];

// ───────────────────────────────────────────── برندها (ایرانی + خارجی)
const brandRows = [...detBrands, ...hygBrands];
export const dhBrands: Brand[] = brandRows.map((row, i) => buildBrand(row, i));

/** یافتن شناسه برند با نام (تقریبی) */
export const dhBrandIdOf = (name: string): string | undefined => {
  const found = dhBrands.find(
    (b) => b.name === name || b.name.includes(name) || name.includes(b.name) || b.nameEn.toLowerCase() === name.toLowerCase(),
  );
  return found?.id;
};

const brandIdOrFirst = (name: string): string => dhBrandIdOf(name) ?? dhBrands[0].id;

// ───────────────────────────────────────────── محصولات (با ویژگی‌های تخصصی)
export const dhProducts: Product[] = [
  ...detProducts.map((row, i) =>
    buildProduct(row, i, 'detergent', brandIdOrFirst(row.brand), dhBrands.find((b) => b.id === brandIdOrFirst(row.brand))?.country ?? 'ایران'),
  ),
  ...hygProducts.map((row, i) =>
    buildProduct(row, detProducts.length + i, 'hygiene', brandIdOrFirst(row.brand), dhBrands.find((b) => b.id === brandIdOrFirst(row.brand))?.country ?? 'ایران'),
  ),
];

/** بازگرداندن شناسه محصول از روی نام (برای باندل‌ها) */
export const dhProductIdOfName = (name: string): string | undefined =>
  dhProducts.find((p) => p.name === name)?.id;

// دسته‌های هر برند از روی محصولاتش پر می‌شود
{
  const map = new Map<string, Set<string>>();
  dhProducts.forEach((p) => {
    if (!map.has(p.brandId)) map.set(p.brandId, new Set());
    map.get(p.brandId)!.add(p.categoryId);
  });
  dhBrands.forEach((b) => {
    const cats = map.get(b.id);
    if (cats && cats.size > 0) b.categoryIds = [...cats];
  });
}

// ───────────────────────────────────────────── آفرها و کمپین‌های فصلی
export const dhOffers: Offer[] = [
  ...detOffers.map((o) => buildOffer(o, brandIdOrFirst)),
  ...hygOffers.map((o) => buildOffer(o, brandIdOrFirst)),
];

// ───────────────────────────────────────────── باندل‌های پیشنهادی
export const dhBundles: Bundle[] = [
  ...detBundles.map((b) => buildBundle(b, dhProductIdOfName)),
  ...hygBundles.map((b) => buildBundle(b, dhProductIdOfName)),
];

// ───────────────────────────────────────────── مجوزها و استانداردها
export const dhCompliance: Compliance[] = [
  ...detCompliance.map((c) => buildCompliance(c, dhBrandIdOf)),
  ...hygCompliance.map((c) => buildCompliance(c, dhBrandIdOf)),
];

// ───────────────────────────────────────────── تأمین‌کنندگان و پخش‌کنندگان
export const dhSuppliers: Supplier[] = [
  ...detSuppliers.map((s) => buildSupplier(s, dhBrandIdOf)),
  ...hygSuppliers.map((s) => buildSupplier(s, dhBrandIdOf)),
];

// ───────────────────────────────────────────── توابع کمکی
export const dhRootCategories = dhCategories.filter((c) => !c.parentId);
export const dhChildrenOf = (id: string) => dhCategories.filter((c) => c.parentId === id);
export const dhCategoryById = (id: string) => dhCategories.find((c) => c.id === id);
export const dhBrandById = (id: string) => dhBrands.find((b) => b.id === id);
export const dhProductById = (id: string) => dhProducts.find((p) => p.id === id);
export const dhProductsByBrand = (brandId: string) => dhProducts.filter((p) => p.brandId === brandId);
export const dhProductsByCategory = (categoryId: string) =>
  dhProducts.filter((p) => p.categoryId === categoryId || dhChildrenOf(categoryId).some((c) => c.id === p.categoryId));
export const dhBundleById = (id: string) => dhBundles.find((b) => b.id === id);
export const dhComplianceForBrand = (brandId: string) => dhCompliance.filter((c) => c.brandId === brandId);
