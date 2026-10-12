import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, Progress, SectionTitle, Switch, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductVisual } from '@/components/ProductVisual';
import { useBrandMap, useOffers, useProducts, useStore } from '@/store/useStore';
import { computeCart, tierHint, applicableOffers, MAX_TOTAL_DISCOUNT } from '@/lib/pricing';
import { faNum, percentFa, toEnDigits, toman, tomanShort } from '@/lib/format';

const Cart = () => {
  const cart = useStore((s) => s.cart);
  const cashPayment = useStore((s) => s.cashPayment);
  const setCashPayment = useStore((s) => s.setCashPayment);
  const setCartQty = useStore((s) => s.setCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const customer = useStore((s) => s.customer);
  const addToCart = useStore((s) => s.addToCart);
  const products = useProducts();
  const offers = useOffers();
  const brandMap = useBrandMap();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState('');
  const [appliedCodes, setAppliedCodes] = useState<string[]>([]);

  const lines = useMemo(
    () =>
      cart
        .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
        .filter((x): x is { line: typeof cart[number]; product: NonNullable<typeof x.product> } => !!x.product),
    [cart, products],
  );

  const contract = useStore((s) => s.contractsExtra);
  const settings = useStore((s) => s.settings);

  const breakdownRaw = useMemo(
    () =>
      computeCart({
        lines: cart,
        offers,
        customer,
        contracts: contract,
        taxPercent: settings.taxPercent,
        freeShippingMin: settings.freeShippingMin,
        shippingCost: settings.shippingCost,
        cashPayment,
        isFirstOrder: false,
      }),
    [cart, offers, customer, contract, settings, cashPayment],
  );

  const appliedOfferDiscount = useMemo(
    () =>
      appliedCodes.reduce((sum, code) => {
        const offer = offers.find((o) => o.code.toUpperCase() === code);
        return sum + (offer ? Math.round((breakdownRaw.subtotal * offer.percent) / 100) : 0);
      }, 0),
    [appliedCodes, offers, breakdownRaw.subtotal],
  );

  const breakdown = useMemo(() => {
    const subtotal = Math.max(0, breakdownRaw.subtotal - appliedOfferDiscount);
    const tax = Math.round((subtotal * settings.taxPercent) / 100);
    const shipping = subtotal >= settings.freeShippingMin ? 0 : settings.shippingCost;
    return {
      ...breakdownRaw,
      subtotal,
      discountTotal: breakdownRaw.rawSubtotal - subtotal,
      taxAmount: tax,
      shippingCost: shipping,
      grandTotal: subtotal + tax + shipping,
      freeShippingGap: Math.max(0, settings.freeShippingMin - subtotal),
    };
  }, [breakdownRaw, appliedOfferDiscount, settings]);

  const offerSuggestions = useMemo(
    () =>
      applicableOffers({
        offers,
        qty: cart.reduce((s, l) => s + l.qty, 0),
        lineTotal: breakdown.subtotal,
        cartTotal: breakdown.subtotal,
        customer,
      }).filter((o) => !appliedCodes.includes(o.code)),
    [offers, customer, breakdown.subtotal, cart, appliedCodes],
  );

  const freeShipGap = breakdown.freeShippingGap;
  const totalQty = cart.reduce((s, l) => s + l.qty, 0);

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    const found = offers.find((o) => o.code.toUpperCase() === code);
    if (!found) {
      toast('کد تخفیف معتبر نیست (کدهای demo: MKT2026، BULK12)', 'error');
      return;
    }
    if (appliedCodes.includes(found.code)) {
      toast('این کد قبلاً اعمال شده است', 'error');
      return;
    }
    setAppliedCodes([...appliedCodes, found.code]);
    setCoupon('');
    toast(`کد تخفیف ${found.code} اعمال شد`);
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon="cart"
          title="سبد خرید عمده شما خالی است"
          description="با انتخاب کالا از کاتالوگ، سفارش خود را با قیمت‌های پله‌ای عمده ثبت کنید."
          action={
            <Link to="/catalog" className="btn-primary">
              <Icon name="grid" className="h-4 w-4" />
              مشاهده کاتالوگ کالا
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold">سبد خرید عمده</h1>
          <p className="num mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
            {faNum(lines.length)} کد کالا • {faNum(totalQty)} واحد • قیمت‌ها بر اساس نرخ‌نامه پله‌ای محاسبه شده است
          </p>
        </div>
        <button className="btn-ghost btn-sm text-rose-600" onClick={() => { clearCart(); toast('سبد خرید خالی شد', 'error'); }}>
          <Icon name="trash" className="h-4 w-4" />
          خالی‌کردن سبد
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {lines.map(({ line, product }) => {
            const hint = tierHint(line, product);
            const nextTier = product.tiers.find((t) => t.minQty > line.qty);
            const brand = brandMap.get(product.brandId);
            return (
              <Card key={line.productId} className="space-y-3">
                <div className="flex gap-3">
                  <Link to={`/product/${product.id}`} className="h-24 w-24 flex-none overflow-hidden rounded-xl2">
                    <ProductVisual product={product} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/product/${product.id}`} className="line-clamp-2 text-[13px] font-extrabold hover:text-brand-700 dark:hover:text-brand-300">
                          {product.name}
                        </Link>
                        <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
                          <span>{brand?.name}</span>
                          <span className="num">• {product.packDesc}</span>
                          <span className="num">• {product.sku}</span>
                        </p>
                      </div>
                      <button className="btn-ghost btn-sm text-rose-600" onClick={() => removeFromCart(product.id)} aria-label="حذف از سبد">
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 p-1 dark:border-ink-700">
                        <button className="btn-icon" onClick={() => setCartQty(product.id, Math.max(product.moq, line.qty - 1))} aria-label="کاهش">
                          <Icon name="minus" className="h-3.5 w-3.5" />
                        </button>
                        <input
                          value={faNum(line.qty)}
                          onChange={(e) => setCartQty(product.id, Math.max(1, Number(toEnDigits(e.target.value).replace(/\D/g, '')) || 1))}
                          className="num w-14 border-0 bg-transparent text-center text-[13px] font-extrabold outline-none"
                          aria-label="تعداد"
                        />
                        <button className="btn-icon" onClick={() => setCartQty(product.id, line.qty + 1)} aria-label="افزایش">
                          <Icon name="plus" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="num text-[11.5px] text-ink-500 dark:text-ink-400">
                        قیمت واحد: <span className="font-extrabold text-ink-800 dark:text-ink-200">{toman(line.unitPrice, false)}</span> تومان
                      </span>
                      <LineMeta line={line} />
                      {product.stock < line.qty && <Badge tone="danger">بیش از موجودی</Badge>}
                    </div>
                  </div>
                </div>

                {hint && (
                  <div className="rounded-xl border border-dashed border-accent-300 bg-accent-50/70 p-3 dark:border-accent-700 dark:bg-accent-900/20">
                    <p className="text-[11.5px] font-semibold text-accent-900 dark:text-accent-200">{hint}</p>
                    {nextTier && (
                      <button
                        className="btn-soft btn-sm mt-2"
                        onClick={() => {
                          addToCart(product.id, nextTier.minQty - line.qty);
                          toast(`سبد به پله ${nextTier.label} رسید — ${percentFa(nextTier.discountPercent)} تخفیف اعمال شد`);
                        }}
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        افزودن {faNum(nextTier.minQty - line.qty)} {product.unit} برای رسیدن به پله {nextTier.label}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                  <span className="num text-[11.5px] text-ink-500 dark:text-ink-400">
                    {faNum(line.qty)} × {toman(line.unitPrice, false)} تومان
                  </span>
                  <span className="num text-[13.5px] font-extrabold text-brand-700 dark:text-brand-300">{toman(line.unitPrice * line.qty, false)} تومان</span>
                </div>
              </Card>
            );
          })}

          {offerSuggestions.length > 0 && (
            <Card>
              <SectionTitle title="کمپین‌های قابل اعمال روی این سبد" subtitle="با انتخاب، تخفیف به‌صورت زنده محاسبه می‌شود" icon="tag" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {offerSuggestions.slice(0, 4).map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setAppliedCodes([...appliedCodes, o.code]);
                      toast(`کمپین «${o.title}» اعمال شد`);
                    }}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink-200 p-3 text-right transition hover:border-brand-400 dark:border-ink-700"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold">{o.title}</span>
                      <span className="num block text-[10.5px] text-ink-400">
                        {o.code} • حداقل سبد {tomanShort(o.minCartAmount)}
                      </span>
                    </span>
                    <Badge tone={o.color === '#e11d48' ? 'danger' : 'accent'}>{percentFa(o.percent)}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <SectionTitle title="خلاصه سفارش" subtitle="محاسبه زنده نرخ‌نامه" icon="receipt" />

            <div className="space-y-2.5 text-[12px]">
              <Row label="جمع کل کالاها (قیمت پایه)" value={toman(breakdown.rawSubtotal, false)} />
              {breakdown.discountTotal > 0 && (
                <Row label="مجموع تخفیف‌ها (پله، نقدی، کمپین، قرارداد)" value={`− ${toman(breakdown.discountTotal, false)}`} tone="success" />
              )}
              <Row label={`مالیات بر ارزش افزوده (${faNum(settings.taxPercent)}٪)`} value={toman(breakdown.taxAmount, false)} />
              <Row label="هزینه ارسال" value={breakdown.shippingCost === 0 ? 'رایگان' : toman(breakdown.shippingCost, false)} tone={breakdown.shippingCost === 0 ? 'success' : undefined} />
              <div className="border-t border-dashed border-ink-200 pt-2.5 dark:border-ink-700">
                <Row label="مبلغ قابل پرداخت" value={toman(breakdown.grandTotal, false)} big />
              </div>
            </div>

            {breakdown.discountTotal > 0 && (
              <div className="mt-3">
                <Progress
                  value={(breakdown.discountTotal / Math.max(1, breakdown.rawSubtotal)) * 100}
                  color="#0f684c"
                  label={`مجموع تخفیف: ${toman(breakdown.discountTotal, false)} تومان (سقف ${faNum(MAX_TOTAL_DISCOUNT)}٪)`}
                />
              </div>
            )}

            {freeShipGap > 0 ? (
              <p className="num mt-3 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
                با {tomanShort(freeShipGap)} تومان خرید بیشتر، ارسال رایگان می‌شود.
              </p>
            ) : (
              <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-[11px] font-semibold text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
                ارسال این سفارش رایگان است.
              </p>
            )}

            <div className="mt-3 space-y-2">
              <Switch
                checked={cashPayment}
                onChange={(v) => {
                  setCashPayment(v);
                  toast(v ? 'تخفیف پرداخت نقدی اعمال شد' : 'حالت پرداخت اعتباری فعال شد');
                }}
                label="پرداخت نقدی (تخفیف بیشتر)"
                description="در صورت انتخاب، تخفیف نقدی روی کل سبد اعمال می‌شود."
              />
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="کد تخفیف (MKT2026)"
                  className="input num flex-1 py-2 text-[12px]"
                />
                <button className="btn-soft btn-sm" onClick={applyCoupon}>
                  اعمال
                </button>
              </div>
              {appliedCodes.length > 0 && (
                <p className="num text-[11px] text-ink-500 dark:text-ink-400">کدهای اعمال‌شده: {appliedCodes.join(' ، ')}</p>
              )}
            </div>

            <Link to="/checkout" className="btn-primary mt-4 w-full">
              <Icon name="check-circle" className="h-4 w-4" />
              ادامه فرایند و ثبت سفارش
            </Link>
            <Link to="/catalog" className="btn-ghost mt-2 w-full">
              <Icon name="plus" className="h-4 w-4" />
              افزودن کالای بیشتر
            </Link>
          </Card>

          <Card className="bg-ink-50/70 dark:bg-ink-800/40">
            <p className="mb-2 text-[12px] font-extrabold">روش‌های تسویه قابل استفاده</p>
            <div className="space-y-1.5 text-[11.5px]">
              {[
                ['نقدی (۳٪ تخفیف)', true],
                ['اعتباری ۳۰ روزه', !!customer && customer.creditLimit - customer.creditUsed >= breakdown.grandTotal],
                ['چک ۴۵ روزه', customer?.tier === 'VIP' || customer?.tier === 'A'],
                ['اقساطی', false],
              ].map(([label, ok]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className={ok ? '' : 'text-ink-400 line-through'}>{label}</span>
                  {ok ? <Icon name="check-circle" className="h-4 w-4 text-brand-600" /> : <Badge tone="neutral">نیاز به بررسی</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/** نمایش درصد تخفیف و برچسب پله یک خط سبد */
const LineMeta = ({ line }: { line: { basePrice: number; unitPrice: number; tierLabel: string } }) => {
  const pct = line.basePrice > 0 ? Math.round(((line.basePrice - line.unitPrice) / line.basePrice) * 1000) / 10 : 0;
  if (pct <= 0) return <Badge tone="neutral">{line.tierLabel}</Badge>;
  return (
    <span className="flex items-center gap-1.5">
      <Badge tone="success">{percentFa(pct)} تخفیف پله‌ای</Badge>
      <span className="text-[10.5px] text-ink-400">{line.tierLabel}</span>
    </span>
  );
};

const Row = ({ label, value, tone, big }: { label: string; value: string; tone?: 'success'; big?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className={big ? 'text-[12.5px] font-extrabold' : 'text-ink-500 dark:text-ink-400'}>{label}</span>
    <span
      className={`num ${big ? 'text-[16px] font-extrabold text-brand-700 dark:text-brand-300' : tone === 'success' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold'}`}
    >
      {value} {!big && <span className="text-[10.5px] text-ink-400">تومان</span>}
    </span>
  </div>
);

export default Cart;
