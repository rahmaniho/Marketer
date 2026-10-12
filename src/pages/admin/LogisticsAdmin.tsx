import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Modal, Progress, Stat, Tabs, TableWrap, useToast } from '@/components/ui';
import { ChartCard, MultiLineChart, RadarMetrics } from '@/components/Charts';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime, timeAgo, tomanShort } from '@/lib/format';
import { useOrders } from '@/store/useStore';
import { drivers, shipments } from '@/data/ops';
import type { Shipment } from '@/lib/types';

const STATUS_META: Record<Shipment['status'], { label: string; tone: 'info' | 'warning' | 'brand' | 'success' | 'danger' }> = {
  scheduled: { label: 'زمان‌بندی‌شده', tone: 'info' },
  loading: { label: 'در حال بارگیری', tone: 'warning' },
  'in-transit': { label: 'در مسیر', tone: 'brand' },
  delivered: { label: 'تحویل‌شده', tone: 'success' },
  failed: { label: 'ناموفق', tone: 'danger' },
};

const TEMPS = ['۲ تا ۴ درجه (سردخانه)', 'منفی ۱۸ درجه (فریزر)', 'دمای محیط (خشک)'];

const LogisticsAdmin = () => {
  const orders = useOrders();
  const { toast } = useToast();
  const [tab, setTab] = useState('shipments');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState<Shipment | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim();
    return shipments.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (term && !s.code.includes(term) && !s.customerName.includes(term) && !s.city.includes(term) && !s.orderCode.includes(term)) return false;
      return true;
    });
  }, [q, status]);

  const delivered = shipments.filter((s) => s.status === 'delivered');
  const onTime = shipments.filter((s) => s.status === 'delivered' && s.podSigned).length;
  const totalKm = shipments.reduce((s, x) => s + x.distanceKm, 0);
  const totalCost = shipments.reduce((s, x) => s + x.cost, 0);

  const dailySeries = useMemo(() => {
    const labels = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    return labels.map((label, i) => {
      const day = shipments.filter((_, idx) => idx % 7 === i);
      return {
        label,
        orders: day.length,
        returns: day.filter((s) => s.status === 'failed').length,
      };
    });
  }, []);

  const driverRadar = useMemo(
    () =>
      drivers.map((d) => ({
        subject: d.name,
        value: Math.min(100, Math.round((d.todayStops / Math.max(1, d.todayKm / 10)) * 25)),
      })),
    [],
  );

  return (
    <AdminPage
      title="لجستیک و ارسال"
      subtitle={`${faNum(shipments.length)} محموله • ${faNum(drivers.length)} راننده • میانگین ${faNum(totalKm / Math.max(1, shipments.length), 1)} کیلومتر در هر مسیر`}
      icon="truck"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => toast('مسیرهای امروز بهینه‌سازی شد (نمایشی)')}>
            <Icon name="route" className="h-4 w-4" />
            بهینه‌سازی مسیر
          </button>
          <button className="btn-primary btn-sm" onClick={() => setPlanOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            برنامه ارسال جدید
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="تحویل موفق" value={faNum(delivered.length)} icon="check-circle" hint={`از ${faNum(shipments.length)} محموله`} />
        <Stat label="نرخ تحویل با امضای دیجیتال" value={`${faNum((onTime / Math.max(1, delivered.length)) * 100, 1)}٪`} icon="signature" tone="info" />
        <Stat label="هزینه حمل" value={tomanShort(totalCost)} icon="wallet" tone="accent" />
        <Stat label="محموله‌های ناموفق" value={faNum(shipments.filter((s) => s.status === 'failed').length)} icon="alert" tone="danger" />
      </div>

      <AdminToolbar>
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'shipments', label: 'محموله‌ها', icon: 'truck', count: shipments.length },
            { id: 'drivers', label: 'رانندگان', icon: 'bike', count: drivers.length },
            { id: 'returns', label: 'مرجوعی‌ها', icon: 'undo', count: orders.filter((o) => o.hasReturn).length },
            { id: 'analytics', label: 'تحلیل حمل', icon: 'chart' },
          ]}
        />
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی کد محموله، سفارش، مشتری یا شهر…" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_META) as Shipment['status'][]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </AdminToolbar>

      {tab === 'shipments' && (
        <TableWrap>
          <thead>
            <tr>
              <th>کد محموله</th>
              <th>سفارش</th>
              <th>مشتری / شهر</th>
              <th>راننده</th>
              <th>خودرو</th>
              <th>توقف‌ها</th>
              <th>وزن</th>
              <th>دما</th>
              <th>زمان برنامه</th>
              <th>وضعیت</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow colSpan={11} text="محموله‌ای با این فیلترها یافت نشد" />
            ) : (
              filtered.slice(0, 30).map((s) => (
                <tr key={s.id}>
                  <td className="num font-bold" dir="ltr">
                    {s.code}
                  </td>
                  <td className="num text-[11px]">{s.orderCode}</td>
                  <td>
                    <span className="font-semibold">{s.customerName}</span>
                    <span className="block text-[10.5px] text-ink-400">{s.city}</span>
                  </td>
                  <td>
                    {s.driverName}
                    <span className="num block text-[10.5px] text-ink-400">{s.driverPhone}</span>
                  </td>
                  <td className="text-[11px]">
                    {s.vehicle}
                    <span className="num block text-[10.5px] text-ink-400" dir="ltr">
                      {s.plate}
                    </span>
                  </td>
                  <td className="num">
                    {faNum(s.completedStops)} / {faNum(s.stops)}
                  </td>
                  <td className="num">{faNum(s.weightKg)} کیلو</td>
                  <td className="text-[11px]">{s.temperature ?? '—'}</td>
                  <td className="num text-[11px]">{jalaliDateTime(s.plannedAt)}</td>
                  <td>
                    <Badge tone={STATUS_META[s.status].tone}>{STATUS_META[s.status].label}</Badge>
                    {s.podSigned && <Badge tone="success" className="mt-1" icon="signature">POD</Badge>}
                  </td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => setDetail(s)}>
                      <Icon name="location" className="h-3.5 w-3.5" />
                      پیگیری
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      )}

      {tab === 'drivers' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon name="bike" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold">{d.name}</p>
                    <p className="num text-[10.5px] text-ink-400">{d.phone}</p>
                  </div>
                </div>
                <Badge tone={d.status === 'available' ? 'success' : d.status === 'on-route' ? 'info' : 'neutral'}>
                  {d.status === 'available' ? 'آماده اعزام' : d.status === 'on-route' ? 'در مسیر' : 'مرخصی'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">منطقه</span>
                  <span className="font-bold">{d.zone}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">ظرفیت</span>
                  <span className="num font-bold">{faNum(d.capacityKg)} کیلو</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">توقف امروز</span>
                  <span className="num font-bold">{faNum(d.todayStops)}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">مسافت امروز</span>
                  <span className="num font-bold">{faNum(d.todayKm)} کیلومتر</span>
                </div>
              </div>
              <div>
                <p className="num mb-1 text-[11px] font-bold">امتیاز عملکرد: {faNum(d.rating, 1)} از ۵</p>
                <Progress value={(d.rating / 5) * 100} label={`${d.vehicle} — ${d.plate}`} />
              </div>
              <button className="btn-ghost btn-sm w-full" onClick={() => toast(`اتصال تلفنی به ${d.name} (نمایشی)`)}>
                <Icon name="phone" className="h-3.5 w-3.5" />
                تماس با راننده
              </button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'returns' && (
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">مرجوعی‌ها و مغایرت‌های تحویل</p>
          <TableWrap>
            <thead>
              <tr>
                <th>سفارش</th>
                <th>مشتری</th>
                <th>مبلغ</th>
                <th>دلیل ثبت‌شده</th>
                <th>وضعیت</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .filter((o) => o.hasReturn)
                .slice(0, 12)
                .map((o) => (
                  <tr key={o.id}>
                    <td className="num font-bold">{o.code}</td>
                    <td>{o.customerName}</td>
                    <td className="num">{tomanShort(o.grandTotal)}</td>
                    <td className="text-[11px]">
                      {['آسیب بسته‌بندی در حمل', 'مغایرت تعداد', 'نزدیک انقضا در زمان تحویل', 'سفارش اشتباه مشتری'][o.code.length % 4]}
                    </td>
                    <td>
                      <Badge tone={o.status === 'returned' ? 'success' : 'warning'}>
                        {o.status === 'returned' ? 'مرجوع و تسویه‌شده' : 'در حال بررسی'}
                      </Badge>
                    </td>
                    <td>
                      <button className="btn-ghost btn-sm" onClick={() => toast('درخواست مرجوعی تأیید شد (نمایشی)')}>
                        تأیید مرجوعی
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {tab === 'analytics' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <ChartCard title="حجم ارسال روزهای هفته" subtitle="تعداد محموله و ناموفق‌ها">
            <MultiLineChart
              data={dailySeries}
              series={[
                { key: 'orders', name: 'محموله', color: '#0f684c' },
                { key: 'returns', name: 'ناموفق', color: '#e11d48' },
              ]}
            />
          </ChartCard>
          <ChartCard title="بهره‌وری رانندگان" subtitle="شاخص ترکیبی توقف و مسافت">
            <RadarMetrics data={driverRadar} />
          </ChartCard>
          <Card className="lg:col-span-2">
            <p className="mb-3 text-[12.5px] font-extrabold">شاخص‌های کلیدی حمل (KPI)</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['میانگین هزینه هر محموله', tomanShort(totalCost / Math.max(1, shipments.length))],
                ['میانگین مسافت هر مسیر', `${faNum(totalKm / Math.max(1, shipments.length), 1)} کیلومتر`],
                ['میانگین توقف در هر مسیر', faNum(shipments.reduce((s, x) => s + x.stops, 0) / Math.max(1, shipments.length), 1)],
                ['نرخ تحویل بدون مغایرت', `${faNum((onTime / Math.max(1, shipments.length)) * 100, 1)}٪`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                  <p className="text-[11px] text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-1 text-[15px] font-extrabold">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              {drivers.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{d.name}</span>
                    <span className="num text-ink-500 dark:text-ink-400">{faNum(d.todayKm)} کیلومتر امروز</span>
                  </div>
                  <MiniBar value={d.todayKm} max={Math.max(...drivers.map((x) => x.todayKm))} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`پیگیری محموله ${detail?.code ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('بارنامه و اسناد ارسال دانلود شد (نمایشی)')}>
              <Icon name="download" className="h-4 w-4" />
              بارنامه
            </button>
            <button className="btn-primary" onClick={() => setDetail(null)}>
              بستن
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-3 text-[11.5px]">
              {[
                ['سفارش', detail.orderCode],
                ['مشتری', detail.customerName],
                ['شهر', detail.city],
                ['راننده', `${detail.driverName} — ${detail.driverPhone}`],
                ['خودرو', `${detail.vehicle} (${detail.plate})`],
                ['وزن محموله', `${faNum(detail.weightKg)} کیلوگرم`],
                ['دمای نگهداری', detail.temperature ?? 'دمای محیط'],
                ['هزینه حمل', tomanShort(detail.cost)],
                ['امضای تحویل (POD)', detail.podSigned ? 'ثبت شده' : 'ثبت نشده'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>

            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-3 text-[12px] font-extrabold">مسیر و توقف‌ها</p>
              <div className="space-y-2.5">
                {Array.from({ length: detail.stops }, (_, i) => {
                  const done = i < detail.completedStops;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] ${
                          done ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-500 dark:bg-ink-700 dark:text-ink-300'
                        }`}
                      >
                        {faNum(i + 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px] font-semibold">
                          {i === 0 ? 'انبار مبدأ — بارگیری' : i === detail.stops - 1 ? `${detail.customerName} (${detail.city})` : `مشتری مسیر شماره ${faNum(i + 1)}`}
                        </p>
                        <p className="text-[10.5px] text-ink-400">{done ? 'انجام‌شده' : 'در انتظار'}</p>
                      </div>
                      {done && <Icon name="check-circle" className="h-4 w-4 text-brand-600" />}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <p className="mb-2 text-[12px] font-extrabold">گواهی تحویل (POD)</p>
              {detail.podSigned ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-20 w-40 items-center justify-center rounded-xl border border-dashed border-brand-300 bg-brand-50/60 text-[11px] text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                    امضای دیجیتال گیرنده ثبت شده
                  </div>
                  <div className="text-[11px] text-ink-500 dark:text-ink-400">
                    <p>زمان ثبت: {detail.deliveredAt ? jalaliDateTime(detail.deliveredAt) : timeAgo(detail.plannedAt)}</p>
                    <p className="num mt-1" dir="ltr">
                      Hash: 8f2c…b7e1
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
                  امضای تحویل ثبت نشده است. پس از تحویل، راننده در اپلیکیشن راننده امضای دیجیتال گیرنده را ثبت می‌کند.
                </p>
              )}
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="برنامه‌ریزی ارسال جدید"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setPlanOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                toast('محموله زمان‌بندی شد و به راننده ابلاغ گردید (نمایشی)');
                setPlanOpen(false);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ثبت و ابلاغ
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[12px]">
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/50">
            <p className="font-bold">پیشنهاد سیستم (نمایشی)</p>
            <p className="mt-1 leading-6 text-ink-500 dark:text-ink-400">
              ۷ سفارش آماده ارسال در محدوده شمال تهران شناسایی شد. ترکیب آن‌ها در یک مسیر،{' '}
              <span className="num font-bold">۳۱٪ کاهش هزینه حمل</span> و{' '}
              <span className="num font-bold">۴۸ دقیقه کاهش زمان</span> مسیر به همراه دارد.
            </p>
          </div>
          {[
            ['انتخاب سفارش‌های آماده ارسال', '۱۲ سفارش در انتظار'],
            ['تخصیص راننده و خودرو', 'کامران راد — کامیونت ایسوزو'],
            ['بازه زمانی تحویل', '۹ تا ۱۲ امروز'],
            ['دمای نگهداری محموله', TEMPS[0]],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 dark:border-ink-700">
              <span className="text-ink-500 dark:text-ink-400">{l}</span>
              <span className="num font-bold">{v}</span>
            </div>
          ))}
        </div>
      </Modal>
    </AdminPage>
  );
};

export default LogisticsAdmin;
