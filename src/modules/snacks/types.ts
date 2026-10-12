/**
 * ساختار سطرهای JSON خام ماژول «تنقلات»
 * (فایل‌های /data/snacks/*.json)
 * — کارن سافت (Karen-soft.ir)
 */
import type {
  ComplianceKind,
  Industry,
  ModuleKey,
  OfferKind,
  ProductBadge,
  SalesUnit,
} from '@/lib/types';

export interface CategoryRow {
  id: string;
  parentId?: string | null;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  description: string;
}

export interface CategoriesFile {
  roots: CategoryRow[];
  children: CategoryRow[];
}

export interface BrandRow {
  name: string;
  nameEn: string;
  company: string;
  industry: Industry;
  country: string;
  productLines: string[];
}

export interface BrandsFile {
  brands: BrandRow[];
}

export interface ProductRow {
  name: string;
  nameEn: string;
  brand: string;
  category: string;
  unit: SalesUnit;
  unitsPerCarton: number;
  packDesc: string;
  basePrice: number;
  marketPrice: number;
  moq: number;
  cash?: number;
  /** پله‌ها: «تعداد:درصد» با کاما — مثال 20:4,60:7,150:10 */
  tiers?: string;
  flavor?: string;
  weightGr?: number;
  packaging?: 'بسته' | 'کارتن' | 'شرینک';
  ageGroup?: 'کودک' | 'بزرگسال' | 'همه';
  isSugarFree?: boolean;
  isChocolateCoated?: boolean;
  isSeasonal?: boolean;
  certification?: string[];
  badges?: ProductBadge[];
  tags?: string[];
  stock: number;
  shelf: number;
}

export interface ProductsFile {
  products: ProductRow[];
}

export interface OfferRow {
  id: string;
  title: string;
  kind: OfferKind;
  description: string;
  percent: number;
  code: string;
  categoryIds?: string[];
  productIds?: string[];
  brandNames?: string[];
  minCartAmount: number;
  minQty: number;
  days: number;
  color: string;
  icon: string;
  vipOnly?: boolean;
}

export interface OffersFile {
  offers: OfferRow[];
}

export interface BundleRow {
  id: string;
  title: string;
  description: string;
  module: ModuleKey;
  productNames: string[];
  bundleDiscountPercent: number;
  seasonalTag?: string;
  icon: string;
  color: string;
}

export interface BundlesFile {
  bundles: BundleRow[];
}

export interface ComplianceRow {
  id: string;
  title: string;
  kind: ComplianceKind;
  refCode: string;
  issuer: string;
  brandName?: string;
  productId?: string;
  module: ModuleKey;
  issuedAt: string;
  expiresAt: string;
  status: 'valid' | 'expiring' | 'pending' | 'expired';
  note: string;
}

export interface ComplianceFile {
  items: ComplianceRow[];
}

export interface SupplierRow {
  id: string;
  name: string;
  supplierType: Industry;
  country: string;
  contactName: string;
  phone: string;
  email: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  brandNames: string[];
  monthlyVolume: number;
  fillRate: number;
  notes: string;
}

export interface SuppliersFile {
  suppliers: SupplierRow[];
}
