import { useMemo, useState } from 'react';
import { AdminPage, MiniBar } from '@/components/AdminUI';
import { Badge, Card, Progress, SectionTitle, Stat, TableWrap, Tabs, useToast } from '@/components/ui';
import { CategoryPieChart, ChartCard, MultiLineChart, RadarMetrics, SalesAreaChart } from '@/components/Charts';
import { Icon } from '@/components/Icon';
import { faNum, percentFa, toman, tomanShort } from '@/lib/format';
import { useCustomers, useOrders, useProducts, useBrands } from '@/store/useStore';
import { churnRiskList, insights } from '@/data/content';
import { rootCategories } from '@/data/categories';

const BiAdmin = () => {
  const orders = useOrders();
  const products = useProducts();
  const customers = useCustomers();
  const brands = useBrands();
  const { toast } = useToast();
  const [tab, setTab] = useState('sales');

  const revenue = orders.reduce((s, o) => s + o.grandTotal, 0);
  const grossMargin = revenue * 0.19;
  const avgBasket = revenue / Math.max(1, orders.length);

  const monthly = useMemo(() => {
    const labels = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور'];
    const map = new Map(labels.map((l) => [l, { sales: 0, orders: 0, returns: 0 }]));
    orders.forEach((o, i) => {
      const row = map.get(labels[i % 6])!;
      row.sales += o.grandTotal;
      row.orders += 1;
      if (o.hasReturn) row.returns += 1;
    });
    return labels.map((l) => ({ label: l, ...map.get(l)! }));
  }, [orders]);

  const brandShare = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) =>
      o.items.forEach((i) => {
        const p = products.find((x) => x.id === i.productId);
        if (!p) return;
        map.set(p.brandId, (map.get(p.brandId) ?? 0) + i.total);
      }),
    );
    return [...map.entries()]
      .map(([id, value]) => ({ name: brands.find((b) => b.id === id)?.name ?? id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [orders, products, brands]);

  const categoryShare = useMemo(
    () =>
      rootCategories
        .map((c) => {
          const ids = products.filter((p) => p.categoryId === c.id).map((p) => p.id);
          return {
            name: c.name,
            value: orders.reduce((s, o) => s + o.items.filter((i) => ids.includes(i.productId)).reduce((x, i) => x + i.total, 0), 0),
          };
        })
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8),
    [orders, products],
  );

  const segmentRadar = useMemo(
    () =>
      (['VIP', 'A', 'B', 'C'] as const).map((tier) => {
        const list = customers.filter((c) => c.tier === tier);
        const orderCount = orders.filter((o) => list.some((c) => c.id === o.customerId)).length;
        return { subject: `سطح ${tier}`, value: Math.round((orderCount / Math.max(1, list.length)) * 12) };
      }),
    [customers, orders],
  );

  const rfmRows = useMemo(
    () =>
      [...customers]
        .map((c) => {
          const mine = orders.filter((o) => o.customerId === c.id);
          const recency = mine.length ? Math.min(90, Math.round((Date.now() - +new Date(mine[0].createdAt)) / 86400000)) : 120;
          const frequency = mine.length;
          const monetary = mine.reduce((s, o) => s + o.grandTotal, 0);
          const score = Math.max(1, Math.min(5, Math.round((frequency / 6 + (90 - Math.min(90, recency)) / 30 + monetary / 200_000_000) + 1)));
          return { customer: c, recency, frequency, monetary, score };
        })
        .sort((a, b) => b.score - a.score),
    [customers, orders],
  );

  return (
    <AdminPage
      title="داشبورد هوشمند (BI)"
      subtitle="تحلیل فروش، سبد کالا، RFM مشتریان و پیش‌بینی ریزش — همه محاسبات سمت مرورگر"
      icon="sparkles"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => toast('گزارش تحلیلی PDF ساخته شد (نمایشی)')}>
            <Icon name="download" className="h-4 w-4" />
            خروجی PDF
          </button>
          <button className="btn-primary btn-sm" onClick={() => toast('مدل پیش‌بینی فروش بازآموزی شد (نمایشی)')}>
            <Icon name="refresh" className="h-4 w-4" />
            به‌روزرسانی تحلیل
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="ارزش کل فروش" value={tomanShort(revenue)} icon="chart" delta="۱۲٪ نسبت به دوره قبل" positive />
        <Stat label="سود ناخالص تخمینی" value={tomanShort(grossMargin)} icon="wallet" tone="accent" hint="حاشیه سود ۱۹٪" />
        <Stat label="میانگین سبد خرید" value={tomanShort(avgBasket)} icon="cart" tone="info" />
        <Stat label="تعداد مشتری فعال" value={faNum(customers.filter((c) => c.churnRisk < 40).length)} icon="users" tone="vip" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'sales', label: 'تحلیل فروش', icon: 'chart' },
          { id: 'basket', label: 'تحلیل سبد کالا', icon: 'cart' },
          { id: 'customers', label: 'تحلیل مشتریان', icon: 'users' },
          { id: 'churn', label: 'پیش‌بینی ریزش', icon: 'alert' },
        ]}
      />

      {tab === 'sales' && (
        <div className="space-y-3">
          <ChartCard title="روند فروش و تعداد سفارش" subtitle="داده‌های Mock نسخه دمو">
            <SalesAreaChart data={monthly} />
          </ChartCard>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <SectionTitle title="تحلیل روند و پیش‌بینی" subtitle="الگوریتم نمایشی میانگین متحرک" icon="trend" />
              <div className="space-y-3">
                {[
                  ['میانگین فروش ماهانه', tomanShort(revenue / 6)],
                  ['رشد ماه به ماه', '۴٫۸٪'],
                  ['پیش‌بینی فروش ماه آینده', tomanShort((revenue / 6) * 1.05)],
                  ['سهم فروش آنلاین از کل', '۶۸٪'],
                ].map(([l, v]) => (
                  <div key={l} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-[11.5px] dark:border-ink-700">
                    <span className="text-ink-500 dark:text-ink-400">{l}</span>
                    <span className="num font-extrabold">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2.5">
                <p className="text-[11.5px] font-bold">سهم دسته‌بندی‌ها</p>
                {categoryShare.map((c) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{c.name}</span>
                      <span className="num text-ink-500 dark:text-ink-400">{tomanShort(c.value)}</span>
                    </div>
                    <MiniBar value={c.value} max={categoryShare[0]?.value ?? 1} />
                  </div>
                ))}
              </div>
            </Card>
            <ChartCard title="سهم برندها از فروش" subtitle="۸ برند برتر">
              <CategoryPieChart data={brandShare} />
            </ChartCard>
          </div>
        </div>
      )}

      {tab === 'basket' && (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <SectionTitle title="قوانین هم‌خریدی (Market Basket)" subtitle="کالاهایی که با هم خریداری می‌شوند" icon="layers" />
              <div className="space-y-2">
                {[
                  ['ماکارونی + رب گوجه + پنیر پیتزا', '۶۸٪', 'سفارش‌های رستورانی'],
                  ['چای + قند + بیسکویت', '۵۴٪', 'سفارش‌های سوپرمارکتی'],
                  ['نوشابه + آب معدنی + چیپس', '۴۷٪', 'سفارش‌های فروشگاهی'],
                  ['روغن + برنج + کنسرو', '۴۱٪', 'سفارش‌های عمده'],
                ].map(([combo, pct, hint]) => (
                  <div key={combo} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold">{combo}</span>
                      <Badge tone="brand">{pct}</Badge>
                    </div>
                    <p className="mt-1 text-[10.5px] text-ink-400">{hint}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle title="شاخص‌های سبد خرید" subtitle="مقایسه با دوره قبل" icon="cart" />
              <div className="space-y-4">
                <Progress value={72} label="میانگین تعداد قلم در سبد: ۹٫۴ قلم" />
                <Progress value={61} color="#0ea5e9" label="سهم سفارش‌های تکرارشونده: ۶۱٪" />
                <Progress value={48} color="#f9a307" label="سهم سفارش‌های حاوی کالای وارداتی: ۴۸٪" />
                <Progress value={83} color="#7c3aed" label="سهم سفارش‌های تحویل‌شده در بازه وعده‌داده‌شده: ۸۳٪" />
              </div>
            </Card>
          </div>
          <Card>
            <SectionTitle title="محصولات مکمل پیشنهادی برای فروش مکمل (Cross-sell)" subtitle="پیشنهاد موتور توصیه‌گر نمایشی" icon="sparkles" />
            <TableWrap>
              <thead>
                <tr>
                  <th>کالای پایه</th>
                  <th>کالای مکمل پیشنهادی</th>
                  <th>نرخ هم‌خریدی</th>
                  <th>افزایش سبد تخمینی</th>
                  <th>اقدام</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0, 6).map((p, i) => (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td>{products[(i + 7) % products.length].name}</td>
                    <td>
                      <span className="num font-bold">{faNum(38 + i * 4)}٪</span>
                    </td>
                    <td className="num">{tomanShort((p.basePrice + products[(i + 7) % products.length].basePrice) * 0.35)}</td>
                    <td>
                      <button className="btn-ghost btn-sm" onClick={() => toast('قانون پیشنهاد مکمل ذخیره شد (نمایشی)')}>
                        ایجاد قانون
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <ChartCard title="مقایسه عملکرد سطوح مشتریان" subtitle="میانگین سفارش در هر سطح">
              <RadarMetrics data={segmentRadar} />
            </ChartCard>
            <Card>
              <SectionTitle title="تحلیل RFM" subtitle="تازگی، تناوب و ارزش ریالی خرید" icon="activity" />
              <div className="space-y-2">
                {[
                  ['مشتریان قهرمان (Champions)', 'خرید مکرر و ارزش بالا'],
                  ['مشتریان وفادار', 'خرید منظم با سبد متوسط'],
                  ['نیازمند توجه', 'کاهش تناوب خرید در ۶۰ روز گذشته'],
                  ['در معرض ریزش', 'عدم خرید بیش از ۹۰ روز'],
                ].map(([title, hint], i) => (
                  <div key={title} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 dark:border-ink-700">
                    <div>
                      <p className="text-[11.5px] font-bold">{title}</p>
                      <p className="text-[10.5px] text-ink-400">{hint}</p>
                    </div>
                    <span className="num font-extrabold">{faNum([12, 24, 18, 9][i])} مشتری</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <SectionTitle title="جدول امتیازدهی RFM" subtitle="مرتب‌شده بر پایه امتیاز ترکیبی" icon="list" />
            <TableWrap>
              <thead>
                <tr>
                  <th>مشتری</th>
                  <th>سطح</th>
                  <th>تازگی (روز)</th>
                  <th>تناوب خرید</th>
                  <th>ارزش خرید</th>
                  <th>امتیاز RFM</th>
                  <th>پیشنهاد اقدام</th>
                </tr>
              </thead>
              <tbody>
                {rfmRows.slice(0, 12).map((r) => (
                  <tr key={r.customer.id}>
                    <td className="font-semibold">{r.customer.storeName}</td>
                    <td>
                      <Badge tone={r.customer.tier === 'VIP' ? 'vip' : r.customer.tier === 'A' ? 'brand' : 'neutral'}>{r.customer.tier}</Badge>
                    </td>
                    <td className="num">{faNum(r.recency)}</td>
                    <td className="num">{faNum(r.frequency)}</td>
                    <td className="num">{tomanShort(r.monetary)}</td>
                    <td>
                      <Badge tone={r.score >= 4 ? 'success' : r.score >= 3 ? 'warning' : 'danger'}>
                        {faNum(r.score)} از ۵
                      </Badge>
                    </td>
                    <td className="text-[11px]">
                      {r.score >= 4 ? 'اعطای تخفیف پیمانی و ارتقای سطح' : r.score >= 3 ? 'ارسال پیشنهاد دوره‌ای' : 'تماس بازگشت مشتری'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'churn' && (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <SectionTitle title="مشتریان در معرض ریزش" subtitle="احتمال ریزش بیش از ۵۰٪" icon="alert" />
              <TableWrap>
                <thead>
                  <tr>
                    <th>مشتری</th>
                    <th>شهر</th>
                    <th>آخرین خرید</th>
                    <th>علت شناسایی‌شده</th>
                    <th>احتمال ریزش</th>
                    <th>اقدام پیشنهادی</th>
                    <th>اجرا</th>
                  </tr>
                </thead>
                <tbody>
                  {churnRiskList.map((c) => (
                    <tr key={c.customer}>
                      <td className="font-semibold">{c.customer}</td>
                      <td>{c.city}</td>
                      <td className="num">{c.lastOrder}</td>
                      <td className="text-[11px] text-ink-500 dark:text-ink-400">{c.reason}</td>
                      <td>
                        <Badge tone={c.risk > 70 ? 'danger' : 'warning'}>{faNum(c.risk)}٪</Badge>
                      </td>
                      <td className="text-[11px]">{c.action}</td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={() => toast(`کمپین بازگشت برای ${c.customer} ساخته شد (نمایشی)`)}>
                          اجرای اقدام
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
            <Card>
              <SectionTitle title="بینش‌های هوشمند" subtitle="پیشنهادهای موتور تحلیل" icon="sparkles" />
              <div className="space-y-2">
                {insights.map((i) => (
                  <div key={i.id} className="flex items-start gap-2.5 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      <Icon name={i.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11.5px] font-bold">{i.title}</p>
                      <p className="num text-[12.5px] font-extrabold">{i.value}</p>
                      <p className="text-[10.5px] text-ink-500 dark:text-ink-400">{i.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-brand-50/70 p-3 text-[11.5px] leading-6 text-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
                <span className="font-bold">اثر مالی پیشنهادها: </span>
                اجرای کامل این پیشنهادها در نسخه عملیاتی، به‌طور تخمینی ماهانه{' '}
                <span className="num font-bold">{toman(1_240_000_000, false)} تومان</span> حفظ فروش در معرض خطر را
                ممکن می‌کند.
              </div>
            </Card>
          </div>
        </div>
      )}

      <Card className="bg-ink-50/70 dark:bg-ink-800/40">
        <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
          <span className="font-bold">یادداشت فنی: </span>
          تمام شاخص‌های این داشبورد به‌صورت زنده از داده‌های Mock و سفارش‌های ثبت‌شده در مرورگر محاسبه می‌شوند؛ هیچ
          درخواستی به سرور ارسال نمی‌شود. در نسخه عملیاتی، همین داشبورد به انبار داده و مدل‌های یادگیری ماشین متصل
          خواهد شد.
        </p>
      </Card>
    </AdminPage>
  );
};

export default BiAdmin;
