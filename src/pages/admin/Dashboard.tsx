import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AdminPage, EmptyRow, MiniBar } from '@/components/AdminUI';
import { Badge, Card, Progress, SectionTitle, Stat, TableWrap } from '@/components/ui';
import { CategoryPieChart, ChartCard, OrdersBarChart, SalesAreaChart } from '@/components/Charts';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, percentFa, timeAgo, toman, tomanShort } from '@/lib/format';
import { useBrands, useCustomers, useOrders, useProducts, useStore, useAuditLogs } from '@/store/useStore';
import { churnRiskList, insights } from '@/data/content';
import { ORDER_STATUS_META } from '@/pages/Orders';
import { rootCategories } from '@/data/categories';

const Dashboard = () => {
  const orders = useOrders();
  const products = useProducts();
  const customers = useCustomers();
  const brands = useBrands();
  const logs = useAuditLogs();
  const settings = useStore((s) => s.settings);

  const revenue = orders.reduce((s, o) => s + o.grandTotal, 0);
  const delivered = orders.filter((o) => o.status === 'delivered');
  const openOrders = orders.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.status));
  const unpaid = orders.filter((o) => o.paymentStatus !== 'paid');
  const lowStock = products.filter((p) => p.stock <= settings.lowStockThreshold);
  const todayOrders = orders.filter((o) => Date.now() - +new Date(o.createdAt) < 86400000);

  const monthly = useMemo(() => {
    const map = new Map<string, { sales: number; orders: number; returns: number }>();
    const labels = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    labels.forEach((l) => map.set(l, { sales: 0, orders: 0, returns: 0 }));
    orders.forEach((o, i) => {
      const label = labels[i % 6];
      const row = map.get(label)!;
      row.sales += o.grandTotal;
      row.orders += 1;
      if (o.hasReturn) row.returns += 1;
    });
    return labels.map((l) => ({ label: l, sales: map.get(l)!.sales, orders: map.get(l)!.orders, returns: map.get(l)!.returns }));
  }, [orders]);

  const categoryShare = useMemo(() => {
    return rootCategories
      .map((c) => {
        const ids = products.filter((p) => p.categoryId === c.id);
        const value = orders.reduce(
          (s, o) => s + o.items.filter((i) => ids.some((p) => p.id === i.productId)).reduce((x, i) => x + i.total, 0),
          0,
        );
        return { name: c.name, value };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [orders, products]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; amount: number }>();
    orders.forEach((o) =>
      o.items.forEach((i) => {
        const cur = map.get(i.productId) ?? { name: i.name, qty: 0, amount: 0 };
        cur.qty += i.qty;
        cur.amount += i.total;
        map.set(i.productId, cur);
      }),
    );
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [orders]);

  const topCustomers = useMemo(
    () => [...customers].sort((a, b) => b.ltv - a.ltv).slice(0, 6),
    [customers],
  );

  return (
    <AdminPage
      title="داشبورد تحلیلی فروش"
      subtitle={`مرور کلی پلتفرم — ${faNum(orders.length)} سفارش، ${faNum(products.length)} کد کالا، ${faNum(brands.length)} برند`}
      icon="chart"
      actions={
        <>
          <Link to="/admin/reports" className="btn-ghost btn-sm">
            <Icon name="sheet" className="h-4 w-4" />
            گزارش‌گیری
          </Link>
          <Link to="/admin/bi" className="btn-primary btn-sm">
            <Icon name="sparkles" className="h-4 w-4" />
            داشبورد هوشمند
          </Link>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="ارزش کل فروش" value={tomanShort(revenue)} icon="chart" delta="۱۲٪ رشد ماهانه" positive hint="مجموع سفارش‌های ثبت‌شده" />
        <Stat label="سفارش‌های باز" value={faNum(openOrders.length)} icon="package" tone="info" hint="در چرخه تأیید و ارسال" />
        <Stat label="مطالبات معوق" value={tomanShort(unpaid.reduce((s, o) => s + (o.grandTotal - o.paidAmount), 0))} icon="wallet" tone="danger" hint={`${faNum(unpaid.length)} سفارش تسویه‌نشده`} />
        <Stat label="سفارش امروز" value={faNum(todayOrders.length)} icon="clock" tone="accent" hint={`میانگین سبد ${tomanShort(orders.length ? revenue / orders.length : 0)}`} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard title="روند فروش ۶ ماه" subtitle="ارزش سفارش‌های ثبت‌شده (داده Mock)">
          <SalesAreaChart data={monthly} />
        </ChartCard>
        <ChartCard title="سهم دسته‌بندی‌ها از فروش" subtitle="بر پایه اقلام سفارش‌ها">
          <CategoryPieChart data={categoryShare} />
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <ChartCard title="سفارش و مرجوعی ماهانه" subtitle="کنترل نرخ مرجوعی">
          <OrdersBarChart data={monthly} />
        </ChartCard>

        <Card>
          <SectionTitle title="هشدارهای عملیاتی" subtitle="موارد نیازمند اقدام فوری" icon="alert" />
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/60 px-3 py-2.5 dark:border-rose-900/50 dark:bg-rose-900/20">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-rose-800 dark:text-rose-200">
                <Icon name="box" className="h-4 w-4" />
                کالاهای زیر نقطه سفارش
              </span>
              <Link to="/admin/warehouse" className="num text-[12.5px] font-extrabold text-rose-700 dark:text-rose-300">
                {faNum(lowStock.length)} مورد
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-900/20">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-amber-800 dark:text-amber-200">
                <Icon name="clock" className="h-4 w-4" />
                مشتریان در معرض ریزش
              </span>
              <Link to="/admin/bi" className="num text-[12.5px] font-extrabold text-amber-700 dark:text-amber-300">
                {faNum(churnRiskList.length)} مشتری
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2.5 dark:border-sky-900/50 dark:bg-sky-900/20">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-sky-800 dark:text-sky-200">
                <Icon name="clipboard" className="h-4 w-4" />
                استعلام قیمت در انتظار پاسخ
              </span>
              <Link to="/admin/rfq" className="num text-[12.5px] font-extrabold text-sky-700 dark:text-sky-300">
                مشاهده
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2.5 dark:border-violet-900/50 dark:bg-violet-900/20">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-violet-800 dark:text-violet-200">
                <Icon name="users" className="h-4 w-4" />
                تأیید مدارک مشتریان جدید
              </span>
              <Link to="/admin/customers" className="num text-[12.5px] font-extrabold text-violet-700 dark:text-violet-300">
                {faNum(customers.filter((c) => c.docsStatus === 'pending').length)} پرونده
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[11.5px] font-bold text-ink-600 dark:text-ink-300">نرخ تحویل موفق</p>
              <Progress value={(delivered.length / Math.max(1, orders.length)) * 100} label={`${faNum((delivered.length / Math.max(1, orders.length)) * 100, 1)}٪ از سفارش‌ها`} />
            </div>
            <div>
              <p className="mb-1.5 text-[11.5px] font-bold text-ink-600 dark:text-ink-300">نرخ مرجوعی</p>
              <Progress
                value={(orders.filter((o) => o.hasReturn).length / Math.max(1, orders.length)) * 100}
                color="#f9a307"
                label={`${faNum((orders.filter((o) => o.hasReturn).length / Math.max(1, orders.length)) * 100, 1)}٪ از سفارش‌ها`}
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <SectionTitle title="پرفروش‌ترین کالاها" subtitle="بر پایه ارزش فروش" icon="flame" />
          <TableWrap>
            <thead>
              <tr>
                <th>#</th>
                <th>کالا</th>
                <th>تعداد فروش</th>
                <th>ارزش</th>
                <th>سهم</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <EmptyRow colSpan={5} text="داده‌ای برای نمایش وجود ندارد" />
              ) : (
                topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td className="num">{faNum(i + 1)}</td>
                    <td className="font-semibold">{p.name}</td>
                    <td className="num">{faNum(p.qty)}</td>
                    <td className="num font-bold">{tomanShort(p.amount)}</td>
                    <td>
                      <MiniBar value={p.amount} max={topProducts[0].amount} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>
        </Card>

        <Card>
          <SectionTitle title="مشتریان کلیدی" subtitle="بر پایه ارزش طول عمر (LTV)" icon="crown" />
          <TableWrap>
            <thead>
              <tr>
                <th>فروشگاه</th>
                <th>سطح</th>
                <th>میانگین سفارش</th>
                <th>LTV</th>
                <th>ریسک ریزش</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-semibold">{c.storeName}</span>
                    <span className="block text-[10.5px] text-ink-400">{c.city} • {c.kind}</span>
                  </td>
                  <td>
                    <Badge tone={c.tier === 'VIP' ? 'vip' : c.tier === 'A' ? 'brand' : 'neutral'}>{c.tier}</Badge>
                  </td>
                  <td className="num">{tomanShort(c.avgOrderValue)}</td>
                  <td className="num font-bold">{tomanShort(c.ltv)}</td>
                  <td>
                    <Badge tone={c.churnRisk > 50 ? 'danger' : c.churnRisk > 25 ? 'warning' : 'success'}>
                      {percentFa(c.churnRisk)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle
            title="آخرین سفارش‌ها"
            subtitle="ثبت‌شده در پلتفرم"
            icon="package"
            action={
              <Link to="/admin/orders" className="btn-ghost btn-sm">
                همه سفارش‌ها
              </Link>
            }
          />
          <TableWrap>
            <thead>
              <tr>
                <th>کد</th>
                <th>مشتری</th>
                <th>مبلغ</th>
                <th>وضعیت</th>
                <th>زمان</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 7).map((o) => (
                <tr key={o.id}>
                  <td className="num font-bold">{o.code}</td>
                  <td className="truncate">{o.customerName}</td>
                  <td className="num">{toman(o.grandTotal, false)}</td>
                  <td>
                    <Badge tone={ORDER_STATUS_META[o.status].tone}>{ORDER_STATUS_META[o.status].label}</Badge>
                  </td>
                  <td className="text-[11px] text-ink-400">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Card>

        <div className="space-y-3">
          <Card>
            <SectionTitle title="بینش‌های هوشمند" subtitle="تحلیل نمایشی نسخه دمو" icon="sparkles" />
            <div className="space-y-2">
              {insights.map((i) => (
                <div key={i.id} className="flex items-start gap-2.5 rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon name={i.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11.5px] font-bold">{i.title}</p>
                    <p className="num text-[12.5px] font-extrabold">{i.value}</p>
                    <p className="text-[10.5px] text-ink-500 dark:text-ink-400">{i.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="آخرین فعالیت‌های کاربران" subtitle="Audit Trail" icon="list" action={<Link to="/admin/audit" className="btn-ghost btn-sm">همه</Link>} />
            <div className="space-y-2">
              {logs.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-semibold">{l.action}</p>
                    <p className="truncate text-[10.5px] text-ink-500 dark:text-ink-400">{l.userName} • {l.detail}</p>
                  </div>
                  <span className="num flex-none text-[10.5px] text-ink-400">{jalaliDate(l.at)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
};

export default Dashboard;
