/**
 * کامپوننت‌های مشترک ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * رنگ‌بندی اختصاصی: بنفش/نیلی (مدرن و مصرفی)
 * — کارن سافت (Karen-soft.ir)
 */
import type { Bundle, Product } from '@/lib/types';
import { Badge, Card, Stars } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, toman } from '@/lib/format';
import { miscFeatureBadges, perKgPrice, unitPriceTable } from './pricing';
import { msProducts } from './data';

export { CompliancePill, ComplianceCard } from '@/modules/dh';

export const MS_THEME = {
  main: { from: '#6366f1', to: '#a855f7', soft: '#eef2ff', label: 'کالاهای مصرفی سوپرمارکتی' },
  stationery: '#6366f1',
  battery: '#f59e0b',
  mobile: '#06b6d4',
  appliances: '#ef4444',
  kitchen: '#10b981',
  pet: '#f97316',
  seasonal: '#a855f7',
  household: '#14b8a6',
};

/** نوار هدر ماژول با رنگ‌بندی اختصاصی */
export const MiscModuleBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-l from-indigo-600 via-violet-600 to-purple-500 px-6 py-7 text-white shadow-pop">
    <div className="relative z-10">
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">ماژول کالاهای مصرفی سوپرمارکتی — کارن سافت</p>
      <h1 className="mt-1 text-2xl font-extrabold leading-snug lg:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/90">{subtitle}</p>}
    </div>
    <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
    <div className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-white/10" />
  </div>
);

/** چیپ‌های ویژگی تصویری: 🎁 فصلی، ⚡ برقی، 🐾 حیوان خانگی و … */
export const SpecChips = ({ product, max = 5 }: { product: Product; max?: number }) => {
  const badges = miscFeatureBadges(product).slice(0, max);
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[10px] font-bold text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
        >
          {b.label}
        </span>
      ))}
    </div>
  );
};

/** جدول مشخصات فنی: جنس، ابعاد، وزن، ولتاژ/توان، ظرفیت، سازگاری، حیوان، سنی، فصلی */
export const SpecGrid = ({ product }: { product: Product }) => {
  const spec = product.misc;
  if (!spec) return null;
  const rows: [string, string, string][] = [
    ['جنس / متریال', spec.material ?? '—', 'cube'],
    ['ابعاد', spec.dimensions ?? '—', 'box'],
    ['وزن', spec.weightGr ? `${faNum(spec.weightGr)} گرم` : '—', 'package'],
    ['ولتاژ', spec.voltage ?? '—', 'zap'],
    ['توان مصرفی', spec.wattage ? `${faNum(spec.wattage)} وات` : '—', 'activity'],
    ['ظرفیت', spec.capacity ?? '—', 'bottle'],
    ['سازگاری', spec.compatibility ?? '—', 'phone'],
    ['نوع حیوان', spec.animalType ?? '—', 'heart'],
    ['گروه سنی', spec.ageGroup ?? '—', 'users'],
    ['محصول فصلی', spec.isSeasonal ? `✓ ${spec.seasonName ?? 'مناسبتی'}` : '—', 'gift'],
    ['گواهی‌ها', spec.certification?.length ? spec.certification.join('، ') : '—', 'badge'],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {rows.map(([label, value, icon]) => (
        <div key={label} className="flex items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
          <Icon name={icon} className="h-4 w-4 flex-none text-ink-400" />
          <div className="min-w-0">
            <p className="text-[10px] text-ink-400">{label}</p>
            <p className="truncate text-[12px] font-bold text-ink-700 dark:text-ink-200">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/** قیمت هر عدد / هر بسته / هر کارتن + قیمت هر کیلو */
export const PerUnitPrices = ({ product }: { product: Product }) => {
  const kg = perKgPrice(product);
  const table = unitPriceTable(product);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {kg != null && (
          <Badge tone="brand" icon="package">
            هر کیلو ≈ {toman(kg)}
          </Badge>
        )}
        <Badge tone="info" icon="tag">
          هر عدد ≈ {toman(Math.round(product.basePrice / Math.max(1, product.unitsPerCarton)))}
        </Badge>
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
        <table className="w-full text-right text-[11px]">
          <thead className="bg-ink-50 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
            <tr>
              <th className="px-3 py-1.5 font-bold">واحد فروش</th>
              <th className="px-3 py-1.5 font-bold">تعداد</th>
              <th className="px-3 py-1.5 font-bold">قیمت</th>
              <th className="hidden px-3 py-1.5 font-bold sm:table-cell">توضیح</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
            {table.map((r) => (
              <tr key={r.unit} className="bg-white dark:bg-ink-900">
                <td className="px-3 py-1.5 font-bold text-ink-700 dark:text-ink-200">{r.unit}</td>
                <td className="num px-3 py-1.5 text-ink-500">{faNum(r.qty)}</td>
                <td className="num px-3 py-1.5 font-bold text-ink-800 dark:text-ink-100">{toman(r.price)}</td>
                <td className="hidden px-3 py-1.5 text-ink-400 sm:table-cell">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/** جدول مقایسه فنی دو محصول کنار هم */
export const CompareSpecs = ({ products }: { products: Product[] }) => {
  if (products.length < 2) return null;
  const [a, b] = products;
  const perUnit = (p: Product) => (p.unitsPerCarton > 0 ? p.basePrice / p.unitsPerCarton : p.basePrice);
  const rows: { label: string; a: string; b: string; better?: 'a' | 'b' | 'equal' }[] = [
    {
      label: 'قیمت پایه',
      a: toman(a.basePrice),
      b: toman(b.basePrice),
      better: a.basePrice === b.basePrice ? 'equal' : a.basePrice < b.basePrice ? 'a' : 'b',
    },
    {
      label: 'قیمت هر عدد',
      a: toman(Math.round(perUnit(a))),
      b: toman(Math.round(perUnit(b))),
      better: perUnit(a) === perUnit(b) ? 'equal' : perUnit(a) < perUnit(b) ? 'a' : 'b',
    },
    {
      label: 'قیمت هر کیلو',
      a: perKgPrice(a) != null ? toman(perKgPrice(a)!) : '—',
      b: perKgPrice(b) != null ? toman(perKgPrice(b)!) : '—',
      better: (perKgPrice(a) ?? Infinity) === (perKgPrice(b) ?? Infinity) ? 'equal' : (perKgPrice(a) ?? Infinity) < (perKgPrice(b) ?? Infinity) ? 'a' : 'b',
    },
    { label: 'جنس', a: a.misc?.material ?? '—', b: b.misc?.material ?? '—' },
    { label: 'ابعاد', a: a.misc?.dimensions ?? '—', b: b.misc?.dimensions ?? '—' },
    {
      label: 'ظرفیت',
      a: a.misc?.capacity ?? '—',
      b: b.misc?.capacity ?? '—',
    },
    {
      label: 'توان / ولتاژ',
      a: a.misc?.wattage ? `${faNum(a.misc.wattage)} وات` : a.misc?.voltage ?? '—',
      b: b.misc?.wattage ? `${faNum(b.misc.wattage)} وات` : b.misc?.voltage ?? '—',
    },
    { label: 'سازگاری', a: a.misc?.compatibility ?? '—', b: b.misc?.compatibility ?? '—' },
    { label: 'نوع حیوان', a: a.misc?.animalType ?? '—', b: b.misc?.animalType ?? '—' },
    { label: 'گروه سنی', a: a.misc?.ageGroup ?? '—', b: b.misc?.ageGroup ?? '—' },
    { label: 'امتیاز', a: `${faNum(a.rating)}`, b: `${faNum(b.rating)}` },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700">
      <table className="w-full min-w-[520px] text-right text-[12px]">
        <thead>
          <tr className="bg-ink-50 dark:bg-ink-800">
            <th className="px-3 py-2 font-bold text-ink-500">ویژگی</th>
            <th className="px-3 py-2 font-bold text-ink-800 dark:text-ink-100">{a.name}</th>
            <th className="px-3 py-2 font-bold text-ink-800 dark:text-ink-100">{b.name}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
          {rows.map((r) => (
            <tr key={r.label} className="bg-white dark:bg-ink-900">
              <td className="px-3 py-2 text-ink-500">{r.label}</td>
              <td className={`px-3 py-2 font-semibold ${r.better === 'a' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-700 dark:text-ink-200'}`}>
                {r.a} {r.better === 'a' && '✓'}
              </td>
              <td className={`px-3 py-2 font-semibold ${r.better === 'b' ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-700 dark:text-ink-200'}`}>
                {r.b} {r.better === 'b' && '✓'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** کارت باندل پیشنهادی («پک بازگشایی مدارس») */
export const BundleCard = ({ bundle, onAdd }: { bundle: Bundle; onAdd?: (bundle: Bundle) => void }) => {
  const items = bundle.productIds.map((id) => msProducts.find((p) => p.id === id)).filter(Boolean) as Product[];
  const total = items.reduce((s, p) => s + p.basePrice, 0);
  const discounted = Math.round((total * (100 - bundle.bundleDiscountPercent)) / 100);
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: bundle.color }}>
            <Icon name={bundle.icon} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[14px] font-extrabold text-ink-800 dark:text-ink-100">{bundle.title}</h3>
            {bundle.seasonalTag && (
              <Badge tone="warning" className="mt-0.5">
                {bundle.seasonalTag}
              </Badge>
            )}
          </div>
        </div>
        <Badge tone="success">{faNum(bundle.bundleDiscountPercent)}٪ تخفیف باندل</Badge>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">{bundle.description}</p>
      <ul className="flex-1 space-y-1">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-1.5 text-[11px] text-ink-600 dark:text-ink-300">
            <Icon name="check-circle" className="h-3.5 w-3.5 text-emerald-500" />
            <span className="truncate">{p.name}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-ink-100 pt-2 dark:border-ink-800">
        <div>
          <p className="text-[10px] text-ink-400 line-through">{toman(total)}</p>
          <p className="text-[14px] font-extrabold text-ink-900 dark:text-ink-50">{toman(discounted)}</p>
        </div>
        {onAdd && (
          <button onClick={() => onAdd(bundle)} className="btn-primary btn-sm">
            <Icon name="cart" className="h-4 w-4" />
            افزودن باندل
          </button>
        )}
      </div>
    </Card>
  );
};

/** امتیاز و ستاره محصول */
export const ProductRating = ({ product }: { product: Product }) => (
  <div className="flex items-center gap-1.5">
    <Stars value={product.rating} />
    <span className="num text-[11px] text-ink-400">({faNum(product.soldCount)} فروش)</span>
  </div>
);
