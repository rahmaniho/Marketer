/**
 * پنل ادمین تفکیکی ماژول «تنقلات»
 * — مدیریت برندها و دسته‌های هشت‌گانه، ویژگی‌های تخصصی (طعم/وزن/بسته‌بندی/گروه سنی/بدون قند)،
 *   کمپین‌های فصلی (نوروز، بازگشایی مدارس، رمضان)، گزارش تفکیکی، انبارداری ابعادی،
 *   هزینه ارسال وزنی، بارکد/انقضا و باندل‌های پیشنهادی
 * — کارن سافت (Karen-soft.ir)
 */
import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  DemoNote,
  Modal,
  Progress,
  SectionTitle,
  Stat,
  Switch,
  TableWrap,
  useToast,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ChartCard, CategoryPieChart, MultiLineChart, OrdersBarChart, SalesAreaChart } from '@/components/Charts';
import { useOffers, useStore } from '@/store/useStore';
import { faNum, toman, tomanShort } from '@/lib/format';
import {
  BasketPairsRows,
  BundleCard,
  ComplianceCard,
  bulkyItems,
  cartonWeightKg,
  competitorPriceHints,
  monthlySalesByModule,
  ocrDemo,
  seasonalDemand,
  shippingCostByWeight,
  snackFeatureBadges,
  topBrandsOf,
  unitPriceTable,
  snBundles,
  snBrands,
  snCategories,
  snCompliance,
  snProducts,
  snSuppliers,
} from '@/modules/snacks';

const SIDE_ITEMS = [
  { id: 'overview', label: 'نمای کلی', icon: 'grid' },
  { id: 'brands', label: 'برندها', icon: 'crown' },
  { id: 'categories', label: 'دسته‌بندی', icon: 'folder' },
  { id: 'attrs', label: 'ویژگی‌های تخصصی', icon: 'package' },
  { id: 'seasonal', label: 'کمپین‌های فصلی', icon: 'gift' },
  { id: 'orders', label: 'سفارش‌ها', icon: 'truck' },
  { id: 'pricing', label: 'قیمت‌گذاری', icon: 'wallet' },
  { id: 'warehouse', label: 'انبارداری ابعادی', icon: 'box' },
  { id: 'shipping', label: 'هزینه ارسال وزنی', icon: 'calculator' },
  { id: 'reports', label: 'گزارش تفکیکی', icon: 'chart' },
  { id: 'compliance', label: 'مجوزها', icon: 'badge' },
  { id: 'offer-ocr', label: 'بارکد و انقضا', icon: 'scan' },
  { id: 'bundles', label: 'باندل‌های پیشنهادی', icon: 'sparkles' },
  { id: 'settings', label: 'تنظیمات ماژول', icon: 'settings' },
] as const;

type SideId = (typeof SIDE_ITEMS)[number]['id'];

const ORDER_STATUS: Record<string, { label: string; tone: 'success' | 'info' | 'warning' | 'neutral' | 'danger' }> = {
  delivered: { label: 'تحویل شد', tone: 'success' },
  shipping: { label: 'در حال ارسال', tone: 'info' },
  processing: { label: 'در حال پردازش', tone: 'warning' },
  new: { label: 'جدید', tone: 'neutral' },
  canceled: { label: 'لغو شد', tone: 'danger' },
};

const SnacksAdmin = () => {
  const [tab, setTab] = useState<SideId>('overview');
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const upsertProduct = useStore((s) => s.upsertProduct);
  const productEdits = useStore((s) => s.productEdits);
  const { toast } = useToast();
  const offers = useOffers();

  const snacksEnabled = settings.modules?.snacks ?? true;
  const modules = settings.modules ?? { food: true, detergent: true, hygiene: true, misc: true, snacks: true };
  const [quickEdit, setQuickEdit] = useState<(typeof snProducts)[number] | null>(null);
  const [priceForm, setPriceForm] = useState({ basePrice: '', cashDiscount: '', moq: '', active: true });

  /** محصولات ماژول با احتساب ویرایش‌های ادمین */
  const snRows = useMemo(
    () => snProducts.map((p) => (productEdits[p.id] as typeof p | undefined) ?? p),
    [productEdits],
  );

  /** سفارش‌های مصنوعی تفکیکی */
  const orders = useMemo(() => {
    const cities = ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'کرج', 'اهواز', 'رشت'];
    const firstNames = ['فروشگاه افق', 'هایپرمارکت پردیس', 'بوفه مدرسه آفتاب', 'کافه رستوران نایب', 'هایپر استار', 'بقالی محل'];
    return Array.from({ length: 42 }, (_, i) => ({
      id: `SN-14050${String(i + 100).padStart(3, '0')}`,
      customer: `${firstNames[i % firstNames.length]} — ${cities[i % cities.length]}`,
      count: 3 + ((i * 7) % 18),
      total: (4.2 + ((i * 13) % 55)) * 10_000_000,
      status: (['delivered', 'shipping', 'processing', 'new', 'delivered'] as const)[i % 5],
    }));
  }, []);

  /** داده نمودار خطی — کلید label برای MultiLineChart */
  const salesData = useMemo(
    () =>
      monthlySalesByModule.map((m) => ({
        label: m.month,
        food: m.food,
        detergent: m.detergent,
        hygiene: m.hygiene,
        misc: m.misc,
        snacks: m.snacks,
      })),
    [],
  );

  const splitPie = useMemo(
    () => [
      { name: 'تنقلات', value: 286 },
      { name: 'کالاهای مصرفی', value: 215 },
      { name: 'مواد غذایی', value: 512 },
      { name: 'شوینده', value: 299 },
      { name: 'بهداشتی', value: 221 },
    ],
    [],
  );

  const topBrands = useMemo(() => topBrandsOf(6), []);
  const maxSold = topBrands[0]?.sold || 1;

  /** تعداد کالا در هر دسته */
  const countOf = (categoryId: string): number =>
    snProducts.filter((p) => p.categoryId === categoryId).length +
    snProducts.filter((p) => snCategories.find((c) => c.id === p.categoryId)?.parentId === categoryId).length;

  const openQuickEdit = (p: (typeof snProducts)[number]) => {
    setQuickEdit(p);
    setPriceForm({
      basePrice: String(p.basePrice),
      cashDiscount: String(p.cashDiscountPercent ?? 0),
      moq: String(p.moq),
      active: p.isActive,
    });
  };

  const saveQuickEdit = () => {
    if (!quickEdit) return;
    upsertProduct({
      ...quickEdit,
      basePrice: Number(priceForm.basePrice) || quickEdit.basePrice,
      cashDiscountPercent: Number(priceForm.cashDiscount) || 0,
      moq: Number(priceForm.moq) || 1,
      isActive: priceForm.active,
    });
    toast('تغییرات محصول ذخیره شد', 'success');
    setQuickEdit(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-ink-900 dark:text-ink-50">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl2 text-white" style={{ background: '#d97706' }}>
              <Icon name="candy" className="h-5 w-5" />
            </span>
            پنل ادمین — ماژول تنقلات
          </h1>
          <p className="mt-1 text-[12px] text-ink-500">مدیریت مستقل برندها، دسته‌ها، کمپین‌های فصلی، گزارش‌ها و ماژول‌ها — کارن سافت</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={snacksEnabled ? 'success' : 'danger'} icon={snacksEnabled ? 'check-circle' : 'close'}>
            ماژول {snacksEnabled ? 'فعال' : 'غیرفعال'}
          </Badge>
          <button
            onClick={() => {
              const v = !snacksEnabled;
              updateSettings({ modules: { ...modules, snacks: v } });
              toast(v ? 'ماژول تنقلات فعال شد' : 'ماژول تنقلات غیرفعال شد — محصولات از کاتالوگ پنهان می‌شوند', v ? 'success' : 'error');
            }}
            className={`relative h-6 w-11 rounded-full transition ${snacksEnabled ? 'bg-brand-600' : 'bg-ink-300 dark:bg-ink-700'}`}
            aria-label="فعال‌سازی ماژول تنقلات"
          >
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ right: snacksEnabled ? 2 : 22 }} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* ───────── سایدبار */}
        <aside className="space-y-1 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-2">
            {SIDE_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12px] font-bold transition ${tab === item.id ? 'bg-amber-600 text-white' : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'}`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </Card>
          <DemoNote>این پنل با داده‌های نمایشی (Mock) کار می‌کند؛ تغییر قیمت‌ها در localStorage مرورگر ذخیره می‌شود.</DemoNote>
        </aside>

        {/* ───────── محتوا */}
        <div className="space-y-5">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="کل کالاها" value={faNum(snProducts.length)} icon="package" tone="brand" hint="در ۸ شاخه تنقلاتی" />
                <Stat label="برندها" value={faNum(snBrands.length)} icon="crown" tone="vip" hint="ایرانی و خارجی" />
                <Stat label="کمپین فصلی فعال" value={faNum(offers.filter((o) => o.isActive && o.id.startsWith('sno-')).length)} icon="gift" tone="info" hint="نوروز / مدارس / رمضان" />
                <Stat label="تأمین‌کنندگان" value={faNum(snSuppliers.length)} icon="truck" tone="accent" hint="پخش سراسری" />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <ChartCard title="فروش ماهانه — تفکیک به تفکیک ماژول" subtitle="تنقلات با نوسان فصلی نوروز و مهر (خط زرد)">
                    <MultiLineChart
                      data={salesData}
                      series={[
                        { key: 'snacks', name: 'تنقلات', color: '#f59e0b' },
                        { key: 'misc', name: 'کالاهای مصرفی', color: '#f97316' },
                        { key: 'food', name: 'مواد غذایی', color: '#6366f1' },
                        { key: 'detergent', name: 'شوینده', color: '#22c55e' },
                        { key: 'hygiene', name: 'بهداشتی', color: '#14b8a6' },
                      ]}
                    />
                  </ChartCard>
                </div>
                <ChartCard title="سهم فروش به تفکیک ماژول" subtitle="ترکیب فروش پنج ماژول (میلیارد تومان)">
                  <CategoryPieChart data={splitPie} />
                </ChartCard>
              </div>

              <Card className="p-4">
                <SectionTitle title="برندهای پرفروش ماژول" subtitle="بر اساس تعداد فروش در داده‌های کاتالوگ" icon="crown" />
                <div className="space-y-3">
                  {topBrands.map((b, i) => (
                    <div key={b.name} className="flex items-center gap-3">
                      <Badge tone="info">{faNum(i + 1)}</Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-ink-700 dark:text-ink-200">{b.name}</span>
                          <span className="num text-ink-500">
                            {faNum(b.sold)} فروش — {tomanShort(b.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(b.sold / maxSold) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === 'brands' && (
            <Card className="p-4">
              <SectionTitle
                title="مدیریت برندهای تنقلات"
                subtitle="۶۰ برند ایرانی و خارجی (مزمز، چی‌توز، شونیز، ویتانا، بایودنت، پرینگلز، نوتلا، اسنیکرز، منتوس و…)"
                icon="crown"
                action={
                  <button onClick={() => toast('افزودن برند در دمو نمایشی است', 'info')} className="btn-primary btn-sm">
                    <Icon name="plus" className="h-4 w-4" />
                    برند جدید
                  </button>
                }
              />
              <TableWrap>
                <thead>
                  <tr>
                    <th>برند</th>
                    <th>کشور</th>
                    <th>خطوط تولید</th>
                    <th>امتیاز</th>
                    <th>وضعیت مجوز</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {snBrands.slice(0, 20).map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-white text-[10px] font-bold" style={{ background: b.logo.from }}>
                            {b.logo.initials}
                          </span>
                          <div>
                            <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{b.name}</p>
                            <p className="text-[10px] text-ink-400">{b.nameEn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[11px]">{b.country}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {b.productLines.slice(0, 2).map((l) => (
                            <Badge key={l} tone="neutral">
                              {l}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="num text-[11px] font-bold">{faNum(b.rating, 1)}</td>
                      <td>
                        <Badge tone={b.licenseStatus === 'valid' ? 'success' : b.licenseStatus === 'expiring' ? 'warning' : 'danger'}>
                          {b.licenseStatus === 'valid' ? 'معتبر' : b.licenseStatus === 'expiring' ? 'رو به انقضا' : 'در حال بررسی'}
                        </Badge>
                      </td>
                      <td>
                        <button onClick={() => toast('ویرایش برند در دمو نمایشی است', 'info')} className="btn-ghost btn-sm">
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                          ویرایش
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <p className="mt-2 text-[10px] text-ink-400">نمایش ۲۰ برند اول — برند جدید، ویرایش و تعلیق در نسخه دمو نمایشی است.</p>
            </Card>
          )}

          {tab === 'categories' && (
            <div className="space-y-4">
              <Card className="p-4">
                <SectionTitle title="مدیریت دسته‌بندی (۸ شاخه اصلی)" icon="folder" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {snCategories
                    .filter((c) => !c.parentId)
                    .map((root) => (
                      <div key={root.id} className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: root.color }}>
                            <Icon name={root.icon} className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{root.name}</p>
                            <p className="num text-[10px] text-ink-400">{faNum(countOf(root.id))} کالا</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {snCategories
                            .filter((c) => c.parentId === root.id)
                            .map((child) => (
                              <Badge key={child.id} tone="neutral">
                                {child.name} ({faNum(countOf(child.id))})
                              </Badge>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
              <Card className="p-4">
                <SectionTitle title="افزودن زیردسته جدید" icon="plus" />
                <div className="grid gap-3 sm:grid-cols-3">
                  <input placeholder="نام زیردسته" className="input" />
                  <select className="input">
                    <option>شاخه والد…</option>
                    {snCategories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <option key={c.id}>{c.name}</option>
                      ))}
                  </select>
                  <button onClick={() => toast('زیردسته در دمو نمایشی است', 'info')} className="btn-primary">
                    <Icon name="plus" className="h-4 w-4" />
                    افزودن
                  </button>
                </div>
              </Card>
            </div>
          )}

          {tab === 'attrs' && (
            <Card className="p-4">
              <SectionTitle title="ویژگی‌های تخصصی تنقلات" subtitle="مدیریت مقادیر طعم، وزن، بسته‌بندی، گروه سنی و ویژگی‌های خاص" icon="package" />
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="label">طعم‌ها</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['نمکی', 'پنیری', 'سرکه', 'BBQ', 'کچاپ', 'پیتزا', 'میوه‌ای', 'شکلاتی'].map((f) => (
                      <Badge key={f} tone="brand">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label">وزن (گرم)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[25, 30, 45, 60, 70, 100, 150, 180, 200, 250, 300, 350, 400].map((w) => (
                      <Badge key={w} tone="info">
                        {faNum(w)} گرم
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label">بسته‌بندی</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['بسته', 'کارتن', 'شرینک'].map((p) => (
                      <Badge key={p} tone="accent">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label">گروه سنی و ویژگی‌های خاص</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['کودک', 'بزرگسال', 'همه', 'بدون قند', 'روکش شکلاتی', 'فصلی'].map((a) => (
                      <Badge key={a} tone="warning">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                <p className="text-[11px] leading-relaxed text-ink-500">
                  این مقادیر در فیلترهای پنل مشتری (صفحه تنقلات) و ستون‌های مقایسه فنی استفاده می‌شوند. افزودن/حذف مقدار جدید در نسخه دمو نمایشی است؛
                  مدل داده در <span className="num font-bold">SnackSpec</span> تعریف شده است.
                </p>
              </div>
            </Card>
          )}

          {tab === 'seasonal' && (
            <div className="space-y-4">
              <Card className="p-4">
                <SectionTitle title="پیش‌بینی تقاضای فصلی" subtitle="نوروز و شب عید، بازگشایی مدارس، ماه مبارک رمضان" icon="gift" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {seasonalDemand.map((s) => (
                    <div key={s.season} className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40">
                          <Icon name={s.icon} className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{s.season}</p>
                          <p className="text-[10px] text-ink-400">{s.months}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={s.index / 2} color="#f59e0b" label={`شاخص تقاضا ${faNum(s.index)}`} />
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-ink-500">{s.tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <SectionTitle title="کمپین‌های فصلی فعال" icon="tag" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {offers
                    .filter((o) => o.id.startsWith('sno-'))
                    .map((o) => (
                      <div key={o.id} className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                        <div className="flex items-center gap-2">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: o.color }}>
                            <Icon name={o.icon} className="h-4 w-4" />
                          </span>
                          <div className="flex-1">
                            <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{o.title}</p>
                            <p className="num text-[10px] text-ink-400">کد {o.code}</p>
                          </div>
                          <Badge tone={o.isActive ? 'success' : 'neutral'}>{o.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="num text-[11px] font-bold text-amber-600">{faNum(o.percent)}٪ تخفیف</span>
                          <Switch
                            checked={o.isActive}
                            onChange={() => toast('وضعیت کمپین در دمو نمایشی است', 'info')}
                            label="فعال"
                            description="نمایش در پنل مشتری"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'orders' && (
            <Card className="p-4">
              <SectionTitle title="سفارش‌های ماژول تنقلات" subtitle="۴۲ سفارش مصنوعی (Demo)" icon="truck" action={<Badge tone="info">همه سفارش‌ها</Badge>} />
              <TableWrap>
                <thead>
                  <tr>
                    <th>کد سفارش</th>
                    <th>مشتری</th>
                    <th>اقلام</th>
                    <th>مبلغ</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="num text-[11px] font-bold">{o.id}</td>
                      <td className="text-[11px]">{o.customer}</td>
                      <td className="num">{faNum(o.count)}</td>
                      <td className="num text-[11px] font-bold">{toman(o.total)}</td>
                      <td>
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </td>
                      <td>
                        <button onClick={() => toast('جزئیات سفارش در دمو نمایشی است', 'info')} className="btn-ghost btn-sm">
                          <Icon name="eye" className="h-3.5 w-3.5" />
                          مشاهده
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {tab === 'pricing' && (
            <div className="space-y-4">
              <Card className="p-4">
                <SectionTitle title="قوانین قیمت‌گذاری تجمعی" subtitle="همان آبشار قیمت ماژول‌های دیگر + واحد بسته/کارتن/شرینک" icon="wallet" />
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                    <p className="label">تخفیف نقدی</p>
                    <div className="flex items-center gap-2">
                      <input type="number" defaultValue={12} className="input num" />
                      <span className="text-[12px] text-ink-500">درصد</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink-400">به‌صورت پیش‌فرض ۱۲٪ تخفیف تسویه نقدی</p>
                  </div>
                  <div className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                    <p className="label">واحدهای فروش</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="brand">بسته</Badge>
                      <Badge tone="info">کارتن</Badge>
                      <Badge tone="accent">شرینک</Badge>
                    </div>
                    <p className="mt-1 text-[10px] text-ink-400">قیمت هر ۱۰۰ گرم هم به‌صورت خودکار محاسبه می‌شود</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle title="پله‌های حجمی و قیمت هر واحد" subtitle={`نمونه: ${snProducts[2]?.name ?? snProducts[0].name}`} icon="box" />
                <TableWrap>
                  <thead>
                    <tr>
                      <th>واحد</th>
                      <th>تعداد</th>
                      <th>قیمت</th>
                      <th>توضیح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitPriceTable(snProducts[2] ?? snProducts[0]).map((r) => (
                      <tr key={r.unit}>
                        <td className="font-bold">{r.unit}</td>
                        <td className="num">{faNum(r.qty)}</td>
                        <td className="num font-bold">{toman(r.price)}</td>
                        <td className="text-[11px] text-ink-400">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
                <div className="mt-3 rounded-xl2 border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="text-[11px] leading-relaxed text-ink-600 dark:text-ink-300">
                    <span className="font-bold">پیام هدایت خرید:</span> «۵ کارتن دیگر اضافه کن → ۶٪ ارزان‌تر» — این پیام به‌صورت خودکار در صفحه محصول و سبد
                    خرید بر اساس فاصله تا پله بعدی نمایش داده می‌شود.
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <SectionTitle title="پیشنهاد قیمت بهینه (نمایشی)" subtitle="بر اساس نرخ رقبا" icon="sparkles" />
                <div className="space-y-3">
                  {competitorPriceHints.map((h) => (
                    <div key={h.productName} className="flex flex-wrap items-center gap-3 rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{h.productName}</p>
                        <p className="text-[10px] text-ink-500">{h.suggestion}</p>
                      </div>
                      <div className="text-left">
                        <p className="num text-[10px] text-ink-400">قیمت شما {toman(h.ourPrice)}</p>
                        <p className="num text-[11px] font-bold text-ink-700 dark:text-ink-200">میانگین بازار {toman(h.marketAvg)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {tab === 'warehouse' && (
            <Card className="p-4">
              <SectionTitle title="انبارداری ابعادی" subtitle="اقلام حجیم یا سنگین (وزن ≥ ۲۵۰ گرم یا کارتن‌های بزرگ) — چیدمان پالتی و مدیریت وزن" icon="box" />
              <TableWrap>
                <thead>
                  <tr>
                    <th>کالا</th>
                    <th>بسته‌بندی</th>
                    <th>وزن واحد</th>
                    <th>وزن کارتن</th>
                    <th>در هر کارتن</th>
                    <th>قفسه</th>
                  </tr>
                </thead>
                <tbody>
                  {(bulkyItems() as (typeof snProducts)[number][]).map((p) => (
                    <tr key={p.id}>
                      <td className="text-[11px] font-bold">{p.name}</td>
                      <td className="num text-[10px]">{p.packDesc}</td>
                      <td className="num">{faNum(p.snacks?.weightGr ?? 0)} گرم</td>
                      <td className="num font-bold">{faNum(cartonWeightKg(p))} کیلو</td>
                      <td className="num">{faNum(p.unitsPerCarton)}</td>
                      <td>
                        <Badge tone="neutral">{p.warehouseId}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </Card>
          )}

          {tab === 'shipping' && (
            <Card className="p-4">
              <SectionTitle title="محاسبه هزینه ارسال بر اساس وزن" subtitle="هزینه = پایه + اضافه‌بهره وزنی — برای کارتن‌های سنگین تنقلات" icon="calculator" />
              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="label">جدول وزنی</p>
                  <div className="space-y-2">
                    {[10, 20, 35, 50, 80, 120].map((kg) => (
                      <div key={kg} className="flex items-center justify-between rounded-xl2 border border-ink-200 px-3 py-2 dark:border-ink-700">
                        <span className="num text-[12px] text-ink-600 dark:text-ink-300">{faNum(kg)} کیلوگرم</span>
                        <span className="num text-[12px] font-bold text-ink-800 dark:text-ink-100">{toman(shippingCostByWeight(kg))}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label">محاسبه‌گر سریع</p>
                  <ShippingCalc />
                </div>
              </div>
            </Card>
          )}

          {tab === 'reports' && (
            <div className="space-y-4">
              <Card className="p-4">
                <SectionTitle title="گزارش تفکیکی — تنقلات در مقابل سایر ماژول‌ها" icon="chart" />
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <Stat label="تنقلات" value={tomanShort(286_400_000_000)} icon="candy" tone="vip" hint="+۲۴٪ فصلی" />
                  <Stat label="کالاهای مصرفی" value={tomanShort(214_800_000_000)} icon="package" tone="brand" hint="+۹٪" />
                  <Stat label="مواد غذایی" value={tomanShort(512_300_000_000)} icon="tag" tone="info" hint="+۶٪" />
                  <Stat label="شوینده" value={tomanShort(298_700_000_000)} icon="box" tone="accent" hint="+۳٪" />
                  <Stat label="بهداشتی" value={tomanShort(221_100_000_000)} icon="leaf" tone="danger" hint="+۵٪" />
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="روند فروش ماهانه ماژول تنقلات" subtitle="رشد فصلی در نوروز و مهر">
                  <SalesAreaChart
                    data={monthlySalesByModule.map((m) => ({ label: m.month, sales: m.snacks, orders: Math.round(m.snacks / 62_000_000) }))}
                  />
                </ChartCard>
                <ChartCard title="سفارش‌های ماهانه — مقایسه با مرجوعی" subtitle="همه ماژول‌ها">
                  <OrdersBarChart
                    data={monthlySalesByModule.map((m) => ({
                      label: m.month,
                      orders: Math.round((m.snacks + m.misc + m.food + m.detergent + m.hygiene) / 100_000_000),
                      returns: Math.round((m.snacks + m.misc) / 900_000_000),
                    }))}
                  />
                </ChartCard>
              </div>

              <Card className="p-4">
                <SectionTitle title="تحلیل سبد خرید" subtitle="کدام تنقلات با هم خریداری می‌شوند (نمایشی)" icon="cart" />
                <TableWrap>
                  <thead>
                    <tr>
                      <th>کالای اول</th>
                      <th>کالای دوم</th>
                      <th>پشتیبانی</th>
                      <th>ضریب هم‌خرید</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BasketPairsRows.map((r) => (
                      <tr key={`${r.a}-${r.b}`}>
                        <td className="text-[11px]">{r.a}</td>
                        <td className="text-[11px]">{r.b}</td>
                        <td className="num">{faNum(r.support)}٪</td>
                        <td>
                          <Badge tone="success">{faNum(r.lift)}×</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              </Card>
            </div>
          )}

          {tab === 'compliance' && (
            <Card className="p-4">
              <SectionTitle title="مجوزها و استانداردها" subtitle="وزارت بهداشت، حلال، ISO 22000، عدم استفاده از روغن پالم و…" icon="badge" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {snCompliance.map((c) => (
                  <ComplianceCard key={c.id} item={c} brandName={snBrands.find((b) => b.id === c.brandId)?.name} />
                ))}
              </div>
            </Card>
          )}

          {tab === 'offer-ocr' && (
            <Card className="p-4">
              <SectionTitle title={ocrDemo.title} subtitle="اسکن بارکد + خواندن تاریخ انقضا برای اقلام تازه" icon="scan" />
              <p className="text-[11px] leading-relaxed text-ink-500">{ocrDemo.description}</p>
              <div className="mt-3 space-y-2">
                {ocrDemo.samples.map((s) => (
                  <div key={s.code} className="flex items-center gap-3 rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                    <Icon name="scan" className="h-5 w-5 text-amber-600" />
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{s.label}</p>
                      <p className="num text-[10px] text-ink-400">
                        بارکد {s.code} — انقضا {s.expiry}
                      </p>
                    </div>
                    <Badge tone={s.matched ? 'success' : 'warning'}>{s.matched ? 'تطبیق با انبار' : 'نیاز به بررسی'}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === 'bundles' && (
            <Card className="p-4">
              <SectionTitle title="باندل‌های پیشنهادی" subtitle="ست‌های ترکیبی مثل «پک تنقلات دورهمی» با تخفیف باندل" icon="gift" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {snBundles.map((b) => (
                  <BundleCard key={b.id} bundle={b} />
                ))}
              </div>
            </Card>
          )}

          {tab === 'settings' && (
            <Card className="p-4">
              <SectionTitle title="تنظیمات ماژول تنقلات" subtitle="فعال/غیرفعال‌سازی ماژول و دسترسی‌ها" icon="settings" />
              <div className="space-y-3">
                <Switch
                  checked={snacksEnabled}
                  onChange={(v) => {
                    updateSettings({ modules: { ...modules, snacks: v } });
                    toast(v ? 'ماژول تنقلات فعال شد' : 'ماژول تنقلات غیرفعال شد', v ? 'success' : 'error');
                  }}
                  label="فعال‌سازی ماژول تنقلات"
                  description="نمایش مسیر /snacks در پنل مشتری و داده‌های ماژول در کاتالوگ و گزارش‌ها"
                />
                <div className="rounded-xl2 border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                  <p className="text-[11px] leading-relaxed text-ink-600 dark:text-ink-300">
                    <span className="font-bold">راهنما:</span> با غیرفعال‌سازی ماژول، مسیر /snacks از منو حذف و داده‌های ماژول از کاتالوگ و گزارش‌ها پنهان
                    می‌شود. سفارش‌های قبلی مشتریان حفظ خواهد شد.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ───────── مودال سریع ویرایش قیمت */}
      <Modal open={!!quickEdit} onClose={() => setQuickEdit(null)} title="ویرایش سریع قیمت و موجودی">
        {quickEdit && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: quickEdit.images[0]?.hue ?? '#d97706' }}>
                <Icon name={quickEdit.images[0]?.icon ?? 'candy'} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-bold text-ink-800 dark:text-ink-100">{quickEdit.name}</p>
                <p className="text-[10px] text-ink-400">{snBrands.find((b) => b.id === quickEdit.brandId)?.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">{snackFeatureBadges(quickEdit).map((b) => <Badge key={b.label} tone={b.tone}>{b.label}</Badge>)}</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">قیمت پایه (تومان)</label>
                <input type="number" value={priceForm.basePrice} onChange={(e) => setPriceForm((f) => ({ ...f, basePrice: e.target.value }))} className="input num" />
              </div>
              <div>
                <label className="label">تخفیف نقدی (٪)</label>
                <input type="number" value={priceForm.cashDiscount} onChange={(e) => setPriceForm((f) => ({ ...f, cashDiscount: e.target.value }))} className="input num" />
              </div>
              <div>
                <label className="label">حداقل سفارش (MOQ)</label>
                <input type="number" value={priceForm.moq} onChange={(e) => setPriceForm((f) => ({ ...f, moq: e.target.value }))} className="input num" />
              </div>
              <div>
                <label className="label">وضعیت</label>
                <Switch checked={priceForm.active} onChange={(v) => setPriceForm((f) => ({ ...f, active: v }))} label="فعال برای فروش" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setQuickEdit(null)} className="btn-ghost btn-sm">
                انصراف
              </button>
              <button onClick={saveQuickEdit} className="btn-primary btn-sm">
                <Icon name="check-circle" className="h-4 w-4" />
                ذخیره تغییرات
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/** محاسبه‌گر سریع هزینه ارسال */
const ShippingCalc = () => {
  const [kg, setKg] = useState(25);
  return (
    <div className="space-y-2">
      <input type="range" min={5} max={150} value={kg} onChange={(e) => setKg(Number(e.target.value))} className="w-full accent-amber-600" />
      <div className="flex items-center justify-between rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
        <div>
          <p className="num text-[12px] text-ink-500">{faNum(kg)} کیلوگرم</p>
          <p className="text-[10px] text-ink-400">وزن تقریبی محموله</p>
        </div>
        <p className="num text-[14px] font-extrabold text-ink-900 dark:text-ink-50">{toman(shippingCostByWeight(kg))}</p>
      </div>
    </div>
  );
};

export default SnacksAdmin;
