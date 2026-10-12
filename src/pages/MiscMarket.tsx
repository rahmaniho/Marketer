/**
 * ماژول «سایر کالاهای مصرفی سوپرمارکتی» — پنل مشتری
 * هشت شاخه: لوازم‌التحریر، باتری و فندک، لوازم جانبی موبایل، لوازم برقی کوچک،
 * ظروف آشپزخانه، حیوانات خانگی، محصولات فصلی، ملزومات خانه
 * — فیلترهای تخصصی، باندل‌های پیشنهادی، پیشنهاد هوشمند و مقایسه فنی
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
  AGE_GROUPS,
  ANIMAL_TYPES,
  BundleCard,
  CompareSpecs,
  MATERIALS,
  MiscModuleBanner,
  SEASONS,
  applyMiscFilters,
  msBundles,
  msChildrenOf,
  msRootCategories,
  smartSections,
  type MiscFilters,
} from '@/modules/misc';

const MiscMarket = () => {
  const products = useProducts();
  const brandMap = useBrandMap();
  const offers = useOffers();
  const settings = useStore((s) => s.settings);
  const addToCart = useStore((s) => s.addToCart);
  const compare = useStore((s) => s.compare);
  const clearCompare = useStore((s) => s.clearCompare);
  const { toast } = useToast();

  const miscEnabled = settings.modules?.misc ?? true;
  const [section, setSection] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [materialId, setMaterialId] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [animalType, setAnimalType] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<string | null>(null);
  const [isSeasonal, setIsSeasonal] = useState(false);
  const [seasonName, setSeasonName] = useState<string | null>(null);
  const [sort, setSort] = useState('relevance');
  const [compareOpen, setCompareOpen] = useState(false);

  const msProductsAll = useMemo(() => products.filter((p) => p.module === 'misc'), [products]);

  /** شناسه محصولات دارای آفر فعال (برای بخش «آفر ویژه») */
  const offeredIds = useMemo(() => {
    const set = new Set<string>();
    msProductsAll.forEach((p) => {
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
  }, [msProductsAll, offers]);

  const sections = useMemo(() => smartSections(offeredIds), [offeredIds]);

  const filters: MiscFilters = {
    q,
    categoryId: cat ?? undefined,
    brandIds,
    materialId,
    ageGroup,
    animalType,
    compatibility,
    isSeasonal,
    seasonName,
    sort,
  };

  const filtered = useMemo(() => {
    let list = applyMiscFilters(msProductsAll, filters);
    if (section) {
      const s = sections.find((x) => x.id === section);
      if (s) list = list.filter(s.match);
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msProductsAll, q, cat, brandIds.join(','), materialId, ageGroup, animalType, compatibility, isSeasonal, seasonName, sort, section, offeredIds]);

  const compareProducts = useMemo(
    () => msProductsAll.filter((p) => compare.includes(p.id)).slice(0, 3),
    [msProductsAll, compare],
  );

  /** برندهای دسته انتخاب‌شده (برای فیلتر برند) */
  const brandOptions = useMemo(() => {
    const ids = new Set(msProductsAll.filter((p) => !cat || p.categoryId === cat || msChildrenOf(cat).some((c) => c.id === p.categoryId)).map((p) => p.brandId));
    return [...ids].map((id) => brandMap.get(id)).filter(Boolean).slice(0, 18) as { id: string; name: string }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msProductsAll, cat, brandMap]);

  /** پیشنهاد هوشمند: «فروشگاه‌هایی مثل شما این ست را خریدند» */
  const smartSuggestion = useMemo(() => msBundles.find((b) => b.seasonalTag === 'بازگشایی مدارس') ?? msBundles[0], []);

  const addBundle = (bundle: (typeof msBundles)[number]) => {
    bundle.productIds.forEach((id) => addToCart(id, 1));
    toast(`باندل «${bundle.title}» به سبد اضافه شد`, 'success');
  };

  const toggleBrand = (id: string) =>
    setBrandIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const clearFilters = () => {
    setQ('');
    setCat(null);
    setBrandIds([]);
    setMaterialId(null);
    setAgeGroup(null);
    setAnimalType(null);
    setCompatibility(null);
    setIsSeasonal(false);
    setSeasonName(null);
    setSection(null);
    setSort('relevance');
  };

  const activeFilterCount =
    (q ? 1 : 0) + (cat ? 1 : 0) + brandIds.length + (materialId ? 1 : 0) + (ageGroup ? 1 : 0) + (animalType ? 1 : 0) + (compatibility ? 1 : 0) + (isSeasonal ? 1 : 0) + (seasonName ? 1 : 0) + (section ? 1 : 0);

  if (!miscEnabled) {
    return (
      <EmptyState
        icon="box"
        title="ماژول کالاهای مصرفی سوپرمارکتی غیرفعال است"
        description="این ماژول از پنل ادمین → ماژول کالاهای مصرفی → تنظیمات ماژول قابل فعال‌سازی است."
        action={
          <Link to="/admin/misc" className="btn-primary btn-sm">
            <Icon name="settings" className="h-4 w-4" />
            پنل ادمین ماژول
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MiscModuleBanner
        title="سایر کالاهای مصرفی سوپرمارکتی — از لوازم‌التحریر تا لوازم خانگی"
        subtitle="بیش از ۱۶۰ برند ایرانی و خارجی در ۸ شاخه کالایی، پله قیمتی بر اساس تعداد کارتن، آفرهای فصلی نوروز و بازگشایی مدارس، باندل‌های پیشنهادی و مقایسه فنی محصولات."
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
            className={`rounded-full px-4 py-2 text-[12px] font-bold transition ${section === s.id ? 'bg-violet-600 text-white' : 'border border-ink-200 bg-white text-ink-600 hover:border-violet-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
          >
            {s.label}
            <span className="mr-1 text-[10px] opacity-70">{s.hint}</span>
          </button>
        ))}
      </div>

      {/* ───────── نوار آفرهای فصلی */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {offers
          .filter((o) => o.isActive && (o.kind === 'seasonal' || o.id.startsWith('mso-')))
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
                <Icon name="filter" className="h-4 w-4 text-violet-500" />
                فیلترهای تخصصی
              </h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[11px] font-bold text-rose-500 hover:underline">
                  پاک‌کردن ({faNum(activeFilterCount)})
                </button>
              )}
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جست‌وجو در کالاهای مصرفی…"
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-violet-400 dark:border-ink-700 dark:bg-ink-900"
            />

            <div>
              <p className="label">برند</p>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {brandOptions.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => toggleBrand(b.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${brandIds.includes(b.id) ? 'bg-violet-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">جنس / متریال</p>
              <div className="flex flex-wrap gap-1.5">
                {MATERIALS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMaterialId(materialId === m.id ? null : m.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${materialId === m.id ? 'bg-teal-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">گروه سنی</p>
              <div className="flex flex-wrap gap-1.5">
                {AGE_GROUPS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setAgeGroup(ageGroup === g ? null : g)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${ageGroup === g ? 'bg-sky-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">نوع حیوان</p>
              <div className="flex flex-wrap gap-1.5">
                {ANIMAL_TYPES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnimalType(animalType === a ? null : a)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${animalType === a ? 'bg-orange-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    🐾 {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label">سازگاری (لوازم جانبی موبایل)</p>
              <div className="flex flex-wrap gap-1.5">
                {['اندروید', 'iOS', 'USB-C', 'Bluetooth', 'شارژر'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCompatibility(compatibility === c ? null : c)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${compatibility === c ? 'bg-cyan-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5 border-t border-ink-100 pt-3 dark:border-ink-800">
              <Switch checked={isSeasonal} onChange={setIsSeasonal} label="🎁 فقط محصولات فصلی" />
              {isSeasonal && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {SEASONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSeasonName(seasonName === s ? null : s)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${seasonName === s ? 'bg-purple-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ───────── پیشنهاد هوشمند */}
          {smartSuggestion && (
            <Card className="border-violet-200 bg-gradient-to-b from-violet-50 to-white p-4 dark:border-violet-800 dark:from-violet-900/30 dark:to-ink-900">
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="h-5 w-5 text-violet-600" />
                <h3 className="text-[12px] font-extrabold text-ink-800 dark:text-ink-100">فروشگاه‌هایی مثل شما این ست را خریدند</h3>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                بر اساس تحلیل سبد خرید فروشگاه‌های مشابه شما، «{smartSuggestion.title}» پرتکرارترین سبد ترکیبی این فصل بوده است.
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {smartSuggestion.productIds.slice(0, 4).map((id) => {
                  const p = msProductsAll.find((x) => x.id === id);
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
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-[11px] dark:border-ink-700 dark:bg-ink-900"
            >
              <option value="relevance">مرتبط‌ترین</option>
              <option value="price-asc">ارزان‌ترین</option>
              <option value="price-desc">گران‌ترین</option>
              <option value="per-unit">بهترین قیمت هر عدد</option>
              <option value="sold">پرفروش‌ترین</option>
              <option value="new">جدیدترین</option>
            </select>
          </div>

          {/* هشت شاخه اصلی */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {msRootCategories.map((root) => (
              <button
                key={root.id}
                onClick={() => setCat(cat === root.id ? null : root.id)}
                className={`rounded-xl2 border p-3 text-right transition ${cat === root.id ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30' : 'border-ink-200 bg-white hover:border-violet-300 dark:border-ink-700 dark:bg-ink-900'}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: root.color }}>
                  <Icon name={root.icon} className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[10.5px] font-extrabold leading-tight text-ink-800 dark:text-ink-100">{root.name}</p>
                <p className="text-[9px] text-ink-400">{faNum(msChildrenOf(root.id).length)} زیردسته</p>
              </button>
            ))}
            {cat &&
              msChildrenOf(cat).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`rounded-xl2 border p-2.5 text-right text-[10px] font-semibold transition ${cat === c.id ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30' : 'border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
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
              <Link to="/catalog" className="font-bold text-violet-600 hover:underline">
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
          subtitle="ست‌های ترکیبی مثل «پک بازگشایی مدارس» (دفتر + خودکار + مداد + پاک‌کن) با تخفیف باندل"
          icon="gift"
          action={
            <Badge tone="vip" icon="sparkles">
              پیشنهاد هوشمند سبد خرید
            </Badge>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {msBundles.slice(0, 6).map((b) => (
            <BundleCard key={b.id} bundle={b} onAdd={addBundle} />
          ))}
        </div>
      </section>

      {/* ───────── مقایسه فنی محصولات */}
      <section>
        <SectionTitle
          title="مقایسه فنی محصولات"
          subtitle="جنس، ابعاد، ظرفیت، توان، سازگاری و قیمت هر عدد — کنار هم"
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
              <button
                onClick={() => {
                  clearCompare();
                  setCompareOpen(false);
                }}
                className="btn-ghost btn-sm"
              >
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
          </Card>
        )}
      </section>

      {/* ───────── راهنمای قیمت شفاف */}
      <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-l from-indigo-50 to-violet-50 p-4 dark:from-indigo-900/20 dark:to-violet-900/20">
        <Icon name="info" className="h-6 w-6 text-violet-600" />
        <div className="flex-1 text-[11px] leading-relaxed text-ink-600 dark:text-ink-300">
          <span className="font-extrabold text-ink-800 dark:text-ink-100">قیمت‌گذاری شفاف:</span> قیمت هر عدد، هر بسته، هر کارتن و هر کیلو در صفحه هر محصول نمایش
          داده می‌شود. با افزایش تعداد کارتن، پله حجمی اعمال می‌شود: «۳ کارتن دیگر اضافه کن → ۴٪ ارزان‌تر». تسویه نقدی هم تخفیف جداگانه دارد.
        </div>
        <Link to="/offers" className="btn-ghost btn-sm">
          <Icon name="tag" className="h-4 w-4" />
          همه آفرها
        </Link>
      </Card>
    </div>
  );
};

export default MiscMarket;
