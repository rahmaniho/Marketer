import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, SectionTitle, Stat, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { BrandMark, KarenSoftLogo } from '@/components/BrandLogo';
import { useBrands, useOffers, useOrders, useProducts, useStore } from '@/store/useStore';
import { categoryById, rootCategories } from '@/data/categories';
import { faNum, percentFa, tomanShort } from '@/lib/format';
import { offerKindLabel } from '@/data/offers';
import { articles } from '@/data/content';

const FEATURES = [
  ['حذف ویزیتور و واسطه', 'سفارش‌گیری مستقیم از کارخانه و پخش با نرخ عمده شفاف.', 'route'],
  ['نرخ‌نامه پله‌ای شفاف', 'با افزایش حجم خرید، قیمت هر کارتن خودکار کاهش می‌یابد.', 'trend'],
  ['اعتبار و خرید چکی', 'سقف اعتبار اختصاصی، چک ۴۵ و ۶۰ روزه و تسویه شفاف.', 'wallet'],
  ['زنجیره سرد و لجستیک', 'خودروی یخچال‌دار، رهگیری محموله و امضای دیجیتال تحویل.', 'truck'],
  ['فاکتور رسمی و مودیان', 'صورتحساب الکترونیکی، فاکتور چاپی و خروجی حسابداری.', 'receipt'],
  ['هوش تجاری و تحلیل ریزش', 'داشبورد BI، تحلیل سبد کالا و پیش‌بینی ریزش مشتری.', 'sparkles'],
];

const Home = () => {
  const products = useProducts();
  const brands = useBrands();
  const offers = useOffers();
  const orders = useOrders();
  const customer = useStore((s) => s.customer);
  const recentlyViewed = useStore((s) => s.recentlyViewed);
  const demoLoginCustomer = useStore((s) => s.demoLoginCustomer);
  const { toast } = useToast();

  const bestsellers = useMemo(() => products.filter((p) => p.badges.includes('bestseller')).slice(0, 10), [products]);
  const newest = useMemo(() => products.filter((p) => p.badges.includes('new')).slice(0, 5), [products]);
  const discounted = useMemo(() => [...products].sort((a, b) => b.cashDiscountPercent - a.cashDiscountPercent).slice(0, 5), [products]);
  const recent = useMemo(
    () => recentlyViewed.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 6),
    [recentlyViewed, products],
  );

  const activeOffers = offers.filter((o) => o.isActive).slice(0, 4);
  const totalSold = products.reduce((s, p) => s + p.soldCount, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* ───────── Hero */}
      <section className="gradient-brand relative overflow-hidden rounded-xl3 p-6 text-white sm:p-9">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Badge tone="accent" className="bg-white/15 text-white">
              پلتفرم اختصاصی B2B صنایع غذایی ایران
            </Badge>
            <h1 className="mt-3 text-2xl font-extrabold leading-relaxed sm:text-[32px]">
              خرید عمده مواد غذایی، مستقیم از کارخانه — بدون ویزیتور، بدون واسطه
            </h1>
            <p className="mt-3 max-w-2xl text-[13px] leading-7 text-white/85">
              بازارعمده، فروشگاه‌ها، سوپرمارکت‌ها، رستوران‌ها و پخش‌کننده‌ها را مستقیم به تأمین‌کنندگان و برندهای
              معتبر ایرانی و بین‌المللی متصل می‌کند. نرخ‌نامه پله‌ای، خرید اعتباری، فاکتور رسمی و ارسال با زنجیره
              سرد — همه در یک پلتفرم.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/catalog" className="btn bg-white text-brand-800 hover:bg-white/90">
                <Icon name="grid" className="h-4 w-4" />
                مشاهده کاتالوگ عمده
              </Link>
              {customer ? (
                <Link to="/account" className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
                  <Icon name="user" className="h-4 w-4" />
                  حساب من
                </Link>
              ) : (
                <button
                  className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25"
                  onClick={() => {
                    demoLoginCustomer();
                    toast('ورود سریع دمو انجام شد — خوش آمدید');
                  }}
                >
                  <Icon name="rocket" className="h-4 w-4" />
                  ورود سریع دمو
                </button>
              )}
              <Link to="/about" className="btn bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20">
                درباره پلتفرم
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [`${faNum(brands.length)}+`, 'برند و تأمین‌کننده'],
                [`${faNum(products.length)}+`, 'کد کالای عمده'],
                [`${faNum(Math.round(totalSold / 1000))}هزار+`, 'سفارش موفق'],
                ['۹۸٪', 'تحویل به‌موقع'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl2 bg-white/10 p-3">
                  <p className="num text-lg font-extrabold">{v}</p>
                  <p className="text-[11px] text-white/80">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="rounded-xl2 bg-white/10 p-3.5">
              <p className="flex items-center gap-2 text-[12px] font-extrabold">
                <Icon name="sparkles" className="h-4 w-4" />
                پیشنهاد هوشمند برای فروشگاه شما
              </p>
              <div className="mt-2.5 space-y-2">
                {products.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="flex items-center gap-2.5 rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white/15">
                      <Icon name="package" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-bold">{p.name}</span>
                      <span className="num block text-[10.5px] text-white/75">{tomanShort(p.basePrice)} تومان — {p.unit}</span>
                    </span>
                    <Icon name="chevron-left" className="h-4 w-4 flex-none" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-xl2 bg-white/10 p-3.5">
              <p className="text-[11.5px] font-bold">مقایسه با روش سنتی خرید</p>
              <div className="num mt-2 space-y-1.5 text-[11px]">
                <p className="flex items-center justify-between">
                  <span className="text-white/80">کاهش هزینه توزیع</span>
                  <span className="font-extrabold">۳۱٪</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-white/80">کاهش زمان چرخه سفارش</span>
                  <span className="font-extrabold">۲٫۴ روز</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-white/80">میانگین صرفه‌جویی خریدار</span>
                  <span className="font-extrabold">۱۸٫۴٪</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <span className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <span className="absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-accent-400/20" />
      </section>

      {/* ───────── دسته‌بندی‌ها */}
      <section className="mt-6">
        <SectionTitle
          title="دسته‌بندی کالاهای عمده"
          subtitle="از لبنیات و نوشیدنی تا خشکبار، پروتئین و غذای کودک"
          icon="grid"
          action={
            <Link to="/categories" className="btn-ghost btn-sm">
              مشاهده همه دسته‌ها
              <Icon name="chevron-left" className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {rootCategories.slice(0, 11).map((c) => {
            const count = products.filter((p) => {
              const cat = categoryById(p.categoryId);
              return p.categoryId === c.id || cat?.parentId === c.id;
            }).length;
            return (
              <Link
                key={c.id}
                to={`/catalog?cat=${c.id}`}
                className="card flex flex-col items-center gap-2 p-3 text-center transition hover:shadow-pop"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${c.color}1a`, color: c.color }}>
                  <Icon name={c.icon} className="h-6 w-6" />
                </span>
                <span className="text-[11.5px] font-bold leading-5">{c.name}</span>
                <span className="num text-[10.5px] text-ink-400">{faNum(count)} کالا</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────── بنر اعتبار */}
      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        <Card className="bg-brand-50/70 dark:bg-brand-900/20">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-brand-600 text-white">
            <Icon name="wallet" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-extrabold">خرید اعتباری و چکی</p>
          <p className="mt-1 text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            تا ۴۵ روز مهلت تسویه با سقف اعتبار اختصاصی فروشگاه شما. اعتبارسنجی آنلاین در کمتر از ۲۴ ساعت.
          </p>
          <Link to="/account" className="btn-ghost btn-sm mt-3">
            مشاهده سقف اعتبار من
          </Link>
        </Card>
        <Card className="bg-accent-50/70 dark:bg-accent-900/20">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-accent-500 text-white">
            <Icon name="users" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-extrabold">خرید گروهی هم‌صنفان</p>
          <p className="mt-1 text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            با سایر فروشگاه‌های هم‌شهر به آستانه پالتی برسید و قیمت پالت را دریافت کنید.
          </p>
          <Link to="/group-buy" className="btn-ghost btn-sm mt-3">
            مشاهده کمپین‌های خرید گروهی
          </Link>
        </Card>
        <Card className="bg-sky-50/70 dark:bg-sky-900/20">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-sky-600 text-white">
            <Icon name="repeat" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[13px] font-extrabold">سفارش دوره‌ای خودکار</p>
          <p className="mt-1 text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            سبد همیشگی فروشگاه را یک بار بسازید و بگذارید هر هفته یا هر ماه خودکار ارسال شود.
          </p>
          <Link to="/subscriptions" className="btn-ghost btn-sm mt-3">
            ساخت سفارش دوره‌ای
          </Link>
        </Card>
      </section>

      {/* ───────── آفرها */}
      <section className="mt-6">
        <SectionTitle
          title="آفرهای عمده فعال این هفته"
          subtitle="تخفیف‌های ویژه فروشگاهی، پالتی و فصلی"
          icon="tag"
          action={
            <Link to="/offers" className="btn-ghost btn-sm">
              همه آفرها
              <Icon name="chevron-left" className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {activeOffers.map((o) => (
            <Link key={o.id} to={`/catalog?offer=${o.id}`} className="card group overflow-hidden p-0 transition hover:shadow-pop">
              <div className="flex items-center justify-between p-4 text-white" style={{ background: o.color }}>
                <div>
                  <p className="text-[11px] opacity-90">{offerKindLabel[o.kind]}</p>
                  <p className="text-[15px] font-extrabold">{percentFa(o.percent)} تخفیف</p>
                </div>
                <Icon name={o.icon} className="h-8 w-8 opacity-80" />
              </div>
              <div className="p-3.5">
                <p className="text-[12.5px] font-extrabold">{o.title}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{o.description}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="num chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">کد {o.code}</span>
                  <span className="num text-[10.5px] text-ink-400">
                    {o.minCartAmount > 0 ? `حداقل سبد ${tomanShort(o.minCartAmount)}` : 'بدون حداقل سبد'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────── پرفروش‌ها */}
      <section className="mt-6">
        <SectionTitle
          title="پرفروش‌ترین کالاهای عمده"
          subtitle="بر پایه حجم خرید فروشگاه‌های پلتفرم"
          icon="flame"
          action={
            <Link to="/catalog?sort=sold" className="btn-ghost btn-sm">
              مشاهده بیشتر
              <Icon name="chevron-left" className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* ───────── تومان‌شکن: برندها */}
      <section className="mt-6">
        <SectionTitle
          title="برندهای موجود در پلتفرم"
          subtitle={`${faNum(brands.length)} برند ایرانی و بین‌المللی دارای مجوز`}
          icon="award"
          action={
            <Link to="/brands" className="btn-ghost btn-sm">
              همه برندها
              <Icon name="chevron-left" className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <Card>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {brands.slice(0, 30).map((b) => (
              <Link key={b.id} to={`/brand/${b.id}`} title={b.name} className="transition hover:-translate-y-0.5">
                <BrandMark brand={b} size={42} rounded />
              </Link>
            ))}
          </div>
          <p className="num mt-3 text-center text-[11px] text-ink-400">
            نمایش لوگوها به‌صورت مونوگرام اختصاصی و با عنوان «لوگوی نمایشی» است
          </p>
        </Card>
      </section>

      {/* ───────── جدیدترین‌ها و تخفیف‌دارها */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle title="تازه‌ترین کالاهای کاتالوگ" subtitle="افزوده‌شده در ۳۰ روز گذشته" icon="sparkle" />
          <div className="space-y-2.5">
            {newest.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-pop">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <Icon name={categoryById(p.categoryId)?.icon ?? 'package'} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold">{p.name}</span>
                  <span className="num block text-[11px] text-ink-400">
                    {p.packDesc} • {p.country}
                  </span>
                </span>
                <span className="num flex-none text-[12.5px] font-extrabold text-brand-700 dark:text-brand-300">{tomanShort(p.basePrice)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle title="بیشترین تخفیف نقدی" subtitle="پرداخت نقدی هنگام تحویل" icon="discount" />
          <div className="space-y-2.5">
            {discounted.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`} className="card flex items-center gap-3 p-3 transition hover:shadow-pop">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                  <Icon name="discount" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold">{p.name}</span>
                  <span className="num block text-[11px] text-ink-400">
                    {p.packDesc} • موجودی {faNum(p.stock)} {p.unit}
                  </span>
                </span>
                <Badge tone="success">{percentFa(p.cashDiscountPercent)} نقدی</Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── بازدیدهای اخیر */}
      {recent.length > 0 && (
        <section className="mt-6">
          <SectionTitle title="بازدیدهای اخیر شما" subtitle="ادامه بررسی کالاها" icon="clock" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {recent.map((p) => p && <ProductCard key={p.id} product={p} compact />)}
          </div>
        </section>
      )}

      {/* ───────── مزایا */}
      <section className="mt-6">
        <SectionTitle title="چرا پلتفرم بازارعمده؟" subtitle="مدل عملیاتی جدید توزیع مواد غذایی" icon="sparkles" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, desc, icon]) => (
            <Card key={title} hover>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <p className="mt-3 text-[13px] font-extrabold">{title}</p>
              <p className="mt-1 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ───────── مقایسه مدل سنتی و پلتفرم */}
      <section className="mt-6">
        <Card>
          <SectionTitle title="مقایسه مدل سنتی توزیع با پلتفرم بازارعمده" subtitle="چرا حذف ویزیت فیزیکی به نفع همه است" icon="chart" />
          <div className="overflow-x-auto">
            <table className="table-basic min-w-[620px]">
              <thead>
                <tr>
                  <th>شاخص</th>
                  <th>مدل سنتی (ویزیت + پخش)</th>
                  <th className="text-brand-700 dark:text-brand-300">پلتفرم بازارعمده</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['هزینه هر ویزیت/سفارش‌گیری', '۴۲۰٬۰۰۰ تومان', 'زیر ۹۰٬۰۰۰ تومان'],
                  ['زمان ثبت تا تحویل', '۳ تا ۷ روز', '۲۴ تا ۷۲ ساعت'],
                  ['شفافیت نرخ‌نامه', 'قیمت موردی و غیرشفاف', 'نرخ‌نامه پله‌ای آنلاین'],
                  ['دسترسی به کاتالوگ کامل برند', 'محدود به موجودی پخش', 'کاتالوگ کامل همه برندها'],
                  ['بازگشت کالا و مغایرت', 'کاغذی و زمان‌بر', 'آنلاین با پیگیری کد سفارش'],
                  ['تحلیل خرید و سود فروشگاه', 'بدون داده', 'داشبورد BI اختصاصی'],
                ].map(([k, a, b]) => (
                  <tr key={k}>
                    <td className="font-semibold">{k}</td>
                    <td className="text-ink-500 dark:text-ink-400">{a}</td>
                    <td className="font-bold text-brand-700 dark:text-brand-300">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ───────── آمار و آکادمی */}
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <Stat label="ارزش کل سفارش‌های نمایشی پلتفرم" value={tomanShort(orders.reduce((s, o) => s + o.grandTotal, 0))} icon="chart" hint="بر پایه داده Mock نسخه دمو" />
          <Stat label="تعداد کد کالای فعال" value={faNum(products.length)} icon="package" tone="info" hint={`${faNum(brands.length)} برند فعال`} />
          <Stat label="کمپین‌های نتیجه‌داده" value={faNum(offers.length)} icon="tag" tone="accent" hint="آفر فروشگاهی، پالتی و فصلی" />
        </div>
        <div>
          <SectionTitle
            title="آکادمی خرده‌فروش بازارعمده"
            subtitle="آموزش رایگان مدیریت فروشگاه، انبار و سود"
            icon="video"
            action={
              <Link to="/academy" className="btn-ghost btn-sm">
                همه مقالات
                <Icon name="chevron-left" className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="grid gap-3 sm:grid-cols-3">
            {articles.slice(0, 3).map((a) => (
              <Link key={a.id} to={`/academy/${a.id}`} className="card overflow-hidden p-0 transition hover:shadow-pop">
                <div className="flex h-24 items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${a.cover.from}, ${a.cover.to})` }}>
                  <Icon name={a.cover.icon} className="h-8 w-8" />
                </div>
                <div className="p-3">
                  <Badge tone="neutral">{a.kind === 'video' ? 'ویدیو' : a.kind === 'recipe' ? 'دستور پخت' : a.kind === 'webinar' ? 'وبینار' : 'مقاله'}</Badge>
                  <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-5">{a.title}</p>
                  <p className="num mt-1.5 text-[10.5px] text-ink-400">
                    {faNum(a.readMinutes)} دقیقه مطالعه • {faNum(a.views)} بازدید
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA */}
      <section className="mt-6">
        <Card className="gradient-brand flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="max-w-2xl">
            <p className="text-[15px] font-extrabold">فروشگاه خود را به شبکه تأمین مستقیم متصل کنید</p>
            <p className="mt-1.5 text-[11.5px] leading-6 text-white/85">
              همین حالا وارد نسخه دمو شوید، سبد عمده بسازید و پیش‌فاکتور رسمی دریافت کنید. برای اعتبارسنجی و سقف
              اعتباری، مدارک فروشگاه را در پنل بارگذاری کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/catalog" className="btn bg-white text-brand-800 hover:bg-white/90">
              شروع خرید عمده
            </Link>
            <Link to="/rfq" className="btn bg-white/15 text-white ring-1 ring-white/30 hover:bg-white/25">
              ثبت استعلام قیمت
            </Link>
          </div>
        </Card>
      </section>

      {/* ───────── فوتر برند */}
      <footer className="mt-8 border-t border-ink-200 pt-5 dark:border-ink-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KarenSoftLogo size={40} />
            <div>
              <p className="text-[12px] font-extrabold">طراحی و توسعه: کارن سافت</p>
              <p className="text-[11px] text-ink-500 dark:text-ink-400">
                <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold text-brand-700 dark:text-brand-300">
                  Karen-soft.ir
                </a>{' '}
                — پورتال، اپلیکیشن و سامانه‌های سازمانی
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Link to="/about" className="btn-ghost btn-sm">
              درباره ما
            </Link>
            <Link to="/sustainability" className="btn-ghost btn-sm">
              پایداری و مسئولیت اجتماعی
            </Link>
            <Link to="/forum" className="btn-ghost btn-sm">
              انجمن صنفی
            </Link>
            <Link to="/admin/login" className="btn-ghost btn-sm">
              ورود مدیران
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
