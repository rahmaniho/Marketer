import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Modal, Pagination, Stat, TableWrap, useToast } from '@/components/ui';
import { ChartCard, RadarMetrics, SalesAreaChart } from '@/components/Charts';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, jalaliDateTime, timeAgo, tomanShort } from '@/lib/format';
import { visits as seedVisits } from '@/data/crm';
import { calendarEvents } from '@/data/content';
import { REPS_LIST } from '@/data/ops';
import type { Visit } from '@/lib/types';

const STATUS_META: Record<Visit['status'], { label: string; tone: 'info' | 'success' | 'neutral' | 'danger' }> = {
  planned: { label: 'برنامه‌ریزی‌شده', tone: 'info' },
  done: { label: 'انجام‌شده', tone: 'success' },
  canceled: { label: 'لغو شده', tone: 'neutral' },
  missed: { label: 'انجام‌نشده', tone: 'danger' },
};

const VisitsAdmin = () => {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [rep, setRep] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Visit | null>(null);
  const PER = 12;

  const filtered = useMemo(() => {
    const term = q.trim();
    return seedVisits.filter((v) => {
      if (status !== 'all' && v.status !== status) return false;
      if (rep !== 'all' && v.repId !== rep) return false;
      if (term && !v.customerName.includes(term) && !v.purpose.includes(term) && !v.repName.includes(term)) return false;
      return true;
    });
  }, [q, status, rep]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);
  const done = seedVisits.filter((v) => v.status === 'done');
  const totalKm = seedVisits.reduce((s, v) => s + v.distanceKm, 0);
  const orderAmount = seedVisits.filter((v) => v.orderPlaced).reduce((s, v) => s + v.orderAmount, 0);

  const repSeries = useMemo(
    () =>
      REPS_LIST.map((r) => {
        const mine = seedVisits.filter((v) => v.repId === r.id && v.status === 'done');
        return {
          label: r.name,
          sales: mine.filter((v) => v.orderPlaced).reduce((s, v) => s + v.orderAmount, 0),
          orders: mine.filter((v) => v.orderPlaced).length,
        };
      }),
    [],
  );

  const radar = useMemo(
    () =>
      REPS_LIST.map((r) => {
        const mine = seedVisits.filter((v) => v.repId === r.id);
        const ok = mine.filter((v) => v.orderPlaced).length;
        return { subject: r.name, value: Math.round((ok / Math.max(1, mine.length)) * 100) };
      }),
    [],
  );

  return (
    <AdminPage
      title="ویزیت‌های میدانی"
      subtitle="پایش عملکرد ویزیتورها — در پلتفرم بازارعمده، سفارش‌گیری آنلاین جای ویزیت فیزیکی را می‌گیرد"
      icon="map"
      actions={
        <button className="btn-ghost btn-sm" onClick={() => toast('مسیر بهینه ویزیت هفته آینده ساخته شد (نمایشی)')}>
          <Icon name="route" className="h-4 w-4" />
          بهینه‌سازی مسیر
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="ویزیت‌های انجام‌شده" value={faNum(done.length)} icon="check-circle" hint={`از ${faNum(seedVisits.length)} ویزیت برنامه‌ریزی‌شده`} />
        <Stat label="نرخ تبدیل ویزیت به سفارش" value={`${faNum((done.filter((v) => v.orderPlaced).length / Math.max(1, done.length)) * 100, 1)}٪`} icon="target" tone="info" />
        <Stat label="ارزش سفارش از ویزیت" value={tomanShort(orderAmount)} icon="chart" tone="accent" />
        <Stat label="مسافت پیموده‌شده" value={`${faNum(totalKm)} کیلومتر`} icon="map" tone="danger" hint="هزینه سوخت و زمان" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="عملکرد ویزیتورها" subtitle="ارزش سفارش جذب‌شده در ویزیت‌های انجام‌شده">
          <SalesAreaChart data={repSeries} />
        </ChartCard>
        <ChartCard title="نرخ موفقیت هر ویزیتور" subtitle="درصد ویزیت‌های منجر به سفارش">
          <RadarMetrics data={radar} />
        </ChartCard>
      </div>

      <Card className="bg-brand-50/60 dark:bg-brand-900/20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Icon name="sparkles" className="h-5 w-5" />
          </span>
          <div className="min-w-[240px] flex-1">
            <p className="text-[12.5px] font-extrabold text-brand-900 dark:text-brand-100">تحلیل حذف ویزیت فیزیکی</p>
            <p className="num mt-1 text-[11.5px] leading-6 text-brand-800 dark:text-brand-200">
              هزینه هر ویزیت میدانی (سوخت، زمان، حقوق) حدود <span className="font-bold">۴۲۰٫۰۰۰ تومان</span> است و میانگین نرخ تبدیل آن تنها{' '}
              <span className="font-bold">{faNum((done.filter((v) => v.orderPlaced).length / Math.max(1, done.length)) * 100, 1)}٪</span>. با
              انتقال سفارش‌گیری به پلتفرم، همان حجم فروش با <span className="font-bold">۳۱٪ کاهش هزینه توزیع</span> و{' '}
              <span className="font-bold">۲٫۴ روز</span> کاهش زمان چرخه سفارش محقق می‌شود.
            </p>
          </div>
        </div>
      </Card>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی مشتری، ویزیتور یا هدف ویزیت…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_META) as Visit['status'][]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select value={rep} onChange={(e) => setRep(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه ویزیتورها</option>
          {REPS_LIST.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>مشتری / سرنخ</th>
            <th>ویزیتور</th>
            <th>هدف ویزیت</th>
            <th>زمان برنامه‌ریزی</th>
            <th>مسافت</th>
            <th>نتیجه</th>
            <th>سفارش</th>
            <th>وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={9} text="ویزیتی با این فیلترها یافت نشد" />
          ) : (
            items.map((v) => (
              <tr key={v.id}>
                <td className="font-semibold">{v.customerName}</td>
                <td className="text-[11.5px]">{v.repName}</td>
                <td className="max-w-[220px] truncate text-[11.5px]">{v.purpose}</td>
                <td className="num text-[11px]">{jalaliDateTime(v.plannedAt)}</td>
                <td className="num">{faNum(v.distanceKm, 1)} کیلومتر</td>
                <td className="max-w-[220px] truncate text-[11px] text-ink-500 dark:text-ink-400">{v.outcome || '—'}</td>
                <td>
                  {v.orderPlaced ? (
                    <Badge tone="success">{tomanShort(v.orderAmount)}</Badge>
                  ) : (
                    <Badge tone="neutral">بدون سفارش</Badge>
                  )}
                </td>
                <td>
                  <Badge tone={STATUS_META[v.status].tone}>{STATUS_META[v.status].label}</Badge>
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(v)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    گزارش
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Card>
        <p className="mb-3 text-[12.5px] font-extrabold">تقویم برنامه ویزیت هفته آینده</p>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {calendarEvents.map((e) => (
            <div key={e.id} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[11.5px] font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                  {e.title}
                </span>
                <Badge tone="neutral">{e.kind}</Badge>
              </div>
              <p className="num mt-1.5 text-[11px] text-ink-500 dark:text-ink-400">{jalaliDate(e.date, 'weekday')} — ساعت {e.time}</p>
              <p className="mt-1 text-[10.5px] text-ink-400">{e.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`گزارش ویزیت — ${detail?.customerName ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('گزارش ویزیت برای مدیر فروش ارسال شد (نمایشی)')}>
              <Icon name="send" className="h-4 w-4" />
              ارسال گزارش
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
                ['ویزیتور', detail.repName],
                ['زمان برنامه', jalaliDateTime(detail.plannedAt)],
                ['زمان انجام', detail.doneAt ? jalaliDateTime(detail.doneAt) : '—'],
                ['مسافت', `${faNum(detail.distanceKm, 1)} کیلومتر`],
                ['موقعیت جغرافیایی', `${detail.geo.lat.toFixed(3)} ، ${detail.geo.lng.toFixed(3)}`],
                ['ثبت سفارش', detail.orderPlaced ? tomanShort(detail.orderAmount) : 'بدون سفارش'],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="text-[11.5px] leading-6">
                <span className="font-bold">هدف ویزیت: </span>
                {detail.purpose}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-6">
                <span className="font-bold">نتیجه: </span>
                {detail.outcome || '—'}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-6">
                <span className="font-bold">اقدام بعدی: </span>
                {detail.nextAction || '—'}
              </p>
            </Card>
            <div>
              <p className="mb-2 text-[11.5px] font-bold">تصاویر ثبت‌شده در ویزیت (نمایشی)</p>
              <div className="flex flex-wrap gap-2">
                {detail.photoSeeds.map((s, i) => (
                  <div key={s} className="flex h-20 w-24 items-center justify-center rounded-xl border border-ink-200 bg-ink-100 text-ink-400 dark:border-ink-700 dark:bg-ink-800">
                    <Icon name={i % 2 === 0 ? 'store' : 'package'} className="h-6 w-6" />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10.5px] text-ink-400">آخرین بروزرسانی: {timeAgo(detail.doneAt ?? detail.plannedAt)}</p>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default VisitsAdmin;
