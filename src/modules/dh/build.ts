/**
 * سازنده‌های موجودیت از روی JSON خام ماژول شوینده و بهداشتی
 * — کارن سافت (Karen-soft.ir)
 */
import type {
  Brand,
  Bundle,
  Category,
  Compliance,
  DetergentHygieneSpec,
  Offer,
  Product,
  ProductBadge,
  Supplier,
} from '@/lib/types';
import { slugify } from '@/lib/format';
import type {
  BrandRow,
  BundleRow,
  CategoryRow,
  ComplianceRow,
  OfferRow,
  ProductRow,
  SupplierRow,
} from './types';

/** پالت‌های رنگی لوگوی مونوگرام (همان سبک بخش غذایی) */
const PALETTES: Brand['logo'][] = [
  { from: '#0369a1', to: '#38bdf8', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#be185d', to: '#f472b6', fg: '#ffffff', shape: 'square', initials: '' },
  { from: '#0e7490', to: '#22d3ee', fg: '#ffffff', shape: 'hex', initials: '' },
  { from: '#6d28d9', to: '#a78bfa', fg: '#ffffff', shape: 'pill', initials: '' },
  { from: '#15803d', to: '#4ade80', fg: '#ffffff', shape: 'shield', initials: '' },
  { from: '#b45309', to: '#fbbf24', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#1d4ed8', to: '#60a5fa', fg: '#ffffff', shape: 'square', initials: '' },
  { from: '#9d174d', to: '#fb7185', fg: '#ffffff', shape: 'hex', initials: '' },
  { from: '#065f46', to: '#34d399', fg: '#ffffff', shape: 'pill', initials: '' },
  { from: '#3730a3', to: '#818cf8', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#9a3412', to: '#fb923c', fg: '#ffffff', shape: 'shield', initials: '' },
  { from: '#0f172a', to: '#64748b', fg: '#ffffff', shape: 'square', initials: '' },
];

const initialsOf = (name: string): string => {
  const clean = name.replace(/[()«»\-–]/g, ' ').replace(/گروه|صنعتی|صنایع|شرکت|ایران|بین‌المللی/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.slice(0, 2);
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]).slice(0, 2);
};

export const buildCategory = (row: CategoryRow, parentId: string | null): Category => ({
  id: row.id,
  parentId,
  name: row.name,
  nameEn: row.nameEn,
  icon: row.icon,
  color: row.color,
  description: row.description,
});

export const buildBrand = (row: BrandRow, index: number): Brand => {
  const international = row.country !== 'ایران';
  const palette = PALETTES[index % PALETTES.length];
  return {
    id: `dh-br-${String(index + 1).padStart(3, '0')}`,
    name: row.name,
    nameEn: row.nameEn,
    slug: slugify(row.nameEn || row.name),
    country: row.country,
    origin: international ? 'international' : 'iran',
    industry: row.industry,
    categoryIds: [],
    productLines: row.productLines,
    description: `${row.name} (${row.nameEn}) — ${international ? 'برند وارداتی مجاز' : 'تولیدکننده ایرانی'} صنف شوینده و بهداشتی${row.company ? ` از ${row.company}` : ''}. خطوط تولید: ${row.productLines.join('، ')}.`,
    licenseKind: international ? 'IRC' : index % 4 === 0 ? 'استاندارد' : index % 4 === 1 ? 'وزارت بهداشت' : index % 4 === 2 ? 'حلال' : 'استاندارد',
    licenseCode: international ? `IRC-${2500000 + index * 137}` : `HW-${50 + (index % 20)}/${10000 + index * 37}`,
    licenseStatus: index % 17 === 5 ? 'expiring' : index % 23 === 9 ? 'pending' : 'valid',
    licenseExpiry: new Date(Date.UTC(2026 + (index % 3), (index * 5) % 12, 10 + (index % 18))).toISOString(),
    logo: { ...palette, initials: initialsOf(row.name) },
    established: 1345 + ((index * 7) % 55),
    rating: Number((3.6 + ((index * 13) % 14) / 10).toFixed(1)),
    exclusive: index % 9 === 2,
    representative: index % 9 === 2 ? `نمایندگی رسمی ${row.name} در ایران` : undefined,
    isActive: true,
    tags: [
      row.industry === 'detergent' ? 'شوینده' : row.industry === 'hygiene' ? 'بهداشتی' : 'شوینده و بهداشتی',
      international ? 'وارداتی' : 'تولید داخل',
      ...(index % 6 === 0 ? ['پرفروش'] : []),
    ],
  };
};

export const buildProduct = (
  row: ProductRow,
  index: number,
  module: 'detergent' | 'hygiene',
  brandId: string,
  country: string,
): Product => {
  const steps: [number, number][] = row.tiers
    ? (row.tiers.split(',').map((pair) => {
        const [q, p] = pair.split(':');
        return [Number(q), Number(p)] as [number, number];
      }) as [number, number][])
    : [[10, 4], [51, 8], [201, 12]];

  const tiers = [
    { minQty: row.moq || 1, price: row.basePrice, discountPercent: 0, label: 'قیمت پایه' },
    ...steps.map(([qty, pct]) => ({
      minQty: qty,
      price: Math.round((row.basePrice * (100 - pct)) / 100),
      discountPercent: pct,
      label: `از ${qty} ${row.unit}`,
    })),
  ];

  const prodDate = new Date(Date.now() - (index % 9) * 86400000 * 13);
  const expiry = new Date(prodDate.getTime() + row.shelf * 30 * 86400000);

  const dh: DetergentHygieneSpec = {
    volumeMl: row.volumeMl,
    weightGr: row.weightGr,
    fragrance: row.fragrance,
    concentration: row.concentration,
    ph: row.ph,
    skinType: row.skinType,
    isAntibacterial: row.isAntibacterial ?? false,
    hasBleach: row.hasBleach ?? false,
    packaging: row.packaging,
    certification: row.certification ?? [],
    useCases: row.useCases ?? [],
    sensitiveSkin: row.sensitiveSkin ?? false,
    colorFree: row.colorFree ?? false,
    childSafe: row.childSafe ?? false,
    crueltyFree: row.crueltyFree ?? false,
    recyclable: row.recyclable ?? false,
    natural: row.natural ?? false,
    bulkPack: row.bulkPack ?? ['کارتن'],
    unitsPerShrink: row.unitsPerShrink,
    cleaningPower: row.cleaningPower ?? 3,
    storage: row.storage ?? 'عادی',
    safety: row.safety,
  };

  const tags = [
    ...(row.useCases ?? []),
    row.fragrance ?? '',
    row.packaging ?? '',
    ...(row.isAntibacterial ? ['ضدباکتری'] : []),
    ...(row.sensitiveSkin ? ['مناسب پوست حساس'] : []),
    ...(row.childSafe ? ['کودک'] : []),
    ...(row.natural ? ['طبیعی'] : []),
    ...(row.tags ?? []),
  ].filter(Boolean);

  return {
    id: `dh-p-${String(index + 1).padStart(3, '0')}`,
    name: row.name,
    nameEn: row.nameEn,
    brandId,
    categoryId: row.category,
    module,
    dh,
    barcode: `62${String(2000000000 + index * 7919).slice(0, 11)}`,
    sku: `${module === 'detergent' ? 'DTG' : 'HYG'}-${String(1000 + index)}`,
    unit: row.unit,
    unitsPerCarton: row.unitsPerCarton,
    packDesc: row.packDesc,
    basePrice: row.basePrice,
    marketPrice: row.marketPrice,
    cashDiscountPercent: row.cash ?? 3,
    tiers,
    stock: row.stock,
    reserved: Math.floor(row.stock * 0.1),
    warehouseId: `w-00${(index % 3) + 1}`,
    productionDate: prodDate.toISOString(),
    expiryDate: expiry.toISOString(),
    shelfLifeMonths: row.shelf,
    moq: row.moq,
    paletteQty: row.unit === 'گالن' ? 24 : 40 + ((index * 7) % 50),
    country,
    images: [0, 1, 2].map((k) => ({
      seed: `dh-img-${index + 1}-${k + 1}`,
      hue: `${module === 'detergent' ? '#0ea5e9' : '#ec4899'}${k}`,
      icon: 'package',
    })),
    badges: [...(row.badges ?? [])] as ProductBadge[],
    tags,
    description: `${row.name} — ${row.packDesc}. ${
      row.volumeMl ? `حجم ${row.volumeMl} میلی‌لیتر` : row.weightGr ? `وزن ${row.weightGr} گرم` : ''
    }${row.fragrance ? `، رایحه ${row.fragrance}` : ''}${row.isAntibacterial ? '، ضدباکتری' : ''}. عرضه عمده با پله قیمتی کارتن/شرینک/پالت برای فروشگاه‌های زنجیره‌ای، سوپرمارکت، داروخانه و پخش‌کنندگان. قیمت هر لیتر/کیلو در برگه مقایسه محصول محاسبه می‌شود.`,
    rating: Number((3.8 + ((index * 11) % 12) / 10).toFixed(1)),
    soldCount: 240 + ((index * 337) % 9800),
    isActive: true,
    createdAt: new Date(Date.now() - (180 - (index % 150)) * 86400000).toISOString(),
  };
};

export const buildOffer = (row: OfferRow, brandIdOf: (name: string) => string): Offer => ({
  id: row.id,
  title: row.title,
  kind: row.kind,
  description: row.description,
  percent: row.percent,
  code: row.code,
  brandIds: (row.brandNames ?? []).map(brandIdOf),
  categoryIds: row.categoryIds ?? [],
  productIds: row.productIds ?? [],
  minCartAmount: row.minCartAmount,
  minQty: row.minQty,
  startsAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  endsAt: new Date(Date.now() + row.days * 86400000).toISOString(),
  vipOnly: row.vipOnly ?? false,
  firstOrderOnly: row.kind === 'first-order',
  maxUsage: 50000,
  usedCount: 800 + ((row.percent * 971) % 4200),
  color: row.color,
  icon: row.icon,
  isActive: true,
});

export const buildBundle = (row: BundleRow, productIdOfName: (name: string) => string | undefined): Bundle => ({
  id: row.id,
  title: row.title,
  description: row.description,
  module: row.module,
  productIds: row.productNames.map((n) => productIdOfName(n)).filter(Boolean) as string[],
  bundleDiscountPercent: row.bundleDiscountPercent,
  seasonalTag: row.seasonalTag,
  icon: row.icon,
  color: row.color,
  isActive: true,
});

export const buildCompliance = (row: ComplianceRow, brandIdOf: (name: string) => string | undefined): Compliance => ({
  id: row.id,
  title: row.title,
  kind: row.kind,
  refCode: row.refCode,
  issuer: row.issuer,
  brandId: row.brandName ? brandIdOf(row.brandName) : undefined,
  productId: row.productId,
  module: row.module,
  issuedAt: new Date(row.issuedAt).toISOString(),
  expiresAt: new Date(row.expiresAt).toISOString(),
  status: row.status,
  note: row.note,
});

export const buildSupplier = (row: SupplierRow, brandIdOf: (name: string) => string | undefined): Supplier => ({
  id: row.id,
  name: row.name,
  brandIds: row.brandNames.map((n) => brandIdOf(n)).filter(Boolean) as string[],
  country: row.country,
  supplierType: row.supplierType,
  contactName: row.contactName,
  phone: row.phone,
  email: row.email,
  paymentTerms: row.paymentTerms,
  leadTimeDays: row.leadTimeDays,
  rating: row.rating,
  status: 'active',
  contractCode: `CT-DH-${row.id.slice(-3)}`,
  contractExpiry: new Date(Date.now() + 260 * 86400000).toISOString(),
  providedCategories: [],
  monthlyVolume: row.monthlyVolume,
  fillRate: row.fillRate,
  notes: row.notes,
});
