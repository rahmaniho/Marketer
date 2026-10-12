import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Card, Field, Modal, SectionTitle, Switch, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Proforma } from '@/components/Proforma';
import { elementToPdf } from '@/lib/pdf';
import { computeCart } from '@/lib/pricing';
import { addDays, faNum, jalaliDate, toman } from '@/lib/format';
import { useOffers, useProducts, useStore } from '@/store/useStore';
import type { Order, PaymentMethod } from '@/lib/types';

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; description: string; icon: string; needsCredit?: boolean }[] = [
  { id: 'cash', label: 'نقدی هنگام تحویل', description: '۳٪ تخفیف نقدی روی کل سبد اعمال می‌شود.', icon: 'wallet' },
  { id: 'online', label: 'پرداخت آنلاین', description: 'درگاه بانکی شبیه‌سازی‌شده — بدون اتصال واقعی.', icon: 'card' },
  { id: 'credit', label: 'خرید اعتباری', description: 'استفاده از سقف اعتبار فروشگاه تا ۳۰ روز.', icon: 'receipt', needsCredit: true },
  { id: 'cheque', label: 'چک ۴۵ روزه', description: 'مخصوص مشتریان سطح A و VIP.', icon: 'signature', needsCredit: true },
  { id: 'installment', label: 'اقساطی ۳ ماهه', description: 'پرداخت در سه قسط مساوی با تأیید مدیریت.', icon: 'calculator' },
];

const SLOTS = ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸', '۱۸ تا ۲۱'];

const Checkout = () => {
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cashPayment = useStore((s) => s.cashPayment);
  const setCashPayment = useStore((s) => s.setCashPayment);
  const placeOrder = useStore((s) => s.placeOrder);
  const clearCart = useStore((s) => s.clearCart);
  const settings = useStore((s) => s.settings);
  const contracts = useStore((s) => s.contractsExtra);
  const products = useProducts();
  const offers = useOffers();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState('address');
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [contact, setContact] = useState(customer?.ownerName ?? '');
  const [mobile, setMobile] = useState(customer?.mobile ?? '');
  const [notes, setNotes] = useState('');
  const [dayOffset, setDayOffset] = useState(2);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [needInvoice, setNeedInvoice] = useState(true);
  const [temperature, setTemperature] = useState(true);
  const proformaRef = useRef<HTMLDivElement>(null);

  const breakdown = useMemo(
    () =>
      computeCart({
        lines: cart,
        offers,
        customer,
        contracts,
        taxPercent: settings.taxPercent,
        freeShippingMin: settings.freeShippingMin,
        shippingCost: settings.shippingCost,
        cashPayment: payment === 'cash' || cashPayment,
        isFirstOrder: false,
      }),
    [cart, offers, customer, contracts, settings, payment, cashPayment],
  );

  const creditAvailable = (customer?.creditLimit ?? 0) - (customer?.creditUsed ?? 0);

  const buildOrder = (method: PaymentMethod): Omit<Order, 'id' | 'code' | 'trackingCode'> => ({
    customerId: customer?.id ?? 'guest',
    customerName: customer?.storeName ?? 'مهمان دمو',
    city: customer?.city ?? 'تهران',
    address,
    items: cart.map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return {
        productId: l.productId,
        name: p?.name ?? '',
        brandName: p?.name ?? '',
        qty: l.qty,
        unit: p?.unit ?? 'کارتن',
        unitPrice: l.unitPrice,
        total: l.unitPrice * l.qty,
        tierLabel: l.tierLabel,
      };
    }),
    subtotal: breakdown.rawSubtotal,
    discountTotal: breakdown.discountTotal,
    taxAmount: breakdown.taxAmount,
    shippingCost: breakdown.shippingCost,
    grandTotal: breakdown.grandTotal,
    status: 'pending',
    paymentStatus: method === 'online' ? 'paid' : 'unpaid',
    paymentMethod: method,
    paidAmount: method === 'online' ? breakdown.grandTotal : 0,
    createdAt: new Date().toISOString(),
    deliveryDate: addDays(new Date(), dayOffset),
    deliverySlot: slot,
    channel: 'web',
    appliedOfferIds: [],
    trackingSteps: [],
    hasReturn: false,
    notes,
  });

  const submit = (method: PaymentMethod) => {
    const order = placeOrder(buildOrder(method));
    setPlaced(order);
    clearCart();
    toast(`سفارش ${order.code} با موفقیت ثبت شد`);
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <Icon name="check-circle" className="h-9 w-9" />
          </span>
          <h1 className="mt-3 text-lg font-extrabold">سفارش شما با موفقیت ثبت شد</h1>
          <p className="num mt-2 text-[12.5px] text-ink-500 dark:text-ink-400">
            کد سفارش: <span className="font-extrabold text-ink-800 dark:text-ink-200">{placed.code}</span> • کد رهگیری:{' '}
            <span className="font-extrabold text-ink-800 dark:text-ink-200">{placed.trackingCode}</span>
          </p>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3 text-[11.5px]">
            {[
              ['زمان تحویل', `${jalaliDate(placed.deliveryDate, 'weekday')} — ${placed.deliverySlot}`],
              ['مبلغ سفارش', `${toman(placed.grandTotal, false)} تومان`],
              ['روش تسویه', PAYMENT_OPTIONS.find((p) => p.id === placed.paymentMethod)?.label ?? ''],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <p className="text-ink-500 dark:text-ink-400">{l}</p>
                <p className="num mt-1 font-bold">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to={`/orders/${placed.id}`} className="btn-primary">
              <Icon name="location" className="h-4 w-4" />
              پیگیری سفارش
            </Link>
            <button className="btn-soft" onClick={() => elementToPdf(proformaRef.current!, `proforma-${placed.code}.pdf`, { title: `پیش‌فاکتور ${placed.code}` })}>
              <Icon name="download" className="h-4 w-4" />
              دریافت پیش‌فاکتور PDF
            </button>
            <Link to="/catalog" className="btn-ghost">
              ادامه خرید
            </Link>
          </div>

          <div className="fixed -right-[9999px] top-0 w-[820px]">
            <div ref={proformaRef} className="bg-white p-6">
              <Proforma order={placed} customer={customer ?? undefined} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Card className="text-center">
          <Icon name="cart" className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 text-[13px] font-extrabold">سبد خرید شما خالی است</p>
          <p className="mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">برای ثبت سفارش، ابتدا کالاهای موردنیاز را انتخاب کنید.</p>
          <Link to="/catalog" className="btn-primary mx-auto mt-4 w-fit">
            رفتن به کاتالوگ
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-lg font-extrabold">ثبت سفارش عمده</h1>
      <p className="mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
        سه مرحله ساده: اطلاعات تحویل، روش پرداخت و بازبینی نهایی سفارش
      </p>

      <div className="mt-4">
        <Tabs
          active={step}
          onChange={setStep}
          tabs={[
            { id: 'address', label: '۱. اطلاعات تحویل', icon: 'location' },
            { id: 'payment', label: '۲. روش پرداخت', icon: 'wallet' },
            { id: 'review', label: '۳. بازبینی و ثبت', icon: 'check-circle' },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          {step === 'address' && (
            <Card className="space-y-3">
              <SectionTitle title="اطلاعات تحویل سفارش" subtitle="آدرس انبار یا فروشگاه مقصد" icon="location" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="نام تحویل‌گیرنده" required>
                  <input value={contact} onChange={(e) => setContact(e.target.value)} className="input" />
                </Field>
                <Field label="شماره تماس" required>
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="input num" dir="ltr" />
                </Field>
              </div>
              <Field label="آدرس کامل تحویل" required hint="شامل شهر، خیابان، پلاک و نشانه‌های محلی">
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="input" />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="روز تحویل">
                  <select value={dayOffset} onChange={(e) => setDayOffset(Number(e.target.value))} className="select">
                    {[1, 2, 3, 5].map((d) => (
                      <option key={d} value={d}>
                        {jalaliDate(addDays(new Date(), d), 'weekday')}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="بازه ساعتی تحویل">
                  <select value={slot} onChange={(e) => setSlot(e.target.value)} className="select">
                    {SLOTS.map((s) => (
                      <option key={s} value={s}>
                        ساعت {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Switch checked={needInvoice} onChange={setNeedInvoice} label="صدور فاکتور رسمی" description="ارسال به سامانه مودیان" />
                <Switch checked={temperature} onChange={setTemperature} label="ارسال با خودروی یخچال‌دار" description="برای اقلام لبنی و پروتئینی" />
              </div>
              <Field label="توضیحات برای انبار و راننده">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" placeholder="مثلاً: تحویل فقط قبل از ساعت ۱۲ — تماس قبل از رسیدن" />
              </Field>
              <button className="btn-primary w-full" onClick={() => setStep('payment')}>
                مرحله بعد: روش پرداخت
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
            </Card>
          )}

          {step === 'payment' && (
            <Card className="space-y-3">
              <SectionTitle title="روش تسویه" subtitle="شرایط اعتباری بر پایه پرونده و سطح مشتری" icon="wallet" />
              <div className="grid gap-2.5 sm:grid-cols-2">
                {PAYMENT_OPTIONS.map((p) => {
                  const disabled = p.needsCredit && creditAvailable < breakdown.grandTotal;
                  return (
                    <button
                      key={p.id}
                      disabled={disabled}
                      onClick={() => {
                        setPayment(p.id);
                        setCashPayment(p.id === 'cash');
                      }}
                      className={`rounded-xl border p-3 text-right transition ${
                        payment === p.id ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-900/20' : 'border-ink-200 hover:border-brand-300 dark:border-ink-700'
                      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon name={p.icon} className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                        <span className="text-[12.5px] font-extrabold">{p.label}</span>
                      </span>
                      <p className="mt-1.5 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{p.description}</p>
                      {disabled && <Badge tone="danger" className="mt-2">اعتبار کافی نیست</Badge>}
                    </button>
                  );
                })}
              </div>

              <Card className="bg-ink-50/70 dark:bg-ink-800/40">
                <p className="num text-[11.5px] leading-6">
                  سقف اعتبار فروشگاه شما: <span className="font-extrabold">{toman(customer?.creditLimit ?? 0, false)} تومان</span> • مصرف‌شده:{' '}
                  <span className="font-extrabold">{toman(customer?.creditUsed ?? 0, false)} تومان</span> • قابل استفاده:{' '}
                  <span className="font-extrabold text-brand-700 dark:text-brand-300">{toman(Math.max(0, creditAvailable), false)} تومان</span>
                </p>
              </Card>

              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setStep('address')}>
                  <Icon name="chevron-right" className="h-4 w-4" />
                  مرحله قبل
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    if (payment === 'online') {
                      setGatewayOpen(true);
                      return;
                    }
                    setStep('review');
                  }}
                >
                  ادامه
                  <Icon name="chevron-left" className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )}

          {step === 'review' && (
            <Card className="space-y-3">
              <SectionTitle title="بازبینی نهایی سفارش" subtitle="پیش‌فاکتور رسمی قابل چاپ و دانلود" icon="receipt" />

              <div className="grid gap-2.5 sm:grid-cols-2 text-[11.5px]">
                {[
                  ['تحویل‌گیرنده', contact],
                  ['موبایل', mobile],
                  ['شهر', customer?.city ?? 'تهران'],
                  ['زمان تحویل', `${jalaliDate(addDays(new Date(), dayOffset), 'weekday')} — ساعت ${slot}`],
                  ['روش تسویه', PAYMENT_OPTIONS.find((p) => p.id === payment)?.label ?? ''],
                  ['فاکتور رسمی', needInvoice ? 'صادر می‌شود' : 'صادر نمی‌شود'],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                    <p className="text-ink-500 dark:text-ink-400">{l}</p>
                    <p className="num mt-0.5 font-bold">{v}</p>
                  </div>
                ))}
              </div>

              <Field label="آدرس تحویل">
                <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11.5px] leading-6 dark:bg-ink-800/60">{address || 'آدرسی ثبت نشده است'}</p>
              </Field>

              <div className="overflow-hidden rounded-xl2 border border-ink-200 dark:border-ink-700">
                <div className="overflow-x-auto">
                  <table className="table-basic min-w-[560px]">
                    <thead>
                      <tr>
                        <th>کالا</th>
                        <th>تعداد</th>
                        <th>قیمت واحد</th>
                        <th>پله قیمتی</th>
                        <th>جمع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((l) => {
                        const p = products.find((x) => x.id === l.productId);
                        return (
                          <tr key={l.productId}>
                            <td className="font-semibold">{p?.name}</td>
                            <td className="num">
                              {faNum(l.qty)} {p?.unit}
                            </td>
                            <td className="num">{toman(l.unitPrice, false)}</td>
                            <td className="text-[11px]">{l.tierLabel}</td>
                            <td className="num font-bold">{toman(l.unitPrice * l.qty, false)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" onClick={() => setStep('payment')}>
                  <Icon name="chevron-right" className="h-4 w-4" />
                  مرحله قبل
                </button>
                <button className="btn-soft" onClick={() => elementToPdf(proformaRef.current!, 'proforma.pdf', { title: 'پیش‌فاکتور' })}>
                  <Icon name="download" className="h-4 w-4" />
                  دانلود پیش‌فاکتور PDF
                </button>
                <button className="btn-primary flex-1" onClick={() => submit(payment)}>
                  <Icon name="check" className="h-4 w-4" />
                  ثبت نهایی سفارش
                </button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <SectionTitle title="خلاصه پرداخت" icon="calculator" />
            <div className="space-y-2 text-[12px]">
              <Line label="جمع کالاها" value={breakdown.rawSubtotal} />
              {breakdown.discountTotal > 0 && <Line label="تخفیف‌ها" value={-breakdown.discountTotal} tone="success" />}
              <Line label={`مالیات (${faNum(settings.taxPercent)}٪)`} value={breakdown.taxAmount} />
              <Line label="هزینه ارسال" value={breakdown.shippingCost} free={breakdown.shippingCost === 0} />
              <div className="border-t border-dashed border-ink-200 pt-2.5 dark:border-ink-700">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-extrabold">مبلغ نهایی</span>
                  <span className="num text-[16px] font-extrabold text-brand-700 dark:text-brand-300">{toman(breakdown.grandTotal, false)} تومان</span>
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px] text-ink-500 dark:text-ink-400">
              <p className="num">تعداد اقلام: {faNum(breakdown.itemCount)} کد کالا</p>
              <p className="num">تعداد کل: {faNum(breakdown.cartonCount)} واحد</p>
              <p className="num">پیش‌فاکتور شامل تمام تخفیف‌های اعمال‌شده است.</p>
            </div>
          </Card>

          <Card className="bg-brand-50/60 dark:bg-brand-900/20">
            <p className="text-[12px] font-extrabold text-brand-900 dark:text-brand-100">سود شما از این سفارش</p>
            <p className="num mt-1 text-[11.5px] leading-6 text-brand-800 dark:text-brand-200">
              با خرید از پلتفرم بازارعمده، حذف واسطه‌ها و ویزیت فیزیکی، به‌طور میانگین{' '}
              <span className="font-extrabold">۱۸٫۴٪</span> نسبت به خرید سنتی صرفه‌جویی می‌کنید. بخشی از این صرفه‌جویی
              مستقیماً در قالب تخفیف پله‌ای و کمپین‌ها به سبد شما اعمال شده است.
            </p>
          </Card>

          <div className="fixed -right-[9999px] top-0 w-[820px]">
            <div ref={proformaRef} className="bg-white p-6">
              <Proforma
                order={{
                  ...(buildOrder(payment) as Order),
                  id: 'preview',
                  code: 'PREVIEW-000',
                  trackingCode: '—',
                }}
                customer={customer ?? undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={gatewayOpen}
        onClose={() => setGatewayOpen(false)}
        title="درگاه پرداخت بانکی (شبیه‌سازی)"
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setGatewayOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setGatewayOpen(false);
                submit('online');
              }}
            >
              <Icon name="card" className="h-4 w-4" />
              پرداخت موفق (نمایشی)
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[12px]">
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
            <p className="num">
              مبلغ قابل پرداخت: <span className="font-extrabold">{toman(breakdown.grandTotal, false)} تومان</span>
            </p>
            <p className="num mt-1 text-[11px] text-ink-500 dark:text-ink-400">شماره سفارش موقت: TEMP-{Math.floor(Math.random() * 90000 + 10000)}</p>
          </div>
          <Field label="شماره کارت">
            <input className="input num" dir="ltr" defaultValue="6104 3378 0000 0000" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="ماه">
              <input className="input num" dir="ltr" defaultValue="06" />
            </Field>
            <Field label="سال">
              <input className="input num" dir="ltr" defaultValue="08" />
            </Field>
            <Field label="CVV2">
              <input className="input num" dir="ltr" defaultValue="123" />
            </Field>
          </div>
          <p className="text-[10.5px] leading-5 text-ink-400">
            این درگاه کاملاً نمایشی است؛ هیچ تراکنش بانکی واقعی انجام نمی‌شود و اطلاعات کارت ارسال یا ذخیره نمی‌گردد.
          </p>
        </div>
      </Modal>

      <div className="mt-4">
        <Card className="bg-ink-50/70 dark:bg-ink-800/40">
          <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
            <span className="font-bold">توجه: </span>
            ثبت سفارش در این دمو به‌صورت کامل در حافظه مرورگر (localStorage) ذخیره می‌شود؛ سفارش شما در صفحه
            «سفارش‌های من» و در پنل مدیریت قابل مشاهده و پیگیری است.
          </p>
        </Card>
      </div>
    </div>
  );
};

const Line = ({ label, value, tone, free }: { label: string; value: number; tone?: 'success'; free?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-ink-500 dark:text-ink-400">{label}</span>
    <span className={`num font-bold ${tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
      {free ? 'رایگان' : `${value < 0 ? '− ' : ''}${toman(Math.abs(value), false)} تومان`}
    </span>
  </div>
);

export default Checkout;
