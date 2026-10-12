import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Pagination, Stat, Tabs, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { jalaliDate, timeAgo, toman, tomanShort, faNum } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { rfqs } from '@/data/crm';
import type { RFQ } from '@/lib/types';

const STATUS_META: Record<RFQ['status'], { label: string; tone: 'info' | 'brand' | 'success' | 'danger' | 'neutral' }> = {
  new: { label: 'جدید', tone: 'info' },
  quoted: { label: 'پیشنهاد ارسال شد', tone: 'brand' },
  accepted: { label: 'پذیرفته‌شده', tone: 'success' },
  rejected: { label: 'رد شده', tone: 'danger' },
  expired: { label: 'منقضی', tone: 'neutral' },
};

const PRIORITY_META: Record<RFQ['priority'], { label: string; tone: 'danger' | 'warning' | 'neutral' }> = {
  high: { label: 'فوری', tone: 'danger' },
  normal: { label: 'معمولی', tone: 'warning' },
  low: { label: 'کم‌اهمیت', tone: 'neutral' },
};

const RfqAdmin = () => {
  const storeRfqs = useStore((s) => s.rfqs);
  const logAction = useStore((s) => s.logAction);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [quoted, setQuoted] = useState<RFQ | null>(null);
  const [quotePrices, setQuotePrices] = useState<Record<string, number>>({});
  const PER = 10;

  const all = useMemo(() => [...storeRfqs, ...rfqs], [storeRfqs]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return all.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false;
      if (term && !r.code.includes(term) && !r.customerName.includes(term)) return false;
      return true;
    });
  }, [all, q, tab]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);

  const openQuote = (r: RFQ) => {
    const initial: Record<string, number> = {};
    r.items.forEach((it, i) => {
      initial[`${r.id}-${i}`] = it.targetPrice ?? Math.round(1_800_000 * (1 + i * 0.15));
    });
    setQuotePrices(initial);
    setQuoted(r);
  };

  const quotedTotal = quoted ? quoted.items.reduce((s, it, i) => s + (quotePrices[`${quoted.id}-${i}`] ?? 0) * it.qty, 0) : 0;

  return (
    <AdminPage
      title="استعلام قیمت (RFQ)"
      subtitle={`${faNum(all.filter((r) => r.status === 'new').length)} استعلام جدید در انتظار پاسخ • میانگین زمان پاسخ ۴ ساعت`}
      icon="clipboard"
      actions={
        <button className="btn-ghost btn-sm" onClick={() => toast('خروجی اکسل استعلام‌ها آماده شد (نمایشی)')}>
          <Icon name="sheet" className="h-4 w-4" />
          خروجی اکسل
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="استعلام‌های جدید" value={faNum(all.filter((r) => r.status === 'new').length)} icon="clipboard" tone="info" />
        <Stat label="در انتظار تأیید مشتری" value={faNum(all.filter((r) => r.status === 'quoted').length)} icon="clock" tone="accent" />
        <Stat label="تبدیل‌شده به سفارش" value={faNum(all.filter((r) => r.status === 'accepted').length)} icon="check-circle" />
        <Stat
          label="ارزش استعلام‌های باز"
          value={tomanShort(all.filter((r) => ['new', 'quoted'].includes(r.status)).reduce((s, r) => s + r.items.reduce((x, i) => x + (i.targetPrice ?? 0) * i.qty, 0), 0))}
          icon="chart"
        />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی کد استعلام یا نام مشتری…" />
        <Tabs
          size="sm"
          active={tab}
          onChange={(t) => { setTab(t); setPage(1); }}
          tabs={[
            { id: 'all', label: 'همه', count: all.length },
            { id: 'new', label: 'جدید', count: all.filter((r) => r.status === 'new').length },
            { id: 'quoted', label: 'پاسخ داده‌شده', count: all.filter((r) => r.status === 'quoted').length },
            { id: 'accepted', label: 'پذیرفته‌شده' },
            { id: 'rejected', label: 'رد شده' },
          ]}
        />
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>کد</th>
            <th>مشتری</th>
            <th>اقلام درخواستی</th>
            <th>ارزش تقریبی</th>
            <th>اولویت</th>
            <th>ثبت</th>
            <th>اعتبار پیشنهاد</th>
            <th>وضعیت</th>
            <th>اقدام</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={9} text="استعلامی با این فیلترها یافت نشد" />
          ) : (
            items.map((r) => (
              <tr key={r.id}>
                <td className="num font-bold">{r.code}</td>
                <td>
                  <span className="font-semibold">{r.customerName}</span>
                  {r.branchName && <span className="block text-[10.5px] text-ink-400">شعبه {r.branchName}</span>}
                </td>
                <td className="max-w-[260px]">
                  <span className="block truncate text-[11.5px]">{r.items.map((i) => i.title).join(' ، ')}</span>
                  <span className="num text-[10.5px] text-ink-400">{faNum(r.items.length)} قلم</span>
                </td>
                <td className="num font-bold">
                  {tomanShort(r.items.reduce((s, i) => s + (i.targetPrice ?? 0) * i.qty, 0))}
                </td>
                <td>
                  <Badge tone={PRIORITY_META[r.priority].tone}>{PRIORITY_META[r.priority].label}</Badge>
                </td>
                <td className="text-[11px] text-ink-400">{timeAgo(r.createdAt)}</td>
                <td className="num text-[11px]">{jalaliDate(r.validUntil)}</td>
                <td>
                  <Badge tone={STATUS_META[r.status].tone}>{STATUS_META[r.status].label}</Badge>
                </td>
                <td>
                  {r.status === 'new' ? (
                    <button className="btn-primary btn-sm" onClick={() => openQuote(r)}>
                      <Icon name="send" className="h-3.5 w-3.5" />
                      ثبت پیشنهاد
                    </button>
                  ) : (
                    <span className="num text-[11px] text-ink-400">{r.quotedTotal ? tomanShort(r.quotedTotal) : '—'}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Modal
        open={!!quoted}
        onClose={() => setQuoted(null)}
        title={`ثبت پیشنهاد قیمت — ${quoted?.code ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <span className="num text-[12px] font-extrabold">جمع پیشنهاد: {toman(quotedTotal, false)} تومان</span>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setQuoted(null)}>
                انصراف
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (quoted) {
                    logAction({ userId: 'u-002', userName: 'مدیر فروش', roleId: 'sales-manager', action: 'ثبت پیشنهاد قیمت RFQ', entity: 'RFQ', entityId: quoted.id, detail: `${quoted.code} — ${toman(quotedTotal, false)} تومان`, severity: 'info' });
                    toast(`پیشنهاد قیمت برای ${quoted.customerName} ارسال شد (نمایشی)`);
                  }
                  setQuoted(null);
                }}
              >
                <Icon name="send" className="h-4 w-4" />
                ارسال پیشنهاد به مشتری
              </button>
            </div>
          </div>
        }
      >
        {quoted && (
          <div className="space-y-3">
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="text-[11.5px] leading-6">
                مشتری: <span className="font-bold">{quoted.customerName}</span> • تاریخ ثبت: <span className="num">{jalaliDate(quoted.createdAt)}</span> • اعتبار پیشنهاد تا:{' '}
                <span className="num">{jalaliDate(quoted.validUntil)}</span>
              </p>
              {quoted.note && <p className="mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">یادداشت مشتری: {quoted.note}</p>}
            </Card>

            <TableWrap>
              <thead>
                <tr>
                  <th>کالا</th>
                  <th>برند پیشنهادی مشتری</th>
                  <th>تعداد</th>
                  <th>قیمت هدف مشتری</th>
                  <th>قیمت پیشنهادی شما</th>
                  <th>جمع</th>
                </tr>
              </thead>
              <tbody>
                {quoted.items.map((it, i) => {
                  const key = `${quoted.id}-${i}`;
                  const price = quotePrices[key] ?? 0;
                  return (
                    <tr key={key}>
                      <td className="font-semibold">{it.title}</td>
                      <td>{it.brandHint}</td>
                      <td className="num">
                        {faNum(it.qty)} {it.unit}
                      </td>
                      <td className="num text-[11px] text-ink-400">{it.targetPrice ? toman(it.targetPrice, false) : '—'}</td>
                      <td>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setQuotePrices({ ...quotePrices, [key]: Number(e.target.value) })}
                          className="input num py-1.5 text-[11.5px]"
                        />
                      </td>
                      <td className="num font-bold">{toman(price * it.qty, false)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="شرایط تسویه پیشنهادی">
                <select className="select">
                  <option>نقدی (۳٪ تخفیف)</option>
                  <option>اعتباری ۳۰ روزه</option>
                  <option>اعتباری ۴۵ روزه</option>
                  <option>چک ۶۰ روزه</option>
                </select>
              </Field>
              <Field label="مدت اعتبار پیشنهاد">
                <select className="select">
                  <option>۷ روز</option>
                  <option>۱۴ روز</option>
                  <option>۳۰ روز</option>
                </select>
              </Field>
            </div>
            <Field label="یادداشت داخلی / متن ارسالی به مشتری">
              <textarea rows={3} className="input" defaultValue="با توجه به حجم درخواستی، امکان تخصیص تخفیف پیمانی ۶٪ و ارسال رایگان در تهران فراهم است." />
            </Field>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default RfqAdmin;
