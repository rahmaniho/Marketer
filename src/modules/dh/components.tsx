/**
 * کامپوننت‌های مشترک ماژول شوینده و بهداشتی
 * رنگ‌بندی: شوینده = آبی/سبز — بهداشتی = صورتی/سفید
 * — کارن سافت (Karen-soft.ir)
 */
import type { Bundle, Compliance, Product } from '@/lib/types';
import { Badge, Card, Progress, Stars } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { dhFeatureBadges, perKgPrice, perLiterPrice, unitPriceTable } from './pricing';
import { dhProducts } from './data';

export const DH_THEME = {
  detergent: { from: '#0284c7', to: '#22c55e', soft: '#e0f2fe', label: 'شوینده و پاک‌کننده' },
  hygiene: { from: '#ec4899', to: '#f9a8d4', soft: '#fce7f3', label: 'بهداشتی و آرایشی' },
  home: { from: '#14b8a6', to: '#5eead4', soft: '#ccfbf1', label: 'خانه و آشپزخانه' },
};

/** نوار هدر ماژول با رنگ‌بندی اختصاصی */
export const DhModuleBanner = ({ module = 'both', title, subtitle }: { module?: 'detergent' | 'hygiene' | 'both'; title: string; subtitle?: string }) => {
  const style =
    module === 'detergent'
      ? 'from-sky-600 via-cyan-600 to-emerald-500'
      : module === 'hygiene'
        ? 'from-pink-500 via-rose-400 to-fuchsia-400'
        : 'from-sky-600 via-teal-500 to-pink-500';
  return (
    <div className={`relative overflow-hidden rounded-xl2 bg-gradient-to-l ${style} px-6 py-7 text-white shadow-pop`}>
      <div className="relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">ماژول شوینده و بهداشتی — کارن سافت</p>
        <h1 className="mt-1 text-2xl font-extrabold leading-snug lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/90">{subtitle}</p>}
      </div>
      <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-white/10" />
    </div>
  );
};

/** چیپ‌های ویژگی تصویری: 🌿 طبیعی، 💧 ضدباکتری، 👶 کودک، 🌸 رایحه */
export const SpecChips = ({ product, max = 5 }: { product: Product; max?: number }) => {
  const badges = dhFeatureBadges(product).slice(0, max);
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

/** جدول مشخصات فنی: حجم، وزن، رایحه، غلظت، pH، پوست، ضدباکتری، سفیدکننده، بسته‌بندی، گواهی */
export const SpecGrid = ({ product }: { product: Product }) => {
  const spec = product.dh;
  if (!spec) return null;
  const rows: [string, string, string][] = [
    ['حجم', spec.volumeMl ? `${faNum(spec.volumeMl)} میلی‌لیتر` : '—', 'droplet'],
    ['وزن', spec.weightGr ? `${faNum(spec.weightGr)} گرم` : '—', 'package'],
    ['رایحه', spec.fragrance ?? '—', 'flower'],
    ['غلظت', spec.concentration ?? '—', 'sparkles'],
    ['اسیدیته (pH)', spec.ph != null ? faNum(spec.ph) : '—', 'activity'],
    ['نوع پوست', spec.skinType ?? '—', 'heart'],
    ['ضدباکتری', spec.isAntibacterial ? '✓ دارد' : '—', 'shield'],
    ['دارای سفیدکننده', spec.hasBleach ? '✓ دارد' : '—', 'sparkle'],
    ['بسته‌بندی', spec.packaging ?? '—', 'box'],
    ['قدرت پاک‌کنندگی', spec.cleaningPower ? `${faNum(spec.cleaningPower)} از ۵` : '—', 'trendingDown'],
    ['نگهداری', spec.storage ?? 'عادی', 'warehouse'],
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

/** قیمت هر لیتر / هر کیلو + نرخ‌نامه واحدهای شمارش */
export const PerUnitPrices = ({ product }: { product: Product }) => {
  const liter = perLiterPrice(product);
  const kg = perKgPrice(product);
  const table = unitPriceTable(product);
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {liter != null && (
          <Badge tone="info" icon="droplet">
            هر لیتر ≈ {toman(liter)}
          </Badge>
        )}
        {kg != null && (
          <Badge tone="brand" icon="package">
            هر کیلو ≈ {toman(kg)}
          </Badge>
        )}
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
  const rows: { label: string; a: string; b: string; better?: 'a' | 'b' | 'equal' }[] = [
    {
      label: 'قیمت پایه',
      a: toman(a.basePrice),
      b: toman(b.basePrice),
      better: a.basePrice === b.basePrice ? 'equal' : a.basePrice < b.basePrice ? 'a' : 'b',
    },
    {
      label: 'قیمت هر لیتر',
      a: perLiterPrice(a) != null ? toman(perLiterPrice(a)!) : '—',
      b: perLiterPrice(b) != null ? toman(perLiterPrice(b)!) : '—',
      better: (perLiterPrice(a) ?? Infinity) === (perLiterPrice(b) ?? Infinity) ? 'equal' : (perLiterPrice(a) ?? Infinity) < (perLiterPrice(b) ?? Infinity) ? 'a' : 'b',
    },
    {
      label: 'قیمت هر کیلو',
      a: perKgPrice(a) != null ? toman(perKgPrice(a)!) : '—',
      b: perKgPrice(b) != null ? toman(perKgPrice(b)!) : '—',
      better: (perKgPrice(a) ?? Infinity) === (perKgPrice(b) ?? Infinity) ? 'equal' : (perKgPrice(a) ?? Infinity) < (perKgPrice(b) ?? Infinity) ? 'a' : 'b',
    },
    {
      label: 'قدرت پاک‌کنندگی',
      a: `${faNum(a.dh?.cleaningPower ?? 0)} از ۵`,
      b: `${faNum(b.dh?.cleaningPower ?? 0)} از ۵`,
      better: (a.dh?.cleaningPower ?? 0) === (b.dh?.cleaningPower ?? 0) ? 'equal' : (a.dh?.cleaningPower ?? 0) > (b.dh?.cleaningPower ?? 0) ? 'a' : 'b',
    },
    { label: 'غلظت', a: a.dh?.concentration ?? '—', b: b.dh?.concentration ?? '—' },
    { label: 'رایحه', a: a.dh?.fragrance ?? '—', b: b.dh?.fragrance ?? '—' },
    { label: 'ضدباکتری', a: a.dh?.isAntibacterial ? '✓' : '—', b: b.dh?.isAntibacterial ? '✓' : '—' },
    { label: 'مناسب پوست حساس', a: a.dh?.sensitiveSkin ? '✓' : '—', b: b.dh?.sensitiveSkin ? '✓' : '—' },
    { label: 'بسته‌بندی', a: a.dh?.packaging ?? '—', b: b.dh?.packaging ?? '—' },
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

/** کارت باندل پیشنهادی («پک خانه‌تکانی») */
export const BundleCard = ({ bundle, onAdd }: { bundle: Bundle; onAdd?: (bundle: Bundle) => void }) => {
  const items = bundle.productIds.map((id) => dhProducts.find((p) => p.id === id)).filter(Boolean) as Product[];
  const total = items.reduce((s, p) => s + p.basePrice, 0);
  const discounted = Math.round(total * (100 - bundle.bundleDiscountPercent) / 100);
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: bundle.color }}>
            <Icon name={bundle.icon} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[14px] font-extrabold text-ink-800 dark:text-ink-100">{bundle.title}</h3>
            {bundle.seasonalTag && <Badge tone="warning" className="mt-0.5">{bundle.seasonalTag}</Badge>}
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

/** وضعیت مجوز / استاندارد */
const COMPLIANCE_TONES: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  valid: 'success',
  expiring: 'warning',
  pending: 'neutral',
  expired: 'danger',
};
const COMPLIANCE_LABELS: Record<string, string> = {
  valid: 'معتبر',
  expiring: 'رو به انقضا',
  pending: 'در حال بررسی',
  expired: 'منقضی',
};

export const CompliancePill = ({ item }: { item: Compliance }) => (
  <Badge tone={COMPLIANCE_TONES[item.status] ?? 'neutral'} icon={item.status === 'valid' ? 'check-circle' : 'alert'}>
    {COMPLIANCE_LABELS[item.status] ?? item.status}
  </Badge>
);

/** کارت خلاصه مجوز */
export const ComplianceCard = ({ item, brandName }: { item: Compliance; brandName?: string }) => (
  <Card className="flex flex-col gap-2 p-4">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[10px] font-bold text-ink-400">{item.kind}</p>
        <h4 className="mt-0.5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">{item.title}</h4>
      </div>
      <CompliancePill item={item} />
    </div>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
      <div>
        <dt className="text-ink-400">شماره</dt>
        <dd className="font-bold text-ink-700 dark:text-ink-200">{item.refCode}</dd>
      </div>
      <div>
        <dt className="text-ink-400">صادرکننده</dt>
        <dd className="font-bold text-ink-700 dark:text-ink-200">{item.issuer}</dd>
      </div>
      <div>
        <dt className="text-ink-400">انقضا</dt>
        <dd className="font-bold text-ink-700 dark:text-ink-200">{jalaliDate(item.expiresAt)}</dd>
      </div>
      <div>
        <dt className="text-ink-400">برند</dt>
        <dd className="font-bold text-ink-700 dark:text-ink-200">{brandName ?? '—'}</dd>
      </div>
    </dl>
    <p className="text-[10px] leading-relaxed text-ink-400">{item.note}</p>
  </Card>
);

/** نوار قدرت پاک‌کنندگی (برای مقایسه) */
export const CleaningPowerBar = ({ value, color = '#0ea5e9' }: { value: number; color?: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1">
      <Progress value={(value / 5) * 100} color={color} />
    </div>
    <span className="num text-[11px] font-bold text-ink-500">{faNum(value)}/۵</span>
  </div>
);

/** امتیاز و ستاره محصول */
export const ProductRating = ({ product }: { product: Product }) => (
  <div className="flex items-center gap-1.5">
    <Stars value={product.rating} />
    <span className="num text-[11px] text-ink-400">({faNum(product.soldCount)} فروش)</span>
  </div>
);
