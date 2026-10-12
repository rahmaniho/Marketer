import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, CopyButton, EmptyState, SectionTitle, Stat, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { useBrands, useOffers, useProducts, useStore } from '@/store/useStore';
import { offerKindLabel } from '@/data/offers';
import { categoryById } from '@/data/categories';
import { addDays, daysUntil, faNum, jalaliDate, percentFa, toman, tomanShort } from '@/lib/format';

const Offers = () => {
  const offers = useOffers();
  const products = useProducts();
  const brands = useBrands();
  const customer = useStore((s) => s.customer);
  const addToCart = useStore((s) => s.addToCart);
  const { toast } = useToast();
  const [tab, setTab] = useState('all');

  const active = offers.filter((o) => o.isActive && daysUntil(o.endsAt) > 0);
  const filtered = useMemo(() => {
    if (tab === 'all') return active;
    if (tab === 'vip') return active.filter((o) => o.vipOnly);
    if (tab === 'first') return active.filter((o) => o.firstOrderOnly);
    if (tab === 'expiring') return active.filter((o) => daysUntil(o.endsAt) < 7);
    return active.filter((o) => o.kind === tab);
  }, [active, tab]);

  const offerProducts = (offerId: string) => {
    const o = offers.find((x) => x.id === offerId);
    if (!o) return [];
    return products
      .filter(
        (p) =>
          (o.productIds.length === 0 || o.productIds.includes(p.id)) &&
          (o.brandIds.length === 0 || o.brandIds.includes(p.brandId)) &&
          (o.categoryIds.length === 0 || o.categoryIds.includes(p.categoryId)),
      )
      .slice(0, 5);
  };

  const biggest = active.length ? active.reduce((a, b) => (a.percent >= b.percent ? a : b)) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold">آفرها و کمپین‌های عمده</h1>
        <p className="mt-1 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
          کمپین‌های فروشگاهی، پالتی، فصلی و باشگاه مشتریان. تخفیف کمپین‌ها روی نرخ‌نامه پله‌ای اعمال می‌شود و سقف
          مجموع تخفیف هر سبد ۳۵٪ است.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کمپین‌های فعال" value={faNum(active.length)} icon="tag" />
        <Stat label="بیشترین تخفیف کمپین" value={biggest ? percentFa(biggest.percent) : '—'} icon="discount" tone="accent" />
        <Stat label="کمپین‌های VIP" value={faNum(active.filter((o) => o.vipOnly).length)} icon="crown" tone="vip" />
        <Stat label="کمپین‌های رو به پایان" value={faNum(active.filter((o) => daysUntil(o.endsAt) < 7).length)} icon="clock" tone="danger" hint="کمتر از ۷ روز" />
      </div>

      <div className="mt-4">
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'همه کمپین‌ها', count: active.length },
            { id: 'vip', label: 'باشگاه VIP', count: active.filter((o) => o.vipOnly).length },
            { id: 'first', label: 'اولین سفارش' },
            { id: 'expiring', label: 'رو به پایان' },
            { id: 'volume', label: 'حجمی و پالتی' },
            { id: 'seasonal', label: 'فصلی' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon="tag" title="کمپین فعالی در این دسته وجود ندارد" description="دسته دیگری را انتخاب کنید." />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((o) => {
            const list = offerProducts(o.id);
            const remaining = daysUntil(o.endsAt);
            return (
              <Card key={o.id} className="overflow-hidden p-0" hover>
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-white" style={{ background: `linear-gradient(120deg, ${o.color}, ${o.color}bb)` }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl2 bg-white/20">
                      <Icon name={o.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[11px] opacity-90">{offerKindLabel[o.kind]}</p>
                      <p className="text-[15px] font-extrabold">{o.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="num rounded-xl bg-white/20 px-3 py-1.5 text-[13px] font-extrabold">{percentFa(o.percent)} تخفیف</span>
                    {o.vipOnly && <Badge className="bg-white/20 text-white">فقط VIP</Badge>}
                    {o.firstOrderOnly && <Badge className="bg-white/20 text-white">اولین سفارش</Badge>}
                    <span className="num text-[11px] opacity-90">
                      {remaining > 0 ? `${faNum(remaining)} روز تا پایان` : 'پایان‌یافته'}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="text-[12px] leading-7 text-ink-600 dark:text-ink-300">{o.description}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[
                        ['حداقل مبلغ سبد', o.minCartAmount > 0 ? `${toman(o.minCartAmount, false)} تومان` : 'بدون محدودیت'],
                        ['حداقل تعداد اقلام', o.minQty > 0 ? `${faNum(o.minQty)} واحد` : 'بدون محدودیت'],
                        ['بازه اعتبار', `${jalaliDate(o.startsAt)} تا ${jalaliDate(o.endsAt)}`],
                        ['سقف استفاده', `${faNum(o.usedCount)} از ${faNum(o.maxUsage)} بار`],
                        ['حوزه اعمال', o.brandIds.length ? `${faNum(o.brandIds.length)} برند` : o.categoryIds.length ? `${faNum(o.categoryIds.length)} دسته` : o.productIds.length ? `${faNum(o.productIds.length)} کالا` : 'کل کاتالوگ'],
                        ['شرط مشتری', o.vipOnly ? 'سطح VIP' : o.firstOrderOnly ? 'اولین سفارش' : 'همه مشتریان'],
                      ].map(([l, v]) => (
                        <div key={l} className="rounded-xl border border-ink-200 px-3 py-2 text-[11px] dark:border-ink-700">
                          <p className="text-ink-500 dark:text-ink-400">{l}</p>
                          <p className="num mt-0.5 font-bold">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="num chip bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200">کد کمپین: {o.code}</span>
                      <CopyButton text={o.code} label="کپی کد" />
                      <Link to={`/catalog?offer=${o.id}`} className="btn-soft btn-sm">
                        <Icon name="filter" className="h-3.5 w-3.5" />
                        کالاهای این کمپین
                      </Link>
                    </div>
                    {o.brandIds.length > 0 && (
                      <p className="mt-3 text-[11px] text-ink-500 dark:text-ink-400">
                        برندهای مشمول: {o.brandIds.map((id) => brands.find((b) => b.id === id)?.name).filter(Boolean).slice(0, 6).join(' ، ')}
                      </p>
                    )}
                    {o.categoryIds.length > 0 && (
                      <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                        دسته‌های مشمول: {o.categoryIds.map((id) => categoryById(id)?.name).filter(Boolean).slice(0, 6).join(' ، ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {customer?.tier === 'VIP' || !o.vipOnly ? (
                      <div className="rounded-xl2 border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-800 dark:bg-brand-900/20">
                        <p className="text-[11.5px] font-extrabold text-brand-900 dark:text-brand-100">تخمین صرفه‌جویی شما</p>
                        <p className="num mt-1 text-[11.5px] leading-6 text-brand-800 dark:text-brand-200">
                          با سبد {o.minCartAmount ? tomanShort(o.minCartAmount) : 'میانگین'} تومانی، حدود{' '}
                          <span className="font-extrabold">{tomanShort(Math.round((o.minCartAmount || 10_000_000) * (o.percent / 100)))}</span> تومان
                          صرفه‌جویی می‌کنید.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl2 border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                        <p className="text-[11.5px] font-extrabold text-amber-900 dark:text-amber-100">این کمپین مخصوص مشتریان VIP است</p>
                        <p className="mt-1 text-[11px] leading-6 text-amber-800 dark:text-amber-200">
                          با رسیدن به خرید ماهانه تعیین‌شده، سطح حساب شما به VIP ارتقا می‌یابد.
                        </p>
                        <Link to="/loyalty" className="btn-soft btn-sm mt-2">
                          مشاهده شرایط باشگاه مشتریان
                        </Link>
                      </div>
                    )}

                    {list.map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                        <div className="min-w-0 flex-1">
                          <Link to={`/product/${p.id}`} className="line-clamp-1 text-[11.5px] font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                            {p.name}
                          </Link>
                          <p className="num text-[10.5px] text-ink-400">
                            {toman(p.basePrice, false)} تومان هر {p.unit}
                          </p>
                        </div>
                        <button
                          className="btn-soft btn-sm flex-none"
                          onClick={() => {
                            addToCart(p.id, p.moq);
                            toast(`«${p.name}» با کمپین ${o.code} به سبد افزوده شد`);
                          }}
                        >
                          <Icon name="plus" className="h-3.5 w-3.5" />
                          سبد
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle title="کالاهای دارای کمپین فعال" subtitle="سریع‌ترین راه رسیدن به تخفیف" icon="discount" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products
          .filter((p) => active.some((o) => (o.brandIds.length === 0 || o.brandIds.includes(p.brandId)) && (o.categoryIds.length === 0 || o.categoryIds.includes(p.categoryId))))
          .slice(0, 10)
          .map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
      </div>

      <Card className="mt-6 bg-ink-50/70 dark:bg-ink-800/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            برای سفارش‌های بالای ۵۰ کارتن یا کمپین اختصاصی برای مجموعه شما، امکان طراحی پیشنهاد قیمت ویژه وجود دارد.
            <span className="num mr-2 text-ink-400">میانگین زمان پاسخ: ۴ ساعت کاری</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/rfq" className="btn-primary btn-sm">
              <Icon name="clipboard" className="h-4 w-4" />
              ثبت استعلام قیمت
            </Link>
            <Link to={`/catalog?offers=1&sort=discount`} className="btn-ghost btn-sm">
              همه کالاهای تخفیف‌دار
            </Link>
          </div>
        </div>
      </Card>

      <p className="num mt-4 text-center text-[10.5px] text-ink-400">
        کمپین‌های این صفحه نمایشی هستند و تاریخ‌های اعتبار نسبت به امروز ({jalaliDate(addDays(new Date(), 0))}) محاسبه شده‌اند.
      </p>
    </div>
  );
};

export default Offers;
