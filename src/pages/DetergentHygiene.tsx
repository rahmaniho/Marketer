/**
 * ماژول شوینده و بهداشتی — پنل مشتری
 * کاتالوگ تخصصی با فیلترهای اختصاصی (کاربرد، رایحه، حجم/وزن، ضدباکتری، پوست حساس، بسته‌بندی عمده)،
 * باندل‌های پیشنهادی (پک خانه‌تکانی)، پیشنهاد هوشمند، دسته‌بندی هوشمند و مقایسه فنی محصولات
 * — کارن سافت (Karen-soft.ir)
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, SectionTitle, Switch, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { useBrandMap, useOffers, useProducts, useStore } from '@/store/useStore';
import { faNum, tomanShort } from '@/lib/format';
import {
  BULK_PACKS,
  BundleCard,
  CompareSpecs,
  DhModuleBanner,
  FRAGRANCES,
  SIZE_BUCKETS,
  USE_CASES,
  applyDhFilters,
  dhBundles,
  dhBrandById,
  dhChildrenOf,
  dhRootCategories,
  smartSections,
  type DhFilters,
} from '@/modules/dh';

const DetergentHygiene = () => {
  const products = useProducts();
  const brandMap = useBrandMap();
  const offers = useOffers();
  const settings = useStore((s) => s.settings);
  const addToCart = useStore((s) => s.addToCart);
  const compare = useStore((s) => s.compare);
  const clearCompare = useStore((s) => s.clearCompare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const { toast } = useToast();

  const dhEnabled = (settings.modules?.detergent ?? true) || (settings.modules?.hygiene ?? true);
  const [section, setSection] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [useCase, setUseCase] = useState<string | null>(null);
  const [fragrance, setFragrance] = useState<string | null>(null);
  const [sizeIds, setSizeIds] = useState<string[]>([]);
  const [flags, setFlags] = useState({ antibacterial: false, sensitiveSkin: false, childSafe: false, natural: false });
  const [bulkPack, setBulkPack] = useState<string | null>(null);
  const [sort, setSort] = useState('relevance');
  const [compareOpen, setCompareOpen] = useState(false);

  const dhProducts = useMemo(() => products.filter((p) => p.module !== 'food'), [products]);

  /** شناسه محصولات دارای آفر فعال (برای بخش «آفر ویژه») */
  const offeredIds = useMemo(() => {
    const set = new Set<string>();
    dhProducts.forEach((p) => {
      const active = offers.filter(
        (o) =>
          o.isActive &&
          (o.brandIds.length === 0 || o.brandIds.includes(p.brandId)) &&
          (o.categoryIds.length === 0 || o.categoryIds.includes(p.categoryId)) &&
          (o.productIds.length === 0 || o.productIds.includes(p.id)),
      );
      if (active.length) set.add(p.id);
    });
    return set;
  }, [dhProducts, offers]);

  const sections = useMemo(() => smartSections(offeredIds), [offeredIds]);

  const filters: DhFilters = {
    q,
    categoryId: cat ?? undefined,
    useCase,
    fragrance,
    sizeIds,
    ...flags,
    bulkPack,
    sort,
  };

  const filtered = useMemo(() => {
    let list = applyDhFilters(dhProducts, filters);
    if (section) {
      const s = sections.find((x) => x.id === section);
      if (s) list = list.filter(s.match);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dhProducts, q, cat, useCase, fragrance, sizeIds.join(','), JSON.stringify(flags), bulkPack, sort, section, offeredIds]);

  const compareProducts = useMemo(
    () => dhProducts.filter((p) => compare.includes(p.id)).slice(0, 3),
    [dhProducts, compare],
  );

  /** پیشنهاد هوشمند: «فروشگاه‌های مثل شما این ست را خریدند» */
  const smartSuggestion = useMemo(() => {
    const best = dhBundles.find((b) => b.seasonalTag === 'خانه‌تکانی') ?? dhBundles[0];
    return best;
  }, []);

  const addBundle = (bundle: (typeof dhBundles)[number]) => {
    bundle.productIds.forEach((id) => addToCart(id, 1));
    toast(`باندل «${bundle.title}» به سبد اضافه شد`, 'success');
  };

  const toggleSize = (id: string) => setSizeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const clearFilters = () => {
    setQ('');
    setCat(null);
    setUseCase(null);
    setFragrance(null);
    setSizeIds([]);
    setFlags({ antibacterial: false, sensitiveSkin: false, childSafe: false, natural: false });
    setBulkPack(null);
    setSection(null);
    setSort('relevance');
  };

  const activeFilterCount =
    (q ? 1 : 0) + (cat ? 1 : 0) + (useCase ? 1 : 0) + (fragrance ? 1 : 0) + sizeIds.length + Object.values(flags).filter(Boolean).length + (bulkPack ? 1 : 0) + (section ? 1 : 0);

  if (!dhEnabled) {
    return (
      <EmptyState
        icon="spray"
        title="ماژول شوینده و بهداشتی غیرفعال است"
        description="این ماژول از پنل ادمین → ماژول شوینده و بهداشتی → تنظیمات ماژول قابل فعال‌سازی است."
        action={
          <Link to="/admin/dh" className="btn-primary btn-sm">
            <Icon name="settings" className="h-4 w-4" />
            پنل ادمین ماژول
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <DhModuleBanner
        title="شوینده و بهداشتی عمده — از پودر لباسشویی تا مراقبت پوست"
        subtitle="بیش از ۵۰ برند ایرانی و خارجی، پله قیمتی بر اساس تعداد کارتن، قیمت هر لیتر/کیلو، آفرهای فصلی خانه‌تکانی و نوروز، باندل‌های پیشنهادی و مقایسه فنی محصولات."
      />

      {/* ───────── دسته‌بندی هوشمند */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSection(null)}
          className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${!section ? 'bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900' : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
        >
          همه محصولات
        </button>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(section === s.id ? null : s.id)}
            className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${section === s.id ? 'bg-brand-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
          >
            {s.label}
            <span className="mr-1 text-[10px] opacity-70">{s.hint}</span>
          </button>
        ))}
      </div>

      {/* ───────── نوار آفرهای فصلی */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {offers
          .filter((o) => o.isActive && o.kind === 'seasonal')
          .slice(0, 4)
          .map((o) => (
            <Card key={o.id} className="flex items-center gap-3 p-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white" style={{ background: o.color }}>
                <Icon name={o.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-extrabold text-ink-800 dark:text-ink-100">{o.title}</p>
                <p className="text-[10px] text-ink-400">
                  کد <span className="num font-bold">{o.code}</span> — {faNum(o.percent)}٪ تخفیف
                </p>
              </div>
            </Card>
          ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* ───────── پنل فیلترهای تخصصی */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                <Icon name="filter" className="h-4 w-4 text-brand-500" />
                فیلترهای تخصصی
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[11px] font-bold text-rose-500 hover:underline">
                  پاک‌کردن ({faNum(activeFilterCount)})
                </button>
              )}
            </div>

            <div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جست‌وجو در شوینده و بهداشتی…"
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-900"
              />
            </div>

            <div>
              <p className="label">نوع کاربرد</p>
              <div className="flex flex-wrap gap-1.5">
                {USE_CASES.map((u) => (
                  <button
                    key={u}
                    onClick={() => setUseCase(useCase === u ? null : u)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${useCase === u ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">رایحه</p>
              <div className="flex flex-wrap gap-1.5">
                {FRAGRANCES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFragrance(fragrance === f ? null : f)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${fragrance === f ? 'bg-pink-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    🌸 {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">حجم و وزن</p>
              <div className="space-y-1.5">
                {SIZE_BUCKETS.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-600 dark:text-ink-300">
                    <input type="checkbox" checked={sizeIds.includes(s.id)} onChange={() => toggleSize(s.id)} className="h-3.5 w-3.5 accent-sky-600" />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-0.5 border-t border-ink-100 pt-3 dark:border-ink-800">
              <Switch checked={flags.antibacterial} onChange={(v) => setFlags((f) => ({ ...f, antibacterial: v }))} label="💧 ضدباکتری / ضدعفونی‌کننده" />
              <Switch checked={flags.sensitiveSkin} onChange={(v) => setFlags((f) => ({ ...f, sensitiveSkin: v }))} label="مناسب پوست حساس" />
              <Switch checked={flags.childSafe} onChange={(v) => setFlags((f) => ({ ...f, childSafe: v }))} label="👶 ایمن برای کودک" />
              <Switch checked={flags.natural} onChange={(v) => setFlags((f) => ({ ...f, natural: v }))} label="🌿 طبیعی / گیاهی" />
            </div>

            <div>
              <p className="label">بسته‌بندی عمده</p>
              <div className="flex flex-wrap gap-1.5">
                {BULK_PACKS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBulkPack(bulkPack === b ? null : b)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${bulkPack === b ? 'bg-teal-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* ───────── پیشنهاد هوشمند */}
          {smartSuggestion && (
            <Card className="border-brand-200 bg-gradient-to-b from-brand-50 to-white p-4 dark:border-brand-800 dark:from-brand-900/30 dark:to-ink-900">
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="h-5 w-5 text-brand-600" />
                <h3 className="text-[12px] font-extrabold text-ink-800 dark:text-ink-100">فروشگاه‌های مثل شما این ست را خریدند</h3>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                بر اساس تحلیل سبد خرید فروشگاه‌های مشابه شما، «{smartSuggestion.title}» پرتکرارترین سبد ترکیبی این فصل بوده است.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {smartSuggestion.productIds.slice(0, 4).map((id) => {
                  const p = dhProducts.find((x) => x.id === id);
                  return p ? (
                    <Badge key={id} tone="brand">
                      {p.name.split(' ').slice(0, 3).join(' ')}
                    </Badge>
                  ) : null;
                })}
              </div>
              <button onClick={() => addBundle(smartSuggestion)} className="btn-primary btn-sm mt-3 w-full">
                <Icon name="cart" className="h-4 w-4" />
                افزودن این ست به سبد
              </button>
            </Card>
          )}
        </aside>

        {/* ───────── نتایج */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-ink-500">
              <Icon name="package" className="ml-1 inline h-4 w-4" />
              {faNum(filtered.length)} کالا
              {cat && (
                <Badge tone="brand" className="mr-2">
                  {dhRootCategories.find((c) => c.id === cat)?.name ?? cat}
                </Badge>
              )}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[11px] dark:border-ink-700 dark:bg-ink-900"
            >
              <option value="relevance">مرتبط‌ترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="per-unit">بهترین قیمت هر واحد</option>
              <option value="sold">پرفروش‌ترین</option>
              <option value="new">جدیدترین</option>
            </select>
          </div>

          {/* دسته‌های سه‌شاخه‌ای */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {dhRootCategories.map((root) => (
              <button
                key={root.id}
                onClick={() => setCat(cat === root.id ? null : root.id)}
                className={`rounded-xl2 border p-3 text-right transition ${cat === root.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-ink-200 bg-white hover:border-brand-300 dark:border-ink-700 dark:bg-ink-900'}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: root.color }}>
                  <Icon name={root.icon} className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[11px] font-extrabold text-ink-800 dark:text-ink-100">{root.name}</p>
                <p className="text-[9px] text-ink-400">{faNum(dhChildrenOf(root.id).length)} زیردسته</p>
              </button>
            ))}
            {cat &&
              dhChildrenOf(cat).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`rounded-xl2 border p-2.5 text-right text-[10px] font-semibold transition ${cat === c.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30' : 'border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
                >
                  {c.name}
                </button>
              ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="search" title="کالایی با این فیلترها پیدا نشد" description="فیلترها را تغییر دهید یا پاک کنید." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, 24).map((p) => (
                <ProductCard key={p.id} product={p} brand={brandMap.get(p.brandId)} />
              ))}
            </div>
          )}

          {filtered.length > 24 && (
            <p className="text-center text-[11px] text-ink-400">
              نمایش ۲۴ مورد از {faNum(filtered.length)} کالا — برای مشاهده همه، فیلترها را دقیق‌تر کنید یا به{' '}
              <Link to="/catalog" className="font-bold text-brand-600 hover:underline">
                کاتالوگ کامل
              </Link>{' '}
              بروید.
            </p>
          )}
        </div>
      </div>

      {/* ───────── باندل‌های پیشنهادی */}
      <section>
        <SectionTitle
          title="باندل‌های پیشنهادی"
          subtitle="ست‌های ترکیبی شوینده + بهداشتی با تخفیف باندل — مثل «پک خانه‌تکانی»"
          icon="gift"
          action={
            <Badge tone="vip" icon="sparkles">
              پیشنهاد هوشمند سبد خرید
            </Badge>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dhBundles.slice(0, 6).map((b) => (
            <BundleCard key={b.id} bundle={b} onAdd={addBundle} />
          ))}
        </div>
      </section>

      {/* ───────── مقایسه فنی محصولات */}
      <section>
        <SectionTitle
          title="مقایسه فنی محصولات"
          subtitle="قدرت پاک‌کنندگی، غلظت، قیمت هر لیتر/کیلو — کنار هم"
          icon="sliders"
          action={
            compareProducts.length >= 2 ? (
              <button onClick={() => setCompareOpen((v) => !v)} className="btn-primary btn-sm">
                <Icon name="sliders" className="h-4 w-4" />
                {compareOpen ? 'بستن مقایسه' : 'نمایش مقایسه'}
              </button>
            ) : (
              <Badge tone="neutral">حداقل ۲ محصول را با دکمه «مقایسه» انتخاب کنید</Badge>
            )
          }
        />
        {compareOpen && compareProducts.length >= 2 && (
          <div className="space-y-2">
            <CompareSpecs products={compareProducts} />
            <div className="flex justify-end">
              <button onClick={() => { clearCompare(); setCompareOpen(false); }} className="btn-ghost btn-sm">
                <Icon name="trash" className="h-4 w-4" />
                پاک‌کردن مقایسه
              </button>
            </div>
          </div>
        )}
        {compareProducts.length > 0 && compareProducts.length < 2 && (
          <Card className="p-4 text-[12px] text-ink-500">
            <Icon name="info" className="ml-1 inline h-4 w-4" />
            {faNum(compareProducts.length)} محصول انتخاب شده — برای مقایسه کنار هم، یک محصول دیگر هم اضافه کنید.
            {compareProducts[0] && (
              <span className="mr-2">
                انتخاب فعلی: <span className="font-bold">{compareProducts[0].name}</span>
              </span>
            )}
          </Card>
        )}
      </section>

      {/* ───────── راهنمای قیمت شفاف */}
      <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-l from-sky-50 to-emerald-50 p-4 dark:from-sky-900/20 dark:to-emerald-900/20">
        <Icon name="info" className="h-6 w-6 text-sky-600" />
        <div className="flex-1 text-[11px] leading-relaxed text-ink-600 dark:text-ink-300">
          <span className="font-extrabold text-ink-800 dark:text-ink-100">قیمت‌گذاری شفاف:</span> قیمت هر لیتر و هر کیلو در صفحه هر محصول نمایش داده می‌شود. با افزایش تعداد کارتن،
          پله حجمی اعمال می‌شود: «۴ کارتن دیگر اضافه کن → ۵٪ ارزان‌تر و ارسال رایگان». تسویه نقدی هم تخفیف جداگانه دارد.
        </div>
        <Link to="/offers" className="btn-ghost btn-sm">
          <Icon name="tag" className="h-4 w-4" />
          همه آفرها
        </Link>
      </Card>
    </div>
  );
};

export default DetergentHygiene;
