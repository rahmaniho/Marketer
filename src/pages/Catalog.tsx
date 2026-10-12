import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge, Card, EmptyState, Field, Pagination, Switch, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { useBrands, useOffers, useProducts, useStore } from '@/store/useStore';
import { categoryById, childrenOf, rootCategories } from '@/data/categories';
import { faNum, percentFa, tomanShort } from '@/lib/format';
import { searchProducts } from '@/lib/search';
import { offerById } from '@/data/offers';

const SORTS = [
  { id: 'relevance', label: 'مرتبط‌ترین' },
  { id: 'price-asc', label: 'ارزان‌ترین' },
  { id: 'price-desc', label: 'گران‌ترین' },
  { id: 'sold', label: 'پرفروش‌ترین' },
  { id: 'new', label: 'جدیدترین' },
  { id: 'discount', label: 'بیشترین تخفیف' },
];

const Catalog = () => {
  const [params, setParams] = useSearchParams();
  const products = useProducts();
  const brands = useBrands();
  const offers = useOffers();
  const addSearch = useStore((s) => s.addSearch);
  const recentSearches = useStore((s) => s.recentSearches);
  const { toast } = useToast();

  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER = 12;

  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? 'all';
  const brandIds = (params.get('brand') ?? '').split(',').filter(Boolean);
  const origin = params.get('origin') ?? 'all';
  const maxPrice = Number(params.get('max') ?? 0);
  const minPrice = Number(params.get('min') ?? 0);
  const sort = params.get('sort') ?? 'relevance';
  const onlyOffer = params.get('offer') === '1' ? offerById(params.get('offerId') ?? '') : undefined;
  const onlyOffers = params.get('offers') === '1';
  const onlyStock = params.get('stock') === '1';
  const onlyDiscount = params.get('discount') === '1';
  const activeOfferId = params.get('offer');

  useEffect(() => {
    if (q.trim()) addSearch(q.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
    setPage(1);
  };

  const toggleMulti = (key: string, value: string) => {
    const current = (params.get(key) ?? '').split(',').filter(Boolean);
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    setParam(key, next.join(',') || null);
  };

  const filtered = useMemo(() => {
    let list = q.trim() ? searchProducts(products, brands, q).map((h) => h.product) : products;

    if (cat !== 'all') {
      const childIds = childrenOf(cat).map((c) => c.id);
      list = list.filter((p) => p.categoryId === cat || childIds.includes(p.categoryId));
    }
    if (brandIds.length) list = list.filter((p) => brandIds.includes(p.brandId));
    if (origin !== 'all') list = list.filter((p) => p.country === origin || (origin === 'iran' ? p.country === 'ایران' : p.country !== 'ایران'));
    if (minPrice) list = list.filter((p) => p.basePrice >= minPrice);
    if (maxPrice) list = list.filter((p) => p.basePrice <= maxPrice);
    if (onlyStock) list = list.filter((p) => p.stock > 0);
    if (onlyDiscount) list = list.filter((p) => p.cashDiscountPercent > 0 || p.tiers.some((t) => t.discountPercent > 0));
    if (onlyOffers) {
      const active = offers.filter((o) => o.isActive);
      list = list.filter((p) =>
        active.some(
          (o) =>
            (o.brandIds.length === 0 || o.brandIds.includes(p.brandId)) &&
            (o.categoryIds.length === 0 || o.categoryIds.includes(p.categoryId)) &&
            (o.productIds.length === 0 || o.productIds.includes(p.id)),
        ),
      );
    }
    if (onlyOffer) list = list.filter((p) => onlyOffer.productIds.length === 0 || onlyOffer.productIds.includes(p.id));

    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        list = [...list].sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'sold':
        list = [...list].sort((a, b) => b.soldCount - a.soldCount);
        break;
      case 'new':
        list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case 'discount':
        list = [...list].sort((a, b) => b.cashDiscountPercent - a.cashDiscountPercent);
        break;
      default:
        list = [...list].sort((a, b) => b.soldCount / 1000 + b.rating - (a.soldCount / 1000 + a.rating));
    }
    return list;
  }, [q, products, brands, cat, brandIds.join(','), origin, minPrice, maxPrice, sort, onlyOffers, onlyOffer, onlyStock, onlyDiscount]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);
  const activeFilterCount =
    (cat !== 'all' ? 1 : 0) + brandIds.length + (origin !== 'all' ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + (onlyStock ? 1 : 0) + (onlyDiscount ? 1 : 0) + (onlyOffers ? 1 : 0) + (activeOfferId ? 1 : 0);

  const priceBuckets = [
    { label: 'تا ۱ میلیون تومان', min: 0, max: 1_000_000 },
    { label: '۱ تا ۳ میلیون تومان', min: 1_000_000, max: 3_000_000 },
    { label: '۳ تا ۶ میلیون تومان', min: 3_000_000, max: 6_000_000 },
    { label: 'بیش از ۶ میلیون تومان', min: 6_000_000, max: 0 },
  ];

  const FiltersPanel = () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[12px] font-extrabold">دسته‌بندی</p>
        <div className="space-y-1">
          <button
            onClick={() => setParam('cat', null)}
            className={`w-full rounded-lg px-2.5 py-1.5 text-right text-[11.5px] transition ${cat === 'all' ? 'bg-brand-50 font-bold text-brand-800 dark:bg-brand-900/30 dark:text-brand-200' : 'hover:bg-ink-50 dark:hover:bg-ink-800'}`}
          >
            همه دسته‌ها <span className="num text-ink-400">({faNum(products.length)})</span>
          </button>
          {rootCategories.map((r) => (
            <div key={r.id}>
              <button
                onClick={() => setParam('cat', r.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-right text-[11.5px] transition ${cat === r.id ? 'bg-brand-50 font-bold text-brand-800 dark:bg-brand-900/30 dark:text-brand-200' : 'hover:bg-ink-50 dark:hover:bg-ink-800'}`}
              >
                <Icon name={r.icon} className="h-3.5 w-3.5" />
                {r.name}
                <span className="num mr-auto text-ink-400">
                  ({faNum(products.filter((p) => p.categoryId === r.id || childrenOf(r.id).some((c) => c.id === p.categoryId)).length)})
                </span>
              </button>
              {cat === r.id &&
                childrenOf(r.id).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setParam('cat', c.id)}
                    className="block w-full rounded-lg px-6 py-1 text-right text-[11px] text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-ink-800"
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-extrabold">برند (چندانتخابی)</p>
        <div className="max-h-52 space-y-1 overflow-y-auto pl-1">
          {brands.slice(0, 60).map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[11.5px] hover:bg-ink-50 dark:hover:bg-ink-800">
              <input
                type="checkbox"
                checked={brandIds.includes(b.id)}
                onChange={() => toggleMulti('brand', b.id)}
                className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600"
              />
              <span className="truncate">{b.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-extrabold">محدوده قیمت هر واحد</p>
        <div className="space-y-1">
          {priceBuckets.map((b) => {
            const active = minPrice === b.min && maxPrice === b.max;
            return (
              <button
                key={b.label}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  if (active) {
                    next.delete('min');
                    next.delete('max');
                  } else {
                    next.set('min', String(b.min));
                    next.set('max', String(b.max));
                  }
                  next.delete('page');
                  setParams(next);
                  setPage(1);
                }}
                className={`w-full rounded-lg px-2.5 py-1.5 text-right text-[11.5px] transition ${active ? 'bg-brand-50 font-bold text-brand-800 dark:bg-brand-900/30 dark:text-brand-200' : 'hover:bg-ink-50 dark:hover:bg-ink-800'}`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-extrabold">فیلترهای سریع</p>
        <Switch checked={onlyStock} onChange={(v) => setParam('stock', v ? '1' : null)} label="فقط کالاهای موجود" />
        <Switch checked={onlyDiscount} onChange={(v) => setParam('discount', v ? '1' : null)} label="فقط کالاهای تخفیف‌دار" />
        <Switch checked={onlyOffers} onChange={(v) => setParam('offers', v ? '1' : null)} label="کالاهای دارای کمپین فعال" />
      </div>

      <div>
        <Field label="جست‌وجوی سریع در نتایج">
          <input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="نام کالا، برند یا بارکد…" className="input py-2 text-[12px]" />
        </Field>
      </div>

      {activeFilterCount > 0 && (
        <button
          className="btn-ghost btn-sm w-full"
          onClick={() => {
            setParams(new URLSearchParams());
            setPage(1);
            toast('همه فیلترها پاک شد');
          }}
        >
          <Icon name="refresh" className="h-3.5 w-3.5" />
          پاک‌کردن همه فیلترها ({faNum(activeFilterCount)})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold">کاتالوگ کالاهای عمده</h1>
          <p className="num mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
            {faNum(filtered.length)} کالا از {faNum(products.length)} کد کالای فعال
            {q && ` — نتایج جست‌وجوی «${q}»`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="select w-auto py-2 text-[12px]">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex rounded-xl border border-ink-200 p-0.5 dark:border-ink-700">
            <button className={`btn-icon ${view === 'grid' ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40' : ''}`} onClick={() => setView('grid')} aria-label="نمایش شبکه‌ای">
              <Icon name="grid" className="h-4 w-4" />
            </button>
            <button className={`btn-icon ${view === 'list' ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40' : ''}`} onClick={() => setView('list')} aria-label="نمایش فهرستی">
              <Icon name="list" className="h-4 w-4" />
            </button>
          </div>
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setFiltersOpen(!filtersOpen)}>
            <Icon name="filter" className="h-4 w-4" />
            فیلترها {activeFilterCount > 0 && <span className="num">({faNum(activeFilterCount)})</span>}
          </button>
        </div>
      </div>

      {recentSearches.length > 0 && !q && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-ink-400">جست‌وجوهای اخیر شما:</span>
          {recentSearches.slice(0, 6).map((s) => (
            <button key={s} onClick={() => setParam('q', s)} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
              {s}
            </button>
          ))}
        </div>
      )}

      {onlyOffer && (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl2 text-white" style={{ background: onlyOffer.color }}>
                <Icon name={onlyOffer.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">کمپین فعال: {onlyOffer.title}</p>
                <p className="num text-[11px] text-ink-500 dark:text-ink-400">
                  کد {onlyOffer.code} • {percentFa(onlyOffer.percent)} تخفیف {onlyOffer.minCartAmount > 0 ? `• حداقل سبد ${tomanShort(onlyOffer.minCartAmount)}` : ''}
                </p>
              </div>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setParam('offer', null)}>
              حذف فیلتر کمپین
            </button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <Card className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] font-extrabold">فیلترها</p>
              <button className="btn-icon lg:hidden" onClick={() => setFiltersOpen(false)} aria-label="بستن">
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <FiltersPanel />
          </Card>
        </aside>

        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {cat !== 'all' && (
              <button onClick={() => setParam('cat', null)} className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                دسته: {categoryById(cat)?.name}
                <Icon name="x" className="h-3 w-3" />
              </button>
            )}
            {brandIds.slice(0, 3).map((id) => (
              <button key={id} onClick={() => toggleMulti('brand', id)} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {brands.find((b) => b.id === id)?.name}
                <Icon name="x" className="h-3 w-3" />
              </button>
            ))}
            {brandIds.length > 3 && <span className="num chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">+{faNum(brandIds.length - 3)} برند</span>}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title="کالایی با این مشخصات یافت نشد"
              description="فیلترها را تغییر دهید یا عبارت دیگری جست‌وجو کنید. می‌توانید درخواست استعلام قیمت ثبت کنید."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="btn-soft" onClick={() => setParams(new URLSearchParams())}>
                    پاک‌کردن فیلترها
                  </button>
                  <Link to="/rfq" className="btn-primary">
                    ثبت استعلام قیمت
                  </Link>
                </div>
              }
            />
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="card flex flex-wrap items-center gap-3 p-3 transition hover:shadow-pop">
                  <span className="flex h-14 w-14 flex-none items-center justify-center rounded-xl2" style={{ background: `${categoryById(p.categoryId)?.color ?? '#0f684c'}18` }}>
                    <Icon name={categoryById(p.categoryId)?.icon ?? 'package'} className="h-6 w-6" />
                  </span>
                  <span className="min-w-[180px] flex-1">
                    <span className="block text-[12.5px] font-bold">{p.name}</span>
                    <span className="num block text-[11px] text-ink-400">
                      {p.packDesc} • بارکد {p.barcode} • {p.country}
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    {p.badges.slice(0, 2).map((b) => (
                      <Badge key={b} tone={b === 'imported' ? 'info' : b === 'bestseller' ? 'accent' : 'neutral'}>
                        {b === 'imported' ? 'وارداتی' : b === 'bestseller' ? 'پرفروش' : b === 'new' ? 'جدید' : b === 'halal' ? 'حلال' : b}
                      </Badge>
                    ))}
                  </span>
                  <span className="num w-28 flex-none text-right text-[13px] font-extrabold text-brand-700 dark:text-brand-300">
                    {tomanShort(p.basePrice)}
                    <span className="block text-[10px] font-normal text-ink-400">هر {p.unit}</span>
                  </span>
                  <Icon name="chevron-left" className="h-4 w-4 flex-none text-ink-300" />
                </Link>
              ))}
            </div>
          )}

          <Pagination page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        </div>
      </div>

      <Card className="mt-6 bg-ink-50/70 dark:bg-ink-800/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            کالای موردنظر خود را پیدا نکردید؟ استعلام قیمت (RFQ) ثبت کنید تا کارشناس فروش، پیشنهاد اختصاصی ارسال کند.
            <span className="num mr-2 text-ink-400">میانگین زمان پاسخ: ۴ ساعت کاری</span>
          </p>
          <Link to="/rfq" className="btn-primary btn-sm">
            <Icon name="clipboard" className="h-4 w-4" />
            ثبت استعلام قیمت
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Catalog;
