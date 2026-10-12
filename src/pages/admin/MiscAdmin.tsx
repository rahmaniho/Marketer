/**
 * پنل ادمین تفکیکی ماژول «سایر کالاهای مصرفی سوپرمارکتی»
 * — مدیریت برندها (با تگ صنعت)، دسته‌بندی درختی، ویژگی‌های تخصصی، مجوزها (دامپزشکی، استاندارد)،
 *   مدیریت فصلی، گزارش تفکیکی (کالاهای مصرفی در مقابل سایر ماژول‌ها)، موجودی اقلام حجیم، وزن و حجم ارسال
 * — کارن سافت (Karen-soft.ir)
 */
import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  DemoNote,
  Field,
  Modal,
  SectionTitle,
  Stat,
  Switch,
  TableWrap,
  Tabs,
  useToast,
} from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ChartCard, CategoryPieChart, MultiLineChart } from '@/components/Charts';
import { useCompliance, useStore } from '@/store/useStore';
import { faNum, jalaliDate, toman, tomanShort } from '@/lib/format';
import type { Compliance, ComplianceKind, LicenseStatus, ModuleKey } from '@/lib/types';
import {
  MS_INDUSTRY_LABELS,
  ComplianceCard,
  CompliancePill,
  bulkyItems,
  cartonWeightKg,
  competitorPriceHints,
  marketShare,
  monthlySalesByModule,
  msBrands,
  msCategories,
  msProducts,
  msRootCategories,
  msSuppliers,
  basketPairs,
  ocrDemo,
  seasonalDemand,
  shippingCostByWeight,
  topBrandsOf,
} from '@/modules/misc';

const STATUS_LABELS: Record<string, string> = {
  valid: 'معتبر',
  expiring: 'رو به انقضا',
  pending: 'در حال بررسی',
  expired: 'منقضی',
};

const COMPLIANCE_KINDS: ComplianceKind[] = [
  'مجوز دامپزشکی',
  'پروانه بهداشت',
  'پروانه ساخت',
  'IRC',
  'استاندارد ملی',
  'Child-safe',
  'Recyclable',
];

const MiscAdmin = () => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const compliance = useCompliance();
  const upsertCompliance = useStore((s) => s.upsertCompliance);
  const { toast } = useToast();

  const [tab, setTab] = useState('flags');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [complianceModal, setComplianceModal] = useState<Compliance | null>(null);
  const [weight, setWeight] = useState(80);

  const modules = settings.modules ?? { food: true, detergent: true, hygiene: true, misc: true, snacks: true };

  const msBrandsFiltered = useMemo(
    () => (industryFilter === 'all' ? msBrands : msBrands.filter((b) => b.industry === industryFilter)),
    [industryFilter],
  );

  const attrStats = useMemo(() => {
    const materials = new Map<string, number>();
    const compat = new Map<string, number>();
    let seasonal = 0;
    let electric = 0;
    let pet = 0;
    msProducts.forEach((p) => {
      const m = p.misc?.material ?? '';
      if (m) {
        const key = m.split(' ')[0];
        materials.set(key, (materials.get(key) ?? 0) + 1);
      }
      if (p.misc?.compatibility) {
        const key = p.misc.compatibility.split('،')[0];
        compat.set(key, (compat.get(key) ?? 0) + 1);
      }
      if (p.misc?.isSeasonal) seasonal++;
      if (p.misc?.voltage || p.misc?.wattage) electric++;
      if (p.misc?.animalType) pet++;
    });
    return { materials, compat, seasonal, electric, pet };
  }, []);

  const salesData = useMemo(
    () => monthlySalesByModule.map((m) => ({ label: m.month, food: m.food, detergent: m.detergent, hygiene: m.hygiene, misc: m.misc })),
    [],
  );
  const splitPie = useMemo(() => {
    const sum = (f: (m: (typeof monthlySalesByModule)[number]) => number) => monthlySalesByModule.reduce((s, m) => s + f(m), 0);
    return [
      { name: 'غذایی', value: sum((m) => m.food) },
      { name: 'شوینده', value: sum((m) => m.detergent) },
      { name: 'بهداشتی', value: sum((m) => m.hygiene) },
      { name: 'کالاهای مصرفی', value: sum((m) => m.misc) },
    ];
  }, []);

  const bulky = useMemo(() => bulkyItems(), []);
  const topBrands = useMemo(() => topBrandsOf(8), []);
  const msCompliance = useMemo(() => compliance.filter((c) => c.module === 'misc'), [compliance]);

  const saveCompliance = (c: Compliance) => {
    upsertCompliance(c);
    setComplianceModal(null);
    toast('مجوز / استاندارد ذخیره شد', 'success');
  };

  return (
    <div className="space-y-5">
      <SectionTitle
        title="ماژول سایر کالاهای مصرفی سوپرمارکتی"
        subtitle="مدیریت تفکیکی برندها، ویژگی‌ها، مجوزهای دامپزشکی و استاندارد، فصل‌ها، موجودی و گزارش‌های صنف — کارن سافت"
        icon="box"
        action={
          <Badge tone={modules.misc ? 'success' : 'danger'} icon="settings">
            وضعیت ماژول: {modules.misc ? 'فعال' : 'غیرفعال'}
          </Badge>
        }
      />

      <DemoNote icon="info">
        داده‌های این ماژول در پوشه <code className="num">/data/misc/</code> نگهداری می‌شوند و با Feature Flag قابل فعال/غیرفعال است. خاموش کردن ماژول،
        محصولات و آفرهای آن را از کل پلتفرم پنهان می‌کند.
      </DemoNote>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'flags', label: 'تنظیمات ماژول', icon: 'settings' },
          { id: 'brands', label: 'برندها', icon: 'badge', count: msBrands.length },
          { id: 'cats', label: 'دسته‌بندی درختی', icon: 'layers', count: msCategories.length },
          { id: 'attrs', label: 'ویژگی‌های تخصصی', icon: 'sliders' },
          { id: 'compliance', label: 'مجوزها و استانداردها', icon: 'shield', count: msCompliance.length },
          { id: 'seasonal', label: 'مدیریت فصلی', icon: 'calendar' },
          { id: 'reports', label: 'گزارش تفکیکی', icon: 'chart' },
          { id: 'warehouse', label: 'موجودی انبار', icon: 'warehouse', count: bulky.length },
          { id: 'logistics', label: 'وزن و حجم ارسال', icon: 'truck' },
        ]}
      />

      {/* ───────── تنظیمات ماژول (Feature Flags) */}
      {tab === 'flags' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-2 text-[14px] font-extrabold text-ink-800 dark:text-ink-100">Feature Flag ماژول‌ها</h3>
            <Switch
              checked={modules.misc}
              onChange={(v) => {
                updateSettings({ modules: { ...modules, misc: v } });
                toast(v ? 'ماژول کالاهای مصرفی فعال شد' : 'ماژول کالاهای مصرفی غیرفعال شد — محصولات از کاتالوگ پنهان می‌شوند', v ? 'success' : 'error');
              }}
              label="ماژول سایر کالاهای مصرفی سوپرمارکتی"
              description="لوازم‌التحریر، باتری، لوازم جانبی موبایل، لوازم برقی کوچک، ظروف آشپزخانه، حیوانات خانگی، محصولات فصلی، ملزومات خانه"
            />
            <Switch
              checked={modules.detergent}
              onChange={(v) => updateSettings({ modules: { ...modules, detergent: v } })}
              label="ماژول شوینده و پاک‌کننده"
              description="پودر و مایع لباسشویی/ظرفشویی، سفیدکننده، جرم‌گیر"
            />
            <Switch
              checked={modules.hygiene}
              onChange={(v) => updateSettings({ modules: { ...modules, hygiene: v } })}
              label="ماژول بهداشتی و آرایشی"
              description="صابون، شامپو، بهداشت دهان، سلولزی، بهداشت بانوان و کودک"
            />
            <Switch
              checked={modules.food}
              onChange={(v) => updateSettings({ modules: { ...modules, food: v } })}
              label="ماژول غذایی (بازارعمده اصلی)"
              description="کاتالوگ مواد غذایی — در حالت عادی فعال باشد"
            />
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="برندهای کالاهای مصرفی" value={faNum(msBrands.length)} icon="badge" tone="brand" />
            <Stat label="محصولات ماژول" value={faNum(msProducts.length)} icon="package" tone="info" />
            <Stat label="دسته‌ها و زیردسته‌ها" value={faNum(msCategories.length)} icon="layers" tone="vip" />
            <Stat label="مجوزها و گواهی‌ها" value={faNum(msCompliance.length)} icon="shield" tone="accent" />
            <Stat label="تأمین‌کنندگان/پخش" value={faNum(msSuppliers.length)} icon="truck" tone="brand" />
            <Stat label="کالاهای حجیم/سنگین" value={faNum(bulky.length)} icon="warehouse" tone="danger" />
          </div>
        </div>
      )}

      {/* ───────── برندها با تگ صنعت */}
      {tab === 'brands' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {['all', 'stationery', 'battery', 'mobile_accessory', 'home_appliance', 'kitchenware', 'pet_supply', 'seasonal', 'household'].map((k) => (
              <button
                key={k}
                onClick={() => setIndustryFilter(k)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${industryFilter === k ? 'bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900' : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'}`}
              >
                {k === 'all' ? 'همه صنایع' : MS_INDUSTRY_LABELS[k]}
              </button>
            ))}
          </div>
          <TableWrap>
            <table className="w-full min-w-[720px] text-right text-[12px]">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <th className="px-3 py-2.5 font-bold">برند</th>
                  <th className="px-3 py-2.5 font-bold">شرکت / کشور</th>
                  <th className="px-3 py-2.5 font-bold">صنعت</th>
                  <th className="px-3 py-2.5 font-bold">خطوط تولید</th>
                  <th className="px-3 py-2.5 font-bold">مجوز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {msBrandsFiltered.slice(0, 40).map((b) => (
                  <tr key={b.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                    <td className="px-3 py-2">
                      <p className="font-bold text-ink-800 dark:text-ink-100">{b.name}</p>
                      <p className="text-[10px] text-ink-400">{b.nameEn}</p>
                    </td>
                    <td className="px-3 py-2 text-ink-500">{b.country}</td>
                    <td className="px-3 py-2">
                      <Badge tone="info">{MS_INDUSTRY_LABELS[b.industry] ?? b.industry}</Badge>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-ink-500">{b.productLines.slice(0, 3).join('، ')}</td>
                    <td className="px-3 py-2">
                      <Badge tone={b.licenseStatus === 'valid' ? 'success' : b.licenseStatus === 'expiring' ? 'warning' : 'neutral'}>{b.licenseCode}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          {msBrandsFiltered.length > 40 && <p className="text-[11px] text-ink-400">نمایش ۴۰ برند اول از {faNum(msBrandsFiltered.length)} برند.</p>}
        </div>
      )}

      {/* ───────── دسته‌بندی درختی */}
      {tab === 'cats' && (
        <div className="grid gap-3 lg:grid-cols-2">
          {msRootCategories.map((root) => (
            <Card key={root.id}>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: root.color }}>
                  <Icon name={root.icon} className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-extrabold text-ink-800 dark:text-ink-100">{root.name}</p>
                  <p className="text-[10px] text-ink-400">{root.nameEn}</p>
                </div>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-1">
                {msCategories
                  .filter((c) => c.parentId === root.id)
                  .map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                      <span className="text-[11px] font-semibold text-ink-700 dark:text-ink-200">{c.name}</span>
                      <Badge tone="neutral">{faNum(msProducts.filter((p) => p.categoryId === c.id).length)}</Badge>
                    </li>
                  ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {/* ───────── ویژگی‌های تخصصی */}
      {tab === 'attrs' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
              <Icon name="cube" className="ml-1 inline h-4 w-4 text-violet-500" />
              جنس / متریال‌های پرتکرار
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[...attrStats.materials.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => (
                <Badge key={k} tone="info">
                  {k} — {faNum(v)} کالا
                </Badge>
              ))}
            </div>
            <h3 className="mb-3 mt-5 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
              <Icon name="phone" className="ml-1 inline h-4 w-4 text-cyan-500" />
              سازگاری‌ها (لوازم جانبی موبایل)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[...attrStats.compat.entries()].slice(0, 10).map(([k, v]) => (
                <Badge key={k} tone="brand">
                  {k} — {faNum(v)} کالا
                </Badge>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">ویژگی‌های پرچم‌دار</h3>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="محصولات فصلی" value={faNum(attrStats.seasonal)} icon="gift" tone="vip" />
                <Stat label="لوازم برقی" value={faNum(attrStats.electric)} icon="zap" tone="brand" />
                <Stat label="حیوانات خانگی" value={faNum(attrStats.pet)} icon="heart" tone="info" />
              </div>
            </Card>
            <Card>
              <h3 className="mb-2 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">پیشنهاد قیمت بهینه (نرخ رقبا)</h3>
              <div className="space-y-2">
                {competitorPriceHints.map((h) => (
                  <div key={h.productName} className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
                    <p className="text-[11px] font-bold text-ink-700 dark:text-ink-200">{h.productName}</p>
                    <p className="mt-1 text-[10px] text-ink-400">
                      قیمت شما {tomanShort(h.ourPrice)} / میانگین بازار {tomanShort(h.marketAvg)}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{h.suggestion}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ───────── مجوزها و استانداردها */}
      {tab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-ink-500">
              <Icon name="shield" className="ml-1 inline h-4 w-4" />
              {faNum(msCompliance.length)} مجوز / گواهی — مجوز دامپزشکی (غذای حیوانات)، پروانه بهداشت (ظروف غذایی)، استاندارد ملی، CE، IRC، Child-safe و Recyclable
            </p>
            <button
              onClick={() =>
                setComplianceModal({
                  id: `msc-new-${Date.now()}`,
                  title: '',
                  kind: 'مجوز دامپزشکی',
                  refCode: '',
                  issuer: 'سازمان دامپزشکی کشور',
                  module: 'misc',
                  issuedAt: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
                  status: 'pending',
                  note: '',
                })
              }
              className="btn-primary btn-sm"
            >
              <Icon name="plus" className="h-4 w-4" />
              مجوز جدید
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {msCompliance.map((c) => (
              <div key={c.id} className="relative">
                <ComplianceCard item={c} brandName={msBrands.find((b) => b.id === c.brandId)?.name} />
                <button onClick={() => setComplianceModal(c)} className="absolute left-3 top-3 rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="ویرایش">
                  <Icon name="edit" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────── مدیریت فصلی */}
      {tab === 'seasonal' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
              <Icon name="calendar" className="ml-1 inline h-4 w-4 text-amber-500" />
              آفرهای مناسبتی — نوروز، رمضان، بازگشایی مدارس، تابستان
            </h3>
            <div className="space-y-2">
              {[
                { title: 'جشنواره نوروزی', period: 'بهمن تا فروردین', discount: '۱۲٪ + ارسال رایگان', status: 'فعال', color: '#a855f7' },
                { title: 'ماه مبارک رمضان', period: 'ماه قمری', discount: '۸٪', status: 'فعال', color: '#14b8a6' },
                { title: 'جشنواره بازگشایی مدارس', period: 'مهر', discount: '۱۰٪', status: 'زمان‌بندی‌شده', color: '#6366f1' },
                { title: 'آفر تابستانه', period: 'تیر تا شهریور', discount: '۷٪', status: 'پیش‌نویس', color: '#06b6d4' },
              ].map((c) => (
                <div key={c.title} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 dark:bg-ink-800/60">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-1.5 rounded-full" style={{ background: c.color }} />
                    <div>
                      <p className="text-[12px] font-bold text-ink-800 dark:text-ink-100">{c.title}</p>
                      <p className="text-[10px] text-ink-400">{c.period} — تخفیف {c.discount}</p>
                    </div>
                  </div>
                  <Badge tone={c.status === 'فعال' ? 'success' : c.status === 'زمان‌بندی‌شده' ? 'info' : 'neutral'}>{c.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
              <Icon name="sparkles" className="ml-1 inline h-4 w-4 text-violet-500" />
              پیش‌بینی تقاضای فصلی (هوش مصنوعی — نمایشی)
            </h3>
            <div className="space-y-2">
              {seasonalDemand.map((s) => (
                <div key={s.season} className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-ink-800 dark:text-ink-100">
                      <Icon name={s.icon} className="h-4 w-4 text-amber-500" />
                      {s.season}
                    </p>
                    <Badge tone={s.index >= 140 ? 'danger' : s.index >= 120 ? 'warning' : 'info'}>شاخص تقاضا {faNum(s.index)}</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-ink-400">
                    {s.months} — {s.tip}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ───────── گزارش تفکیکی */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="فروش تفکیکی ماهانه" subtitle="کالاهای مصرفی در مقابل غذایی، شوینده و بهداشتی (تومان)">
              <MultiLineChart
                data={salesData}
                series={[
                  { key: 'food', name: 'غذایی', color: '#16a34a' },
                  { key: 'detergent', name: 'شوینده', color: '#0ea5e9' },
                  { key: 'hygiene', name: 'بهداشتی', color: '#ec4899' },
                  { key: 'misc', name: 'کالاهای مصرفی', color: '#6366f1' },
                ]}
              />
            </ChartCard>
            <ChartCard title="سهم فروش کل سال" subtitle="ترکیب فروش چهار ماژول">
              <CategoryPieChart data={splitPie} />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">برندهای پرفروش ماژول</h3>
              <div className="space-y-2">
                {topBrands.map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-800/60">
                    <span className="flex items-center gap-2 text-[12px] font-bold text-ink-700 dark:text-ink-200">
                      <Badge tone="info">{faNum(i + 1)}</Badge>
                      {b.name}
                    </span>
                    <span className="num text-[11px] text-ink-500">
                      {faNum(b.sold)} فروش — {tomanShort(b.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-4">
              <Card>
                <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">سهم بازار برندها (درصد)</h3>
                <TableWrap>
                  <table className="w-full text-right text-[11px]">
                    <thead>
                      <tr className="bg-ink-50 text-ink-500 dark:bg-ink-800">
                        <th className="px-2 py-2 font-bold">برند</th>
                        <th className="px-2 py-2 font-bold">لوازم‌التحریر</th>
                        <th className="px-2 py-2 font-bold">باتری</th>
                        <th className="px-2 py-2 font-bold">موبایل</th>
                        <th className="px-2 py-2 font-bold">برقی</th>
                        <th className="px-2 py-2 font-bold">آشپزخانه</th>
                        <th className="px-2 py-2 font-bold">پت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                      {marketShare.map((m) => (
                        <tr key={m.brand}>
                          <td className="px-2 py-1.5 font-semibold text-ink-700 dark:text-ink-200">{m.brand}</td>
                          <td className="num px-2 py-1.5 text-indigo-600">{m.stationery ? `${faNum(m.stationery)}٪` : '—'}</td>
                          <td className="num px-2 py-1.5 text-amber-600">{m.battery ? `${faNum(m.battery)}٪` : '—'}</td>
                          <td className="num px-2 py-1.5 text-cyan-600">{m.mobile ? `${faNum(m.mobile)}٪` : '—'}</td>
                          <td className="num px-2 py-1.5 text-rose-600">{m.appliances ? `${faNum(m.appliances)}٪` : '—'}</td>
                          <td className="num px-2 py-1.5 text-emerald-600">{m.kitchen ? `${faNum(m.kitchen)}٪` : '—'}</td>
                          <td className="num px-2 py-1.5 text-orange-600">{m.pet ? `${faNum(m.pet)}٪` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </Card>

              <Card>
                <h3 className="mb-3 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                  <Icon name="cart" className="ml-1 inline h-4 w-4 text-violet-500" />
                  تحلیل سبد خرید — کدام کالاها با هم خریداری می‌شوند
                </h3>
                <div className="space-y-1.5">
                  {basketPairs.map((pair) => (
                    <div key={`${pair.a}-${pair.b}`} className="rounded-lg bg-ink-50 px-2.5 py-2 text-[10px] dark:bg-ink-800/60">
                      <p className="font-semibold text-ink-700 dark:text-ink-200">
                        {pair.a} <span className="text-violet-500">+</span> {pair.b}
                      </p>
                      <p className="mt-0.5 text-ink-400">
                        پوشش {faNum(pair.support)}٪ — ضریب هم‌خریدی {faNum(pair.lift)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ───────── موجودی انبار */}
      {tab === 'warehouse' && (
        <div className="space-y-4">
          <DemoNote icon="warehouse">
            مدیریت موجودی انبار با در نظر گرفتن ابعاد و وزن — اقلام حجیم (سرویس‌ها، کارتن‌های بزرگ، کیسه‌های غذای حیوانات) نقطه سفارش متفاوت دارند.
          </DemoNote>
          <TableWrap>
            <table className="w-full min-w-[760px] text-right text-[12px]">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50 text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
                  <th className="px-3 py-2.5 font-bold">کالا</th>
                  <th className="px-3 py-2.5 font-bold">ابعاد</th>
                  <th className="px-3 py-2.5 font-bold">موجودی</th>
                  <th className="px-3 py-2.5 font-bold">وزن هر کارتن</th>
                  <th className="px-3 py-2.5 font-bold">جنس</th>
                  <th className="px-3 py-2.5 font-bold">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {bulky.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50 dark:hover:bg-ink-800/50">
                    <td className="px-3 py-2">
                      <p className="font-bold text-ink-800 dark:text-ink-100">{p.name}</p>
                      <p className="text-[10px] text-ink-400">{p.sku} — {p.packDesc}</p>
                    </td>
                    <td className="px-3 py-2 text-ink-500">{p.misc?.dimensions ?? '—'}</td>
                    <td className="num px-3 py-2 text-ink-600 dark:text-ink-200">{faNum(p.stock)} {p.unit}</td>
                    <td className="num px-3 py-2 text-ink-500">{faNum(cartonWeightKg(p))} کیلو</td>
                    <td className="px-3 py-2">
                      <Badge tone="neutral">{p.misc?.material ?? '—'}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={p.stock < 80 ? 'danger' : p.stock < 200 ? 'warning' : 'success'}>
                        {p.stock < 80 ? 'نیاز به تأمین' : p.stock < 200 ? 'در حال کاهش' : 'مناسب'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </div>
      )}

      {/* ───────── وزن و حجم ارسال */}
      {tab === 'logistics' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-2 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
              <Icon name="truck" className="ml-1 inline h-4 w-4 text-violet-500" />
              محاسبه‌گر هزینه ارسال بر اساس وزن
            </h3>
            <Field label="وزن کل سفارش (کیلوگرم)">
              <input
                type="number"
                min={0}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
              />
            </Field>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[12px] dark:bg-ink-800/60">
                <span className="text-ink-500">هزینه برآوردی ارسال</span>
                <span className="num font-extrabold text-ink-800 dark:text-ink-100">{toman(shippingCostByWeight(weight))}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[12px] dark:bg-ink-800/60">
                <span className="text-ink-500">بسته‌بندی پیشنهادی</span>
                <span className="font-bold text-ink-700 dark:text-ink-200">{weight > 300 ? 'پالت + کاور ضدآب' : weight > 60 ? 'کارتن دوبل + شرینک' : 'کارتن استاندارد'}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2 text-[12px] dark:bg-ink-800/60">
                <span className="text-ink-500">اقلام شکستنی (ظروف، شیشه)</span>
                <span className="font-bold text-ink-700 dark:text-ink-200">بسته‌بندی ضربه‌گیر + برچسب شکستنی</span>
              </div>
            </div>
            <DemoNote icon="info">لوازم برقی پیش از ارسال تست سلامت می‌شوند و اقلام فصلی کوتاه‌مدت (ماهی قرمز، سبزه) با تحویل همان‌روز ارسال می‌شوند.</DemoNote>
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="mb-2 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                <Icon name="scan" className="ml-1 inline h-4 w-4 text-sky-500" />
                {ocrDemo.title}
              </h3>
              <p className="text-[11px] leading-relaxed text-ink-500">{ocrDemo.description}</p>
              <div className="mt-2 space-y-1.5">
                {ocrDemo.samples.map((s) => (
                  <div key={s.code} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-[10px] dark:bg-ink-800/60">
                    <span className="num text-ink-500">{s.code}</span>
                    <span className="font-semibold text-ink-700 dark:text-ink-200">{s.label} — {s.expiry}</span>
                    <Badge tone={s.matched ? 'success' : 'warning'}>{s.matched ? 'تطبیق با کاتالوگ' : 'نیاز به بررسی'}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="mb-2 text-[13px] font-extrabold text-ink-800 dark:text-ink-100">
                <Icon name="truck" className="ml-1 inline h-4 w-4 text-teal-500" />
                تأمین‌کنندگان و پخش‌کنندگان ماژول
              </h3>
              <div className="space-y-1.5">
                {msSuppliers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-800/60">
                    <div>
                      <p className="text-[11px] font-bold text-ink-700 dark:text-ink-200">{s.name}</p>
                      <p className="text-[10px] text-ink-400">{s.notes}</p>
                    </div>
                    <Badge tone="info">{MS_INDUSTRY_LABELS[s.supplierType] ?? s.supplierType}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ───────── مودال مجوز */}
      {complianceModal && (
        <Modal open onClose={() => setComplianceModal(null)} title="مجوز / استاندارد">
          <div className="space-y-3">
            <Field label="عنوان" required>
              <input
                value={complianceModal.title}
                onChange={(e) => setComplianceModal({ ...complianceModal, title: e.target.value })}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="نوع مجوز">
                <select
                  value={complianceModal.kind}
                  onChange={(e) => setComplianceModal({ ...complianceModal, kind: e.target.value as ComplianceKind })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                >
                  {COMPLIANCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="شماره مجوز / کد">
                <input
                  value={complianceModal.refCode}
                  onChange={(e) => setComplianceModal({ ...complianceModal, refCode: e.target.value })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                />
              </Field>
              <Field label="صادرکننده">
                <input
                  value={complianceModal.issuer}
                  onChange={(e) => setComplianceModal({ ...complianceModal, issuer: e.target.value })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                />
              </Field>
              <Field label="وضعیت">
                <select
                  value={complianceModal.status}
                  onChange={(e) => setComplianceModal({ ...complianceModal, status: e.target.value as LicenseStatus })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                >
                  {(['valid', 'expiring', 'pending', 'expired'] as LicenseStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="ماژول">
                <select
                  value={complianceModal.module}
                  onChange={(e) => setComplianceModal({ ...complianceModal, module: e.target.value as ModuleKey })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                >
                  <option value="misc">کالاهای مصرفی</option>
                  <option value="detergent">شوینده</option>
                  <option value="hygiene">بهداشتی</option>
                  <option value="food">غذایی</option>
                </select>
              </Field>
              <Field label="تاریخ انقضا">
                <input
                  type="date"
                  value={complianceModal.expiresAt.slice(0, 10)}
                  onChange={(e) => setComplianceModal({ ...complianceModal, expiresAt: new Date(e.target.value).toISOString() })}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
                />
              </Field>
            </div>
            <Field label="توضیحات">
              <textarea
                value={complianceModal.note}
                onChange={(e) => setComplianceModal({ ...complianceModal, note: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-[12px] dark:border-ink-700 dark:bg-ink-900"
              />
            </Field>
            <div className="flex items-center justify-between gap-2 pt-1">
              <CompliancePill item={complianceModal} />
              <div className="flex gap-2">
                <button onClick={() => setComplianceModal(null)} className="btn-ghost btn-sm">
                  انصراف
                </button>
                <button
                  onClick={() => {
                    if (!complianceModal.title.trim()) {
                      toast('عنوان مجوز الزامی است', 'error');
                      return;
                    }
                    saveCompliance(complianceModal);
                  }}
                  className="btn-primary btn-sm"
                >
                  <Icon name="check" className="h-4 w-4" />
                  ذخیره مجوز
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MiscAdmin;
