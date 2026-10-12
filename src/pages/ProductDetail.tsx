import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Card, EmptyState, Modal, SectionTitle, Stars, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductVisual } from '@/components/ProductVisual';
import { BrandMark } from '@/components/BrandLogo';
import { ProductCard } from '@/components/ProductCard';
import { QrCode } from '@/components/QrCode';
import { useBrandMap, useOffers, useProducts, useStore } from '@/store/useStore';
import { computePrice } from '@/lib/pricing';
import { categoryById, categoryPath } from '@/data/categories';
import { faNum, jalaliDate, percentFa, toEnDigits, toman, tomanShort, daysUntil } from '@/lib/format';
import { contracts as mockContracts } from '@/data/crm';
import { productsByBrand } from '@/data/products';
import { PerUnitPrices, SpecChips, SpecGrid, nextTierNudge } from '@/modules/dh';
import {
  PerUnitPrices as MiscPerUnitPrices,
  SpecChips as MiscSpecChips,
  SpecGrid as MiscSpecGrid,
  nextTierNudge as miscNextTierNudge,
} from '@/modules/misc';
import {
  PerUnitPrices as SnackPerUnitPrices,
  SpecChips as SnackSpecChips,
  SpecGrid as SnackSpecGrid,
  nextTierNudge as snackNextTierNudge,
} from '@/modules/snacks';

const ProductDetail = () => {
  const { id } = useParams();
  const products = useProducts();
  const offers = useOffers();
  const brandMap = useBrandMap();
  const customer = useStore((s) => s.customer);
  const addToCart = useStore((s) => s.addToCart);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const cashPayment = useStore((s) => s.cashPayment);
  const { toast } = useToast();

  const product = products.find((p) => p.id === id) ?? products[0];
  const [qty, setQty] = useState(Math.max(1, product?.moq ?? 1));
  const [tab, setTab] = useState('specs');
  const [qrOpen, setQrOpen] = useState(false);

  const contractsExtra = useStore((s) => s.contractsExtra);
  const contract = useMemo(() => {
    const all = [...contractsExtra, ...mockContracts];
    return (
      all.find(
        (c) =>
          c.customerId === customer?.id &&
          c.status !== 'expired' &&
          c.status !== 'draft' &&
          product &&
          c.productIds.includes(product.id),
      ) ?? null
    );
  }, [contractsExtra, customer?.id, product]);

  const price = useMemo(
    () => (product ? computePrice({ product, qty, offers, customer, contract, cashPayment, isFirstOrder: false }) : null),
    [product, qty, offers, customer, contract, cashPayment],
  );

  const brand = product ? brandMap.get(product.brandId) : undefined;
  const cat = product ? categoryById(product.categoryId) : undefined;
  const siblings = useMemo(() => (product ? productsByBrand(product.brandId).filter((p) => p.id !== product.id).slice(0, 5) : []), [product]);
  const related = useMemo(
    () => (product ? products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 5) : []),
    [product, products],
  );

  if (!product || !price) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState icon="package" title="کالا یافت نشد" action={<Link to="/catalog" className="btn-primary">بازگشت به کاتالوگ</Link>} />
      </div>
    );
  }

  const isFav = favorites.includes(product.id);
  const inCompare = compare.includes(product.id);
  const expiryDays = daysUntil(product.expiryDate);

  const qtyOptions = Array.from(new Set([product.moq, 5, 10, 20, 50, 100].filter((n) => n >= product.moq)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* مسیر راهنما */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
        <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">
          خانه
        </Link>
        <Icon name="chevron-left" className="h-3 w-3" />
        <Link to="/catalog" className="hover:text-brand-700 dark:hover:text-brand-300">
          کاتالوگ
        </Link>
        {categoryPath(product.categoryId).map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <Icon name="chevron-left" className="h-3 w-3" />
            <Link to={`/catalog?cat=${c.id}`} className="hover:text-brand-700 dark:hover:text-brand-300">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* گالری */}
        <div className="space-y-3">
          <Card padded={false} className="overflow-hidden">
            <div className="h-72 w-full">
              <ProductVisual product={product} />
            </div>
          </Card>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((im, i) => (
              <div key={im.seed} className="flex h-20 items-center justify-center rounded-xl2 border border-ink-200 dark:border-ink-700" style={{ background: `${im.hue}12` }}>
                <span style={{ color: im.hue }}>
                  <Icon name={im.icon} className="h-7 w-7" />
                </span>
              </div>
            ))}
            <button
              className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl2 border border-dashed border-ink-300 text-[10px] text-ink-400 hover:border-brand-400 dark:border-ink-600"
              onClick={() => setQrOpen(true)}
            >
              <Icon name="qr" className="h-6 w-6" />
              QR کالا
            </button>
          </div>

          <Card>
            <SectionTitle title="اطلاعات تأمین و انبار" icon="warehouse" />
            <div className="space-y-2 text-[11.5px]">
              {[
                ['کد کالا (SKU)', product.sku],
                ['بارکد', product.barcode],
                ['کشور تولید', product.country],
                ['تاریخ تولید', jalaliDate(product.productionDate)],
                ['تاریخ انقضا', `${jalaliDate(product.expiryDate)} (${faNum(expiryDays)} روز)`],
                ['عمر مفید', `${faNum(product.shelfLifeMonths)} ماه`],
                ['تعداد در پالت', `${faNum(product.paletteQty)} ${product.unit}`],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between gap-2">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className="num font-bold">{v}</span>
                </div>
              ))}
            </div>
            {expiryDays < 120 && (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/25 dark:text-amber-200">
                توجه: این بچ نزدیک انقضا است و با تخفیف ویژه «کالای نزدیک انقضا» عرضه می‌شود. تاریخ انقضا هنگام تحویل
                اعلام می‌گردد.
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title="برند تولیدکننده" icon="award" />
            {brand && (
              <div className="flex items-center gap-3">
                <BrandMark brand={brand} size={52} rounded />
                <div className="min-w-0">
                  <Link to={`/brand/${brand.id}`} className="text-[13px] font-extrabold hover:text-brand-700 dark:hover:text-brand-300">
                    {brand.name}
                  </Link>
                  <p className="text-[11px] text-ink-400" dir="ltr">
                    {brand.nameEn}
                  </p>
                  <p className="num text-[11px] text-ink-400">
                    {brand.country} • تأسیس {faNum(brand.established)} • {faNum(brand.rating, 1)} از ۵
                  </p>
                </div>
              </div>
            )}
            {siblings.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11.5px] font-bold">سایر کالاهای این برند</p>
                {siblings.map((p) => (
                  <Link key={p.id} to={`/product/${p.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[11px] transition hover:bg-ink-50 dark:hover:bg-ink-800">
                    <span className="truncate">{p.name}</span>
                    <span className="num flex-none font-bold text-brand-700 dark:text-brand-300">{tomanShort(p.basePrice)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* اطلاعات و خرید */}
        <div className="space-y-3">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {product.badges.map((b) => (
                    <Badge
                      key={b}
                      tone={b === 'imported' ? 'info' : b === 'bestseller' ? 'accent' : b === 'new' ? 'brand' : b === 'expiring' ? 'warning' : 'success'}
                    >
                      {b === 'halal' ? 'حلال' : b === 'organic' ? 'ارگانیک' : b === 'imported' ? 'وارداتی دارای مجوز' : b === 'irc' ? 'دارای IRC' : b === 'new' ? 'کالای جدید' : b === 'bestseller' ? 'پرفروش' : 'نزدیک انقضا'}
                    </Badge>
                  ))}
                  {brand?.exclusive && <Badge tone="vip">نمایندگی انحصاری</Badge>}
                </div>
                <h1 className="mt-2.5 text-lg font-extrabold leading-8">{product.name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] text-ink-500 dark:text-ink-400">
                  <span className="flex items-center gap-1.5">
                    <Stars value={product.rating} />
                    <span className="num">{faNum(product.rating, 1)}</span>
                  </span>
                  <span className="num">{faNum(product.soldCount)} واحد فروش‌رفته</span>
                  <span className="num">کد {product.sku}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={`btn-icon ${isFav ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30' : ''}`}
                  onClick={() => {
                    toggleFavorite(product.id);
                    toast(isFav ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها افزوده شد');
                  }}
                  aria-label="افزودن به علاقه‌مندی‌ها"
                >
                  <Icon name="heart" className="h-4 w-4" />
                </button>
                <button
                  className={`btn-icon ${inCompare ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40' : ''}`}
                  onClick={() => {
                    toggleCompare(product.id);
                    toast(inCompare ? 'از مقایسه حذف شد' : 'به لیست مقایسه افزوده شد');
                  }}
                  aria-label="افزودن به مقایسه"
                >
                  <Icon name="layers" className="h-4 w-4" />
                </button>
                <button className="btn-icon" onClick={() => setQrOpen(true)} aria-label="کد QR کالا">
                  <Icon name="qr" className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* جدول پله‌های قیمت */}
            <div className="mt-4 overflow-hidden rounded-xl2 border border-ink-200 dark:border-ink-700">
              <div className="overflow-x-auto">
                <table className="table-basic min-w-[520px]">
                  <thead>
                    <tr>
                      <th>پله خرید</th>
                      <th>قیمت هر {product.unit}</th>
                      <th>تخفیف نسبت به پایه</th>
                      <th>صرفه‌جویی در این پله</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.tiers.map((t) => {
                      const active = qty >= t.minQty && (product.tiers.find((x) => x.minQty > qty)?.minQty ?? Infinity) > qty;
                      return (
                        <tr key={t.minQty} className={active ? 'bg-brand-50/70 dark:bg-brand-900/20' : ''}>
                          <td className="font-semibold">
                            {t.minQty === 1 ? 'خرید تک' : `${faNum(t.minQty)} ${product.unit} و بیشتر`}
                            {active && <Badge tone="brand" className="mr-2">پله فعلی شما</Badge>}
                          </td>
                          <td className="num font-bold">{toman(t.price, false)} تومان</td>
                          <td>
                            {t.discountPercent > 0 ? <Badge tone="success">{percentFa(t.discountPercent)}</Badge> : <span className="text-ink-400">—</span>}
                          </td>
                          <td className="num text-[11.5px]">
                            {t.discountPercent > 0 ? `${toman((product.basePrice - t.price) * t.minQty, false)} تومان` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* جعبه خرید */}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 p-1 dark:border-ink-700">
                    <button className="btn-icon" onClick={() => setQty(Math.max(product.moq, qty - 1))} aria-label="کاهش">
                      <Icon name="minus" className="h-4 w-4" />
                    </button>
                    <input
                      value={faNum(qty)}
                      onChange={(e) => setQty(Math.max(1, Number(toEnDigits(e.target.value).replace(/\D/g, '')) || 1))}
                      className="num w-16 border-0 bg-transparent text-center text-[14px] font-extrabold outline-none"
                      aria-label="تعداد"
                    />
                    <button className="btn-icon" onClick={() => setQty(qty + 1)} aria-label="افزایش">
                      <Icon name="plus" className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="num text-[11.5px] text-ink-500 dark:text-ink-400">
                    حداقل سفارش: {faNum(product.moq)} {product.unit} • موجودی: {faNum(product.stock)} {product.unit}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {qtyOptions.map((n) => (
                    <button
                      key={n}
                      onClick={() => setQty(n)}
                      className={`chip transition ${qty === n ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300'}`}
                    >
                      <span className="num">{faNum(n)}</span> {product.unit}
                    </button>
                  ))}
                </div>

                {price.nextTier && (
                  <div className="rounded-xl border border-dashed border-accent-300 bg-accent-50/70 p-3 dark:border-accent-700 dark:bg-accent-900/20">
                    <p className="text-[11.5px] font-semibold text-accent-900 dark:text-accent-200">
                      {faNum(price.nextTier.needQty)} {product.unit} دیگر اضافه کنید → {percentFa(price.nextTier.discountPercent)} ارزان‌تر
                      (قیمت هر {product.unit} به {toman(price.nextTier.newUnitPrice, false)} تومان می‌رسد)
                    </p>
                    <button className="btn-soft btn-sm mt-2" onClick={() => setQty(price.nextTier!.minQty)}>
                      <Icon name="plus" className="h-3.5 w-3.5" />
                      رسیدن به پله {price.nextTier.label}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:w-72">
                <div className="rounded-xl2 border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-800 dark:bg-brand-900/20">
                  <div className="flex items-end justify-between">
                    <span className="text-[11.5px] text-brand-900 dark:text-brand-100">قیمت هر {product.unit}</span>
                    <span className="num text-[18px] font-extrabold text-brand-800 dark:text-brand-200">{toman(price.unitPrice, false)}</span>
                  </div>
                  <div className="num mt-1 flex items-center justify-between text-[11px] text-brand-800/80 dark:text-brand-200/80">
                    <span>جمع {faNum(qty)} {product.unit}</span>
                    <span className="font-bold">{toman(price.lineTotal, false)} تومان</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-brand-900 dark:text-brand-100">صرفه‌جویی نسبت به قیمت پایه</span>
                    <span className="num font-bold text-emerald-700 dark:text-emerald-300">{toman(price.totalDiscount, false)} تومان</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-brand-900 dark:text-brand-100">قیمت مصرف‌کننده پیشنهادی</span>
                    <span className="num font-bold">{toman(product.marketPrice, false)} تومان</span>
                  </div>
                </div>

                <button
                  className="btn-primary w-full"
                  onClick={() => {
                    addToCart(product.id, qty);
                    toast(`${faNum(qty)} ${product.unit} از «${product.name}» به سبد افزوده شد`);
                  }}
                >
                  <Icon name="cart" className="h-4 w-4" />
                  افزودن به سبد عمده
                </button>
                <Link to="/cart" className="btn-soft w-full">
                  مشاهده سبد و تسویه
                </Link>
              </div>
            </div>

            {/* ریز محاسبه قیمت */}
            {price.steps.length > 1 && (
              <div className="mt-4 rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                <p className="mb-2 text-[12px] font-extrabold">ریز محاسبه قیمت (نرخ‌نامه آبشاری)</p>
                <div className="space-y-1.5">
                  {price.steps.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[11.5px]">
                      <span className="flex items-center gap-2">
                        <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-ink-100 text-[10px] dark:bg-ink-800">{faNum(i + 1)}</span>
                        {s.label}
                        <span className="text-[10.5px] text-ink-400">{s.detail}</span>
                      </span>
                      <span className={`num font-bold ${s.kind === 'base' ? '' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {s.kind === 'base' ? `${toman(s.amount, false)} تومان` : `− ${toman(s.amount, false)} تومان (${percentFa(s.percent)})`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10.5px] text-ink-400">
                  قیمت نهایی هر {product.unit}: <span className="num font-bold">{toman(price.unitPrice, false)} تومان</span> —{' '}
                  {price.vipApplied ? 'تخفیف باشگاه VIP اعمال شد' : 'برای دریافت تخفیف باشگاه، سطح حساب خود را ارتقا دهید.'}
                </p>
              </div>
            )}
          </Card>

          {/* کمپین‌های مرتبط */}
          {price.appliedOffers.length > 0 && (
            <Card>
              <SectionTitle title="کمپین‌های اعمال‌شده روی این کالا" icon="tag" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {price.appliedOffers.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-white" style={{ background: o.color }}>
                      <Icon name={o.icon} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold">{o.title}</p>
                      <p className="num text-[10.5px] text-ink-400">
                        کد {o.code} • {percentFa(o.percent)} تخفیف
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* تب‌ها */}
          <Card>
            <Tabs
              active={tab}
              onChange={setTab}
              tabs={[
                { id: 'specs', label: 'مشخصات و بسته‌بندی', icon: 'list' },
                { id: 'desc', label: 'توضیحات کالا', icon: 'fileText' },
                { id: 'logistics', label: 'ارسال و انبار', icon: 'truck' },
                { id: 'reviews', label: 'نظرات خریداران', icon: 'star' },
              ]}
            />

            <div className="mt-4">
              {tab === 'specs' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    ['نام فارسی کالا', product.name],
                    ['نام لاتین', product.nameEn],
                    ['برند', brand?.name ?? '—'],
                    ['دسته‌بندی', cat?.name ?? '—'],
                    ['واحد فروش عمده', product.unit],
                    ['تعداد در بسته‌بندی', `${faNum(product.unitsPerCarton)} عدد`],
                    ['شرح بسته‌بندی', product.packDesc],
                    ['حداقل سفارش', `${faNum(product.moq)} ${product.unit}`],
                    ['تعداد در پالت', `${faNum(product.paletteQty)} ${product.unit}`],
                    ['شرایط نگهداری', product.badges.includes('imported') ? 'دمای محیط، دور از نور مستقیم' : 'طبق دستور کارخانه'],
                    ['گواهی‌ها', product.badges.includes('halal') ? 'حلال، استاندارد ملی' : 'استاندارد ملی ایران'],
                    ['تگ‌ها', product.tags.join(' ، ')],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                      <span className="text-ink-500 dark:text-ink-400">{l}</span>
                      <span className="num text-left font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'specs' && product.dh && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                      <Icon name="spray" className="h-4 w-4 text-sky-500" />
                      مشخصات تخصصی شوینده و بهداشتی
                    </h3>
                    <SpecChips product={product} max={4} />
                  </div>
                  <SpecGrid product={product} />
                  {product.dh.safety && product.dh.safety !== '—' && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                      <Icon name="alert" className="mt-0.5 h-4 w-4 flex-none" />
                      <span>
                        <span className="font-extrabold">هشدار ایمنی: </span>
                        {product.dh.safety}
                      </span>
                    </div>
                  )}
                  <PerUnitPrices product={product} />
                  {nextTierNudge(product, qty, useStore.getState().settings) && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11.5px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                      <Icon name="trendingDown" className="h-4 w-4 flex-none" />
                      {nextTierNudge(product, qty, useStore.getState().settings)!.message}
                    </div>
                  )}
                </div>
              )}

              {tab === 'specs' && product.misc && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                      <Icon name="box" className="h-4 w-4 text-violet-500" />
                      مشخصات تخصصی کالای مصرفی
                    </h3>
                    <MiscSpecChips product={product} max={4} />
                  </div>
                  <MiscSpecGrid product={product} />
                  <MiscPerUnitPrices product={product} />
                  {miscNextTierNudge(product, qty, useStore.getState().settings) && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11.5px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                      <Icon name="trendingDown" className="h-4 w-4 flex-none" />
                      {miscNextTierNudge(product, qty, useStore.getState().settings)!.message}
                    </div>
                  )}
                </div>
              )}

              {tab === 'specs' && product.snacks && (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                      <Icon name="candy" className="h-4 w-4 text-amber-500" />
                      مشخصات تخصصی تنقلات
                    </h3>
                    <SnackSpecChips product={product} max={4} />
                  </div>
                  <SnackSpecGrid product={product} />
                  <SnackPerUnitPrices product={product} />
                  {snackNextTierNudge(product, qty, useStore.getState().settings) && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[11.5px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
                      <Icon name="trendingDown" className="h-4 w-4 flex-none" />
                      {snackNextTierNudge(product, qty, useStore.getState().settings)!.message}
                    </div>
                  )}
                </div>
              )}

              {tab === 'desc' && (
                <div className="space-y-3 text-[12.5px] leading-7 text-ink-600 dark:text-ink-300">
                  <p>{product.description}</p>
                  <p>
                    این کالا با بسته‌بندی عمده ({product.packDesc}) عرضه می‌شود و برای فروشگاه‌های مواد غذایی،
                    سوپرمارکت‌ها و رستوران‌ها مناسب است. قیمت مصرف‌کننده پیشنهادی {toman(product.marketPrice, false)}{' '}
                    تومان است که با خرید عمده از پلتفرم، حاشیه سود مناسب برای فروشگاه شما ایجاد می‌کند.
                  </p>
                  <p>
                    امکان استعلام قیمت اختصاصی برای سفارش‌های بالای ۵۰ {product.unit} و انعقاد قرارداد قیمت پیمانی
                    سالانه وجود دارد. برای کالاهای وارداتی، پروانه ثبت کالا (IRC) و مجوزهای بهداشتی در پنل مدیریت
                    بایگانی شده است.
                  </p>
                </div>
              )}

              {tab === 'logistics' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    ['انبار ارسال', 'انبار مرکزی تهران — کیلومتر ۱۲ جاده مخصوص'],
                    ['زمان آماده‌سازی', '۴ تا ۸ ساعت کاری'],
                    ['روش ارسال', product.badges.includes('halal') ? 'خودروی یخچال‌دار (زنجیره سرد)' : 'خودروی باری سبک'],
                    ['هزینه ارسال', '۳۵۰٬۰۰۰ تومان — رایگان برای سفارش بالای ۲۰ میلیون تومان'],
                    ['بازه تحویل تهران', '۹ تا ۱۸ — روز بعد از ثبت سفارش'],
                    ['بازه تحویل شهرستان', '۲ تا ۳ روز کاری با پیک اختصاصی'],
                    ['امضای تحویل', 'امضای دیجیتال گیرنده + عکس بارنامه'],
                    ['سیاست مرجوعی', '۴۸ ساعت برای مغایرت و آسیب بسته‌بندی'],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                      <p className="text-[11px] text-ink-500 dark:text-ink-400">{l}</p>
                      <p className="num mt-1 text-[11.5px] font-semibold leading-6">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4 rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                    <div className="text-center">
                      <p className="num text-2xl font-extrabold">{faNum(product.rating, 1)}</p>
                      <Stars value={product.rating} size={16} />
                      <p className="num mt-1 text-[10.5px] text-ink-400">از {faNum(Math.round(product.soldCount / 12))} نظر</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((s) => {
                        const pct = s === 5 ? 62 : s === 4 ? 26 : s === 3 ? 8 : s === 2 ? 3 : 1;
                        return (
                          <div key={s} className="flex items-center gap-2 text-[11px]">
                            <span className="num w-8">{faNum(s)} ★</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                              <span className="block h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="num w-10 text-ink-400">{faNum(pct)}٪</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {[
                    ['سوپرمارکت زنجیره‌ای آفتاب', 5, 'بسته‌بندی سالم و به‌موقع تحویل شد. قیمت پله ۲۰ کارتن واقعاً به‌صرفه است.'],
                    ['پخش کاسپین', 4, 'کیفیت کالا خوب بود؛ اما تاریخ انقضا بهتر است شفاف‌تر در پیش‌فاکتور اعلام شود.'],
                    ['رستوران باغ ایرانی', 5, 'برای مصرف روزانه رستوران، خرید کارتنی همیشه موجود بوده و کمبود نداشتیم.'],
                  ].map(([name, stars, text]) => (
                    <div key={name as string} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold">{name}</span>
                        <Stars value={stars as number} />
                      </div>
                      <p className="mt-2 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{text}</p>
                      <p className="mt-1 text-[10.5px] text-ink-400">خرید تأییدشده از پلتفرم بازارعمده</p>
                    </div>
                  ))}
                  <button className="btn-ghost btn-sm" onClick={() => toast('فرم ثبت نظر برای خریداران این کالا فعال است (نمایشی)')}>
                    <Icon name="edit" className="h-3.5 w-3.5" />
                    ثبت نظر و امتیاز
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* محصولات مشابه */}
      {related.length > 0 && (
        <section className="mt-6">
          <SectionTitle title="کالاهای مشابه در همین دسته" subtitle={cat?.name} icon="grid" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </section>
      )}

      {/* QR */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`کد QR کالا — ${product.name}`} size="sm">
        <div className="space-y-3 text-center">
          <div className="mx-auto w-fit rounded-xl2 border border-ink-200 p-4 dark:border-ink-700">
            <QrCode value={`${window.location.origin}${window.location.pathname}#/product/${product.id}`} size={180} />
          </div>
          <p className="num text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
            این کد برای اسکن کالا در انبار و صفحات محصول در موبایل استفاده می‌شود. کد کالا: {product.sku}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetail;
