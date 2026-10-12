import { useMemo, useRef, useState } from 'react';
import { AdminPage, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, SectionTitle, Stat, Tabs, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { elementToPdf, printElement } from '@/lib/pdf';
import { exportCsv, faNum, jalaliDate, toman, tomanShort } from '@/lib/format';
import { useBrands, useCustomers, useOrders, useProducts } from '@/store/useStore';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/pages/Orders';
import { categoryById, rootCategories } from '@/data/categories';
import { suppliers } from '@/data/ops';

type ReportKey = 'sales' | 'products' | 'customers' | 'brands' | 'financial' | 'logistics';

const REPORTS: { id: ReportKey; label: string; icon: string; description: string; columns: string[] }[] = [
  { id: 'sales', label: 'فروش و سفارش‌ها', icon: 'chart', description: 'فهرست سفارش‌ها با مبالغ، تخفیف، مالیات و وضعیت تسویه', columns: ['کد', 'تاریخ', 'مشتری', 'شهر', 'اقلام', 'جمع کالا', 'تخفیف', 'مالیات', 'مبلغ کل', 'وضعیت', 'پرداخت'] },
  { id: 'products', label: 'فروش کالا', icon: 'package', description: 'مقدار و ارزش فروش هر کد کالا به همراه موجودی فعلی', columns: ['کالا', 'SKU', 'دسته', 'تعداد فروش', 'ارزش فروش', 'موجودی', 'سهم'] },
  { id: 'customers', label: 'عملکرد مشتریان', icon: 'users', description: 'LTV، میانگین سفارش، اعتبار و ریسک ریزش هر مشتری', columns: ['فروشگاه', 'شهر', 'سطح', 'تعداد سفارش', 'ارزش خرید', 'اعتبار مصرفی', 'LTV', 'ریسک'] },
  { id: 'brands', label: 'عملکرد برندها', icon: 'award', description: 'سهم برندها از فروش و تعداد کد کالای فعال', columns: ['برند', 'کشور', 'کد کالا', 'تعداد فروش', 'ارزش فروش', 'سهم'] },
  { id: 'financial', label: 'مالی و مطالبات', icon: 'wallet', description: 'مطالبات معوق، تسویه‌های نقدی و چک‌های در جریان', columns: ['کد سفارش', 'مشتری', 'مبلغ کل', 'پرداخت‌شده', 'مانده', 'روش تسویه', 'وضعیت', 'سررسید'] },
  { id: 'logistics', label: 'لجستیک و ارسال', icon: 'truck', description: 'هزینه و عملکرد حمل، تأمین‌کنندگان و نرخ تحویل', columns: ['تأمین‌کننده', 'کشور', 'نرخ تأمین', 'زمان تحویل', 'حجم ماهانه', 'وضعیت'] },
];

const ReportsAdmin = () => {
  const orders = useOrders();
  const products = useProducts();
  const customers = useCustomers();
  const brands = useBrands();
  const { toast } = useToast();
  const [active, setActive] = useState<ReportKey>('sales');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const meta = REPORTS.find((r) => r.id === active)!;

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const t = q.trim();
        if (from && new Date(o.createdAt) < new Date(from)) return false;
        if (to && new Date(o.createdAt) > new Date(to)) return false;
        if (t && !o.code.includes(t) && !o.customerName.includes(t) && !o.city.includes(t)) return false;
        return true;
      }),
    [orders, q, from, to],
  );

  const rows = useMemo<(string | number)[][]>(() => {
    switch (active) {
      case 'sales':
        return filteredOrders.map((o) => [
          o.code,
          jalaliDate(o.createdAt),
          o.customerName,
          o.city,
          o.items.length,
          o.subtotal,
          o.discountTotal,
          o.taxAmount,
          o.grandTotal,
          ORDER_STATUS_META[o.status].label,
          PAYMENT_STATUS_META[o.paymentStatus].label,
        ]);
      case 'products': {
        const sold = new Map<string, { qty: number; amount: number }>();
        filteredOrders.forEach((o) =>
          o.items.forEach((i) => {
            const cur = sold.get(i.productId) ?? { qty: 0, amount: 0 };
            cur.qty += i.qty;
            cur.amount += i.total;
            sold.set(i.productId, cur);
          }),
        );
        const total = [...sold.values()].reduce((s, v) => s + v.amount, 0) || 1;
        return [...sold.entries()]
          .map(([id, v]) => {
            const p = products.find((x) => x.id === id);
            return [p?.name ?? id, p?.sku ?? '—', categoryById(p?.categoryId ?? '')?.name ?? '—', v.qty, v.amount, p?.stock ?? 0, `${Math.round((v.amount / total) * 100)}٪`];
          })
          .sort((a, b) => Number(b[4]) - Number(a[4]));
      }
      case 'customers':
        return customers.map((c) => {
          const mine = filteredOrders.filter((o) => o.customerId === c.id);
          return [
            c.storeName,
            c.city,
            c.tier,
            mine.length,
            mine.reduce((s, o) => s + o.grandTotal, 0),
            c.creditUsed,
            c.ltv,
            `${c.churnRisk}٪`,
          ];
        });
      case 'brands': {
        const map = new Map<string, { qty: number; amount: number }>();
        filteredOrders.forEach((o) =>
          o.items.forEach((i) => {
            const p = products.find((x) => x.id === i.productId);
            if (!p) return;
            const cur = map.get(p.brandId) ?? { qty: 0, amount: 0 };
            cur.qty += i.qty;
            cur.amount += i.total;
            map.set(p.brandId, cur);
          }),
        );
        const total = [...map.values()].reduce((s, v) => s + v.amount, 0) || 1;
        return [...map.entries()]
          .map(([id, v]) => {
            const b = brands.find((x) => x.id === id);
            return [b?.name ?? id, b?.country ?? '—', products.filter((p) => p.brandId === id).length, v.qty, v.amount, `${Math.round((v.amount / total) * 100)}٪`];
          })
          .sort((a, b) => Number(b[4]) - Number(a[4]));
      }
      case 'financial':
        return filteredOrders.map((o) => [
          o.code,
          o.customerName,
          o.grandTotal,
          o.paidAmount,
          o.grandTotal - o.paidAmount,
          o.paymentMethod,
          PAYMENT_STATUS_META[o.paymentStatus].label,
          jalaliDate(o.deliveryDate),
        ]);
      case 'logistics':
        return suppliers.map((s) => [s.name, s.country, `${s.fillRate}٪`, `${s.leadTimeDays} روز`, s.monthlyVolume, s.status === 'active' ? 'فعال' : s.status === 'review' ? 'در بازبینی' : 'معلق']);
      default:
        return [];
    }
  }, [active, filteredOrders, products, customers, brands]);

  const activeSummary = useMemo(() => {
    if (active === 'sales' || active === 'financial') {
      const total = filteredOrders.reduce((s, o) => s + o.grandTotal, 0);
      const paid = filteredOrders.reduce((s, o) => s + o.paidAmount, 0);
      return [
        { label: 'تعداد رکورد', value: faNum(filteredOrders.length) },
        { label: 'ارزش کل', value: tomanShort(total) },
        { label: 'مانده مطالبات', value: tomanShort(total - paid) },
        { label: 'میانگین سفارش', value: tomanShort(total / Math.max(1, filteredOrders.length)) },
      ];
    }
    return [
      { label: 'تعداد رکورد', value: faNum(rows.length) },
      { label: 'بازه گزارش', value: from || to ? `${from || '—'} تا ${to || '—'}` : 'کل دوره' },
      { label: 'منبع داده', value: 'Mock / localStorage' },
      { label: 'آخرین بروزرسانی', value: jalaliDate(new Date()) },
    ];
  }, [active, filteredOrders, rows.length, from, to]);

  const doExport = () => {
    exportCsv([meta.columns, ...rows], `${active}-report.csv`);
    toast('خروجی CSV با موفقیت دانلود شد');
  };

  const doPdf = async () => {
    if (!reportRef.current) return;
    setBusy(true);
    await elementToPdf(reportRef.current, `${active}-report.pdf`, { orientation: 'l', title: meta.label });
    setBusy(false);
    toast('گزارش PDF ساخته شد');
  };

  const weeklyTrend = useMemo(() => {
    const labels = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    return labels.map((label, i) => ({
      label,
      orders: filteredOrders.filter((_, idx) => idx % 6 === i).length,
      returns: 0,
    }));
  }, [filteredOrders]);

  const maxOrders = Math.max(...weeklyTrend.map((w) => w.orders), 1);

  return (
    <AdminPage
      title="گزارش‌گیری و خروجی"
      subtitle="شش گزارش کلیدی با خروجی CSV، چاپ و PDF — تمام محاسبات سمت مرورگر"
      icon="sheet"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => printElement(reportRef.current!, meta.label)}>
            <Icon name="print" className="h-4 w-4" />
            چاپ
          </button>
          <button className="btn-ghost btn-sm" onClick={doExport}>
            <Icon name="sheet" className="h-4 w-4" />
            CSV
          </button>
          <button className="btn-primary btn-sm" onClick={doPdf} disabled={busy}>
            <Icon name="download" className="h-4 w-4" />
            {busy ? 'در حال ساخت…' : 'PDF'}
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {activeSummary.map((s) => (
          <Stat key={s.label} label={s.label} value={s.value} icon="chart" />
        ))}
      </div>

      <Tabs active={active} onChange={(id) => setActive(id as ReportKey)} tabs={REPORTS.map((r) => ({ id: r.id, label: r.label, icon: r.icon }))} />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <QuickSearch value={q} onChange={setQ} placeholder="فیلتر سریع: کد سفارش، مشتری یا شهر…" />
          <Field label="از تاریخ">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input num" />
          </Field>
          <Field label="تا تاریخ">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input num" />
          </Field>
          <button className="btn-ghost btn-sm" onClick={() => { setQ(''); setFrom(''); setTo(''); }}>
            <Icon name="refresh" className="h-3.5 w-3.5" />
            پاک‌کردن فیلترها
          </button>
        </div>
        <p className="text-[11.5px] text-ink-500 dark:text-ink-400">{meta.description}</p>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle title="توزیع رکوردها بر پایه ماه" subtitle="نمای سریع توزیع داده گزارش" icon="chart" />
          <div className="space-y-2.5">
            {weeklyTrend.map((w) => (
              <div key={w.label}>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span>{w.label}</span>
                  <span className="num text-ink-500 dark:text-ink-400">{faNum(w.orders)} رکورد</span>
                </div>
                <MiniBar value={w.orders} max={maxOrders} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="خروجی‌های آماده" subtitle="گزارش‌های پرکاربرد" icon="download" />
          <div className="space-y-2">
            {[
              ['گزارش فروش ماهانه مدیریت', 'sales'],
              ['صورت‌حساب مشتریان کلیدی', 'customers'],
              ['گزارش موجودی و انقضا', 'products'],
              ['گزارش مطالبات و چک‌ها', 'financial'],
            ].map(([label, key]) => (
              <button
                key={label}
                className="flex w-full items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-[11.5px] transition hover:border-brand-400 dark:border-ink-700"
                onClick={() => {
                  setActive(key as ReportKey);
                  toast(`گزارش «${label}» انتخاب شد — برای دریافت فایل، دکمه CSV یا PDF را بزنید.`);
                }}
              >
                <span className="font-semibold">{label}</span>
                <Icon name="download" className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ناحیه چاپ/PDF */}
      <div ref={reportRef} className="card p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-ink-200 pb-3 dark:border-ink-700">
          <div>
            <h3 className="text-[15px] font-extrabold">گزارش {meta.label}</h3>
            <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
              پلتفرم بازارعمده — {meta.description} | تاریخ تهیه: {jalaliDate(new Date(), 'long')}
            </p>
          </div>
          <Badge tone="brand">تعداد رکورد: {faNum(rows.length)}</Badge>
        </div>

        <TableWrap>
          <thead>
            <tr>
              {meta.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 60).map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={typeof cell === 'number' && cell > 10_000 ? 'num' : ''}>
                    {typeof cell === 'number' && cell > 10_000 ? toman(cell, false) : cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={meta.columns.length} className="py-10 text-center text-[12px] text-ink-400">
                  داده‌ای برای این بازه یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>

        {rows.length > 60 && (
          <p className="num mt-3 text-[11px] text-ink-400">
            نمایش ۶۰ رکورد اول از {faNum(rows.length)} رکورد — فایل CSV شامل تمام رکوردها است.
          </p>
        )}

        <div className="mt-4 grid gap-2 border-t border-ink-200 pt-3 text-[11px] text-ink-500 sm:grid-cols-3 dark:border-ink-700 dark:text-ink-400">
          <span>سامانه گزارش‌گیری بازارعمده — نسخه دمو</span>
          <span className="num">تعداد کد کالای فعال: {faNum(products.length)}</span>
          <span>طراحی و توسعه: کارن سافت — Karen-soft.ir</span>
        </div>
      </div>

      <Card className="bg-ink-50/70 dark:bg-ink-800/40">
        <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
          <span className="font-bold">نکته: </span>
          در نسخه دمو تمام گزارش‌ها روی داده Mock و سفارش‌های ثبت‌شده در مرورگر ساخته می‌شوند. در نسخه عملیاتی،
          همین گزارش‌ها از پایگاه داده و انبار داده (OLAP) خوانده و امکان زمان‌بندی ارسال خودکار گزارش با ایمیل و
          پیام‌رسان فراهم می‌شود.
        </p>
      </Card>
    </AdminPage>
  );
};

export default ReportsAdmin;
