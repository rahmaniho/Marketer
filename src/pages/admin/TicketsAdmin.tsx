import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, EmptyState, Modal, Pagination, Stat, Switch, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime, timeAgo } from '@/lib/format';
import { notifications as seedNotifications, tickets as seedTickets } from '@/data/crm';
import { useStore } from '@/store/useStore';

const TICKET_CATEGORIES: Ticket['category'][] = ['سفارش', 'مالی', 'کیفیت', 'لجستیک', 'فنی', 'پیشنهاد'];
import type { Ticket } from '@/lib/types';

const STATUS_META: Record<Ticket['status'], { label: string; tone: 'info' | 'warning' | 'success' }> = {
  open: { label: 'باز', tone: 'info' },
  pending: { label: 'در انتظار پاسخ مشتری', tone: 'warning' },
  closed: { label: 'بسته‌شده', tone: 'success' },
};

const PRIORITY_META: Record<Ticket['priority'], { label: string; tone: 'danger' | 'warning' | 'neutral' }> = {
  high: { label: 'فوری', tone: 'danger' },
  normal: { label: 'معمولی', tone: 'warning' },
  low: { label: 'کم', tone: 'neutral' },
};

const TicketsAdmin = () => {
  const storeTickets = useStore((s) => s.tickets);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const PER = 10;

  const all = useMemo(() => [...storeTickets, ...seedTickets], [storeTickets]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return all.filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (category !== 'all' && t.category !== category) return false;
      if (term && !t.code.includes(term) && !t.subject.includes(term) && !t.customerName.includes(term)) return false;
      return true;
    });
  }, [all, q, status, category]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);
  const avgNps = all.filter((t) => t.npsScore).reduce((s, t) => s + (t.npsScore ?? 0), 0) / Math.max(1, all.filter((t) => t.npsScore).length);

  return (
    <AdminPage
      title="پشتیبانی و تیکت‌ها"
      subtitle={`${faNum(all.filter((t) => t.status === 'open').length)} تیکت باز • میانگین امتیاز رضایت ${faNum(avgNps, 1)} از ۱۰`}
      icon="lifebuoy"
      actions={
        <button className="btn-ghost btn-sm" onClick={() => toast('پاسخ‌های آماده پشتیبانی به‌روزرسانی شد (نمایشی)')}>
          <Icon name="message" className="h-4 w-4" />
          پاسخ‌های آماده
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="تیکت‌های باز" value={faNum(all.filter((t) => t.status === 'open').length)} icon="lifebuoy" tone="info" />
        <Stat label="در انتظار مشتری" value={faNum(all.filter((t) => t.status === 'pending').length)} icon="clock" tone="accent" />
        <Stat label="بسته‌شده" value={faNum(all.filter((t) => t.status === 'closed').length)} icon="check-circle" />
        <Stat label="میانگین NPS" value={`${faNum(avgNps, 1)} از ۱۰`} icon="award" tone="vip" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی کد تیکت، موضوع یا مشتری…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌ها</option>
          {(Object.keys(STATUS_META) as Ticket['status'][]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه دسته‌ها</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>کد</th>
            <th>موضوع</th>
            <th>مشتری</th>
            <th>دسته</th>
            <th>کانال</th>
            <th>اولویت</th>
            <th>ثبت</th>
            <th>وضعیت</th>
            <th>NPS</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={10} text="تیکتی با این فیلترها یافت نشد" />
          ) : (
            items.map((t) => (
              <tr key={t.id}>
                <td className="num font-bold">{t.code}</td>
                <td className="max-w-[280px] truncate font-semibold">{t.subject}</td>
                <td className="text-[11.5px]">{t.customerName}</td>
                <td className="text-[11.5px]">{t.category}</td>
                <td className="text-[11.5px]">{t.channel}</td>
                <td>
                  <Badge tone={PRIORITY_META[t.priority].tone}>{PRIORITY_META[t.priority].label}</Badge>
                </td>
                <td className="text-[11px] text-ink-400">{timeAgo(t.createdAt)}</td>
                <td>
                  <Badge tone={STATUS_META[t.status].tone}>{STATUS_META[t.status].label}</Badge>
                </td>
                <td className="num">{t.npsScore ? faNum(t.npsScore) : '—'}</td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => { setDetail(t); setReply(''); }}>
                    <Icon name="message" className="h-3.5 w-3.5" />
                    گفت‌وگو
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">توزیع تیکت‌ها بر پایه دسته</p>
          <div className="space-y-2">
            {TICKET_CATEGORIES.map((c) => {
              const count = all.filter((t) => t.category === c).length;
              return (
                <div key={c} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                  <span>{c}</span>
                  <span className="num font-bold">{faNum(count)} تیکت</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">اعلان‌های سیستم</p>
          <div className="space-y-2">
            {seedNotifications.slice(0, 6).map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                <div className="min-w-0">
                  <p className="truncate text-[11.5px] font-semibold">{n.title}</p>
                  <p className="truncate text-[10.5px] text-ink-500 dark:text-ink-400">{n.body}</p>
                </div>
                <span className="num flex-none text-[10.5px] text-ink-400">{timeAgo(n.at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`تیکت ${detail?.code ?? ''} — ${detail?.customerName ?? ''}`}
        size="lg"
        footer={
          <div className="w-full space-y-3">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              className="input"
              placeholder="پاسخ خود را بنویسید…"
            />
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={false} onChange={() => toast('تیکت به کارشناس فنی ارجاع شد (نمایشی)')} label="ارجاع به کارشناس فنی" />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    toast('تیکت بسته شد (نمایشی)');
                    setDetail(null);
                  }}
                >
                  بستن تیکت
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (!reply.trim()) {
                      toast('متن پاسخ را وارد کنید', 'error');
                      return;
                    }
                    toast('پاسخ برای مشتری ارسال شد (نمایشی)');
                    setReply('');
                    setDetail(null);
                  }}
                >
                  <Icon name="send" className="h-4 w-4" />
                  ارسال پاسخ
                </button>
              </div>
            </div>
          </div>
        }
      >
        {detail ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_META[detail.status].tone}>{STATUS_META[detail.status].label}</Badge>
              <Badge tone={PRIORITY_META[detail.priority].tone}>اولویت {PRIORITY_META[detail.priority].label}</Badge>
              <Badge tone="neutral">{detail.category}</Badge>
              <Badge tone="info">{detail.channel}</Badge>
              <span className="num text-[11px] text-ink-400">ثبت: {jalaliDateTime(detail.createdAt)}</span>
              <span className="num text-[11px] text-ink-400">آخرین بروزرسانی: {timeAgo(detail.updatedAt)}</span>
            </div>

            <div className="space-y-2">
              {detail.messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-xl2 px-3.5 py-2.5 text-[11.5px] leading-6 ${
                    m.from === 'customer'
                      ? 'bg-ink-100 dark:bg-ink-800'
                      : m.from === 'bot'
                        ? 'bg-accent-50 dark:bg-accent-900/20'
                        : 'ml-auto bg-brand-600 text-white'
                  }`}
                >
                  <p className="mb-1 text-[10.5px] font-bold opacity-80">
                    {m.name} — {jalaliDateTime(m.at)}
                  </p>
                  {m.text}
                </div>
              ))}
            </div>

            {detail.npsScore && (
              <Card className="bg-brand-50/60 dark:bg-brand-900/20">
                <p className="num text-[11.5px] text-brand-900 dark:text-brand-200">امتیاز رضایت ثبت‌شده مشتری: {faNum(detail.npsScore)} از ۱۰</p>
              </Card>
            )}
          </div>
        ) : (
          <EmptyState icon="message" title="تیکتی انتخاب نشده است" />
        )}
      </Modal>
    </AdminPage>
  );
};

export default TicketsAdmin;
