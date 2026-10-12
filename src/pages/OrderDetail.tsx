import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Card, DemoNote, EmptyState, Modal, SectionTitle, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Proforma } from '@/components/Proforma';
import { QrCode } from '@/components/QrCode';
import { elementToPdf, printElement } from '@/lib/pdf';
import { faNum, jalaliDate, jalaliDateTime, timeAgo, toman } from '@/lib/format';
import { useOrders, useProducts, useStore } from '@/store/useStore';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from './Orders';
import { drivers } from '@/data/ops';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = useOrders();
  const products = useProducts();
  const customer = useStore((s) => s.customer);
  const addToCart = useStore((s) => s.addToCart);
  const addTicket = useStore((s) => s.addTicket);
  const logAction = useStore((s) => s.logAction);
  const { toast } = useToast();
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('آسیب بسته‌بندی در حمل');
  const [podOpen, setPodOpen] = useState(false);
  const [signature, setSignature] = useState('');
  const proformaRef = useRef<HTMLDivElement>(null);

  const order = useMemo(() => orders.find((o) => o.id === id || o.code === id), [orders, id]);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon="package"
          title="سفارش یافت نشد"
          description="ممکن است سفارش حذف شده باشد یا نشانی صفحه اشتباه باشد."
          action={
            <Link to="/orders" className="btn-primary">
              بازگشت به سفارش‌های من
            </Link>
          }
        />
      </div>
    );
  }

  const driver = drivers.find((d) => d.id === order.driverId) ?? drivers[0];
  const progress = ORDER_STATUS_META[order.status];
  const steps = order.trackingSteps.length
    ? order.trackingSteps
    : [
        { title: 'ثبت سفارش', at: order.createdAt, done: true, note: 'سفارش در سیستم ثبت شد' },
        { title: 'تأیید فروش', at: order.createdAt, done: true, note: 'موجودی و اعتبار بررسی شد' },
        { title: 'آماده‌سازی در انبار', at: order.createdAt, done: false, note: 'برداشت پالت و بسته‌بندی' },
        { title: 'بارگیری و ارسال', at: order.deliveryDate, done: false, note: 'تخصیص خودرو و بارنامه' },
        { title: 'تحویل به مشتری', at: order.deliveryDate, done: false, note: 'ثبت امضای دیجیتال تحویل' },
      ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button className="btn-ghost btn-sm mb-2" onClick={() => navigate('/orders')}>
            <Icon name="chevron-right" className="h-4 w-4" />
            بازگشت به سفارش‌های من
          </button>
          <h1 className="num text-lg font-extrabold">سفارش {order.code}</h1>
          <p className="mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
            ثبت‌شده در {jalaliDateTime(order.createdAt)} • {timeAgo(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost btn-sm" onClick={() => elementToPdf(proformaRef.current!, `invoice-${order.code}.pdf`, { title: `فاکتور ${order.code}` })}>
            <Icon name="download" className="h-4 w-4" />
            دانلود PDF
          </button>
          <button className="btn-soft btn-sm" onClick={() => printElement(proformaRef.current!, `فاکتور ${order.code}`)}>
            <Icon name="print" className="h-4 w-4" />
            چاپ فاکتور
          </button>
          <button
            className="btn-primary btn-sm"
            onClick={() => {
              order.items.forEach((i) => addToCart(i.productId, i.qty));
              toast('تمام اقلام این سفارش به سبد خرید افزوده شد');
              navigate('/cart');
            }}
          >
            <Icon name="repeat" className="h-4 w-4" />
            سفارش مجدد همین اقلام
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-3">
          <Card>
            <SectionTitle title="وضعیت سفارش" subtitle={`آخرین بروزرسانی: ${timeAgo(order.createdAt)}`} icon={progress.icon} />
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={progress.tone} icon={progress.icon}>
                {progress.label}
              </Badge>
              <Badge tone={PAYMENT_STATUS_META[order.paymentStatus].tone}>{PAYMENT_STATUS_META[order.paymentStatus].label}</Badge>
              <span className="num text-[11.5px] text-ink-500 dark:text-ink-400">کد رهگیری: {order.trackingCode}</span>
            </div>

            <div className="mt-4 space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] ${s.done ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-500 dark:bg-ink-700 dark:text-ink-300'}`}>
                      {s.done ? <Icon name="check" className="h-4 w-4" /> : faNum(i + 1)}
                    </span>
                    {i < steps.length - 1 && <span className={`mt-1 h-8 w-0.5 ${s.done ? 'bg-brand-300' : 'bg-ink-200 dark:bg-ink-700'}`} />}
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <p className={`text-[12.5px] font-bold ${s.done ? '' : 'text-ink-400'}`}>{s.title}</p>
                    <p className="text-[10.5px] text-ink-400">
                      {s.note} — {jalaliDateTime(s.at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="اقلام سفارش" subtitle={`${faNum(order.items.length)} قلم کالا`} icon="package" />
            <TableWrap>
              <thead>
                <tr>
                  <th>کالا</th>
                  <th>پله قیمتی</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.productId}>
                    <td>
                      <Link to={`/product/${it.productId}`} className="font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                        {it.name}
                      </Link>
                      <span className="block text-[10.5px] text-ink-400">{it.brandName}</span>
                    </td>
                    <td className="text-[11px]">{it.tierLabel}</td>
                    <td className="num">
                      {faNum(it.qty)} {it.unit}
                    </td>
                    <td className="num">{toman(it.unitPrice, false)}</td>
                    <td className="num font-bold">{toman(it.total, false)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <div className="mt-4 space-y-2 border-t border-dashed border-ink-200 pt-3 text-[12px] dark:border-ink-700">
              {[
                ['جمع کالاها', order.subtotal],
                ['تخفیف', -order.discountTotal],
                ['مالیات بر ارزش افزوده', order.taxAmount],
                ['هزینه ارسال', order.shippingCost],
              ].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className={`num font-bold ${Number(v) < 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {Number(v) === 0 && l === 'هزینه ارسال' ? 'رایگان' : `${Number(v) < 0 ? '− ' : ''}${toman(Math.abs(Number(v)), false)} تومان`}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-dashed border-ink-200 pt-2.5 dark:border-ink-700">
                <span className="text-[12.5px] font-extrabold">مبلغ کل سفارش</span>
                <span className="num text-[15px] font-extrabold text-brand-700 dark:text-brand-300">{toman(order.grandTotal, false)} تومان</span>
              </div>
              <p className="num text-[11px] text-ink-500 dark:text-ink-400">
                پرداخت‌شده: {toman(order.paidAmount, false)} تومان • مانده: {toman(order.grandTotal - order.paidAmount, false)} تومان
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle title="فاکتور رسمی" subtitle="قابل چاپ، دانلود PDF و ارسال به سامانه مودیان" icon="receipt" />
            <div className="overflow-hidden rounded-xl2 border border-ink-200 dark:border-ink-700">
              <div className="max-h-[520px] overflow-auto bg-white p-3">
                <Proforma ref={proformaRef} order={order} customer={customer} kind="invoice" />
              </div>
            </div>
            <DemoNote>
              پیش‌فاکتور و فاکتور این صفحه به‌صورت HTML ساخته و با ابزار مرورگر به PDF تبدیل می‌شوند؛ در نسخه عملیاتی
              همین سند به‌طور خودکار به سامانه مودیان و نرم‌افزار حسابداری مشتری ارسال می‌گردد.
            </DemoNote>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <SectionTitle title="اطلاعات تحویل" icon="truck" />
            <div className="space-y-2.5 text-[11.5px]">
              {[
                ['تحویل‌گیرنده', order.customerName],
                ['آدرس', order.address],
                ['شهر', order.city],
                ['زمان تحویل', `${jalaliDate(order.deliveryDate, 'weekday')} — ساعت ${order.deliverySlot}`],
                ['روش تسویه', order.paymentMethod === 'cash' ? 'نقدی' : order.paymentMethod === 'credit' ? 'اعتباری' : order.paymentMethod === 'cheque' ? 'چک' : order.paymentMethod === 'installment' ? 'اقساطی' : 'آنلاین'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="mt-0.5 font-bold leading-6">{v || '—'}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="راننده و خودرو" icon="bike" />
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl2 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name="bike" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-extrabold">{order.driverName ?? driver.name}</p>
                <p className="num text-[11px] text-ink-500 dark:text-ink-400">
                  {order.vehicle ?? driver.vehicle} • {driver.plate}
                </p>
                <p className="num text-[11px] text-ink-400">امتیاز راننده: {faNum(driver.rating, 1)} از ۵</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-soft btn-sm flex-1" onClick={() => toast('تماس نمایشی با راننده برقرار شد')}>
                <Icon name="phone" className="h-3.5 w-3.5" />
                تماس با راننده
              </button>
              <button className="btn-ghost btn-sm flex-1" onClick={() => toast('موقعیت زنده خودرو در نسخه عملیاتی نمایش داده می‌شود (نمایشی)')}>
                <Icon name="map" className="h-3.5 w-3.5" />
                رهگیری زنده
              </button>
            </div>
          </Card>

          <Card>
            <SectionTitle title="گواهی تحویل و امضای دیجیتال" icon="signature" />
            {order.podSigned ? (
              <div className="space-y-2">
                <Badge tone="success" icon="signature">
                  امضای دیجیتال ثبت شده است
                </Badge>
                <p className="text-[11px] leading-6 text-ink-500 dark:text-ink-400">
                  گیرنده: {order.podSignature ?? order.customerName} • زمان: {jalaliDateTime(order.deliveryDate)}
                </p>
              </div>
            ) : (
              <button className="btn-soft w-full" onClick={() => setPodOpen(true)}>
                <Icon name="signature" className="h-4 w-4" />
                ثبت امضای دیجیتال تحویل
              </button>
            )}
            <div className="mt-3 flex items-center justify-between rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <div>
                <p className="text-[11.5px] font-bold">کد QR سفارش</p>
                <p className="num text-[10.5px] text-ink-400">برای تأیید تحویل توسط راننده</p>
              </div>
              <QrCode value={`ORDER:${order.code}|TRACK:${order.trackingCode}`} size={92} />
            </div>
          </Card>

          <Card>
            <SectionTitle title="پشتیبانی سفارش" icon="lifebuoy" />
            <div className="space-y-2">
              <Link to="/chat" className="btn-ghost w-full">
                <Icon name="message" className="h-4 w-4" />
                گفت‌وگو با پشتیبانی
              </Link>
              <button className="btn-ghost w-full" onClick={() => setReturnOpen(true)}>
                <Icon name="undo" className="h-4 w-4" />
                ثبت درخواست مرجوعی
              </button>
              <button
                className="btn-ghost w-full"
                onClick={() => {
                  addTicket({
                    id: `tk-${Date.now()}`,
                    code: `TK-${Math.floor(Math.random() * 9000 + 1000)}`,
                    customerId: order.customerId,
                    customerName: order.customerName,
                    subject: `پیگیری سفارش ${order.code}`,
                    category: 'سفارش',
                    priority: 'normal',
                    status: 'open',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    channel: 'فرم سایت',
                    messages: [{ from: 'customer', name: order.customerName, text: `درخواست پیگیری سفارش ${order.code}`, at: new Date().toISOString() }],
                  });
                  toast('تیکت پشتیبانی برای این سفارش ثبت شد');
                }}
              >
                <Icon name="ticket" className="h-4 w-4" />
                ثبت تیکت پیگیری
              </button>
              <button className="btn-ghost w-full" onClick={() => toast('فاکتور از طریق پیامک و ایمیل ارسال شد (نمایشی)')}>
                <Icon name="share" className="h-4 w-4" />
                اشتراک‌گذاری فاکتور با مدیر مالی
              </button>
            </div>
          </Card>

          <Card className="bg-ink-50/70 dark:bg-ink-800/40">
            <p className="mb-2 text-[12px] font-extrabold">سود تخمینی این سفارش برای فروشگاه شما</p>
            <p className="num text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
              با نرخ مصرف‌کننده فعلی، سود ناخالص این سبد حدود{' '}
              <span className="font-extrabold text-brand-700 dark:text-brand-300">
                {toman(Math.round(order.grandTotal * 0.28), false)} تومان
              </span>{' '}
              برآورد می‌شود. این محاسبه نمایشی است و بر پایه اختلاف قیمت مصرف‌کننده و قیمت عمده انجام شده است.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title={`ثبت درخواست مرجوعی — ${order.code}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setReturnOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                logAction({
                  userId: 'c-demo',
                  userName: order.customerName,
                  roleId: 'operator',
                  action: 'ثبت درخواست مرجوعی',
                  entity: 'Order',
                  entityId: order.id,
                  detail: `دلیل: ${returnReason}`,
                  severity: 'warning',
                });
                toast('درخواست مرجوعی ثبت شد و در پنل مدیریت قابل بررسی است');
                setReturnOpen(false);
              }}
            >
              ثبت درخواست
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
            سیاست مرجوعی پلتفرم: تا ۴۸ ساعت پس از تحویل برای کالاهای آسیب‌دیده یا مغایرت دار. کالاهای فاسدشدنی
            باید در زمان تحویل بررسی شوند.
          </p>
          <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="select">
            {['آسیب بسته‌بندی در حمل', 'مغایرت تعداد تحویل‌شده', 'تاریخ انقضای نامناسب', 'کیفیت نامنطبق با نمونه', 'سفارش اشتباه'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <textarea rows={3} className="input" placeholder="توضیح تکمیلی و شماره بچ کالای معیوب…" />
        </div>
      </Modal>

      <Modal
        open={podOpen}
        onClose={() => setPodOpen(false)}
        title="ثبت گواهی تحویل و امضای دیجیتال"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setPodOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setPodOpen(false);
                setSignature('');
                toast('امضای دیجیتال تحویل ثبت شد (نمایشی)');
              }}
            >
              <Icon name="signature" className="h-4 w-4" />
              ثبت امضا
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
            نام تحویل‌گیرنده و بازه زمانی ثبت می‌شود؛ امضای دیجیتال در نسخه عملیاتی با مهر زمانی و هش امنیتی ذخیره
            می‌گردد.
          </p>
          <input value={signature} onChange={(e) => setSignature(e.target.value)} className="input" placeholder="نام و نام خانوادگی تحویل‌گیرنده" />
          <div className="flex h-28 items-center justify-center rounded-xl2 border border-dashed border-ink-300 text-[11px] text-ink-400 dark:border-ink-600">
            ناحیه رسم امضا (نمایشی) — در نسخه عملیاتی با قلم دیجیتال روی موبایل راننده ثبت می‌شود
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
