import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Pagination, Stat, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, timeAgo, tomanShort } from '@/lib/format';
import { leads as seedLeads, adminUsers } from '@/data/crm';
import { REPS_LIST } from '@/data/ops';
import type { Lead } from '@/lib/types';

const STAGES: { id: Lead['stage']; label: string; tone: 'neutral' | 'info' | 'warning' | 'brand' | 'success' | 'danger' }[] = [
  { id: 'new', label: 'سرنخ جدید', tone: 'neutral' },
  { id: 'contacted', label: 'تماس گرفته‌شده', tone: 'info' },
  { id: 'qualified', label: 'واجد شرایط', tone: 'warning' },
  { id: 'negotiation', label: 'در حال مذاکره', tone: 'brand' },
  { id: 'won', label: 'تبدیل به مشتری', tone: 'success' },
  { id: 'lost', label: 'از دست رفته', tone: 'danger' },
];

const LeadsAdmin = () => {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('all');
  const [rep, setRep] = useState('all');
  const [view, setView] = useState<'table' | 'board'>('table');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Lead | null>(null);
  const PER = 12;

  const filtered = useMemo(() => {
    const term = q.trim();
    return seedLeads.filter((l) => {
      if (stage !== 'all' && l.stage !== stage) return false;
      if (rep !== 'all' && l.assignedRepId !== rep) return false;
      if (term && !l.storeName.includes(term) && !l.ownerName.includes(term) && !l.city.includes(term) && !l.mobile.includes(term)) return false;
      return true;
    });
  }, [q, stage, rep]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);
  const maxValue = Math.max(...seedLeads.map((l) => l.estimatedValue), 1);
  const wonCount = seedLeads.filter((l) => l.stage === 'won').length;

  return (
    <AdminPage
      title="مدیریت سرنخ‌ها (Leads)"
      subtitle={`${faNum(seedLeads.length)} سرنخ • نرخ تبدیل ${faNum((wonCount / Math.max(1, seedLeads.length)) * 100, 1)}٪`}
      icon="target"
      actions={
        <>
          <button className={`btn-sm ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('table')}>
            <Icon name="list" className="h-4 w-4" />
            جدول
          </button>
          <button className={`btn-sm ${view === 'board' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('board')}>
            <Icon name="layers" className="h-4 w-4" />
            قیف فروش
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="سرنخ در قیف" value={faNum(seedLeads.filter((l) => !['won', 'lost'].includes(l.stage)).length)} icon="target" tone="info" />
        <Stat label="ارزش تخمینی قیف" value={tomanShort(seedLeads.filter((l) => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + l.estimatedValue, 0))} icon="chart" />
        <Stat label="میانگین امتیاز" value={faNum(seedLeads.reduce((s, l) => s + l.score, 0) / Math.max(1, seedLeads.length), 0)} icon="sparkles" tone="accent" />
        <Stat label="تبدیل‌شده به مشتری" value={faNum(wonCount)} icon="check-circle" tone="brand" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی نام فروشگاه، مالک، شهر یا موبایل…" />
        <select value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه مراحل</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select value={rep} onChange={(e) => setRep(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه کارشناسان</option>
          {REPS_LIST.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </AdminToolbar>

      {view === 'board' ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((s) => {
            const col = seedLeads.filter((l) => l.stage === s.id);
            return (
              <Card key={s.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="num text-[11px] font-bold text-ink-400">{faNum(col.length)}</span>
                </div>
                <div className="space-y-2">
                  {col.slice(0, 6).map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setDetail(l)}
                      className="w-full rounded-xl border border-ink-200 p-2 text-right transition hover:border-brand-400 dark:border-ink-700"
                    >
                      <p className="truncate text-[11.5px] font-bold">{l.storeName}</p>
                      <p className="text-[10.5px] text-ink-400">{l.city} • {l.kind}</p>
                      <p className="num mt-1 text-[10.5px] text-brand-700 dark:text-brand-300">{tomanShort(l.estimatedValue)}</p>
                    </button>
                  ))}
                  {col.length > 6 && <p className="num text-center text-[10.5px] text-ink-400">+ {faNum(col.length - 6)} مورد دیگر</p>}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <th>فروشگاه</th>
                <th>نوع / شهر</th>
                <th>منبع</th>
                <th>امتیاز</th>
                <th>مرحله</th>
                <th>ارزش تخمینی</th>
                <th>کارشناس</th>
                <th>آخرین فعالیت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <EmptyRow colSpan={9} text="سرنخی با این فیلترها یافت نشد" />
              ) : (
                items.map((l) => {
                  const repName = adminUsers.find((u) => u.id === l.assignedRepId)?.fullName ?? REPS_LIST.find((r) => r.id === l.assignedRepId)?.name ?? 'نامشخص';
                  const meta = STAGES.find((s) => s.id === l.stage)!;
                  return (
                    <tr key={l.id}>
                      <td>
                        <span className="font-semibold">{l.storeName}</span>
                        <span className="num block text-[10.5px] text-ink-400">{l.ownerName} • {l.mobile}</span>
                      </td>
                      <td>
                        {l.kind}
                        <span className="block text-[10.5px] text-ink-400">{l.city}</span>
                      </td>
                      <td className="text-[11px]">{l.source}</td>
                      <td>
                        <span className="num text-[11.5px] font-bold">{faNum(l.score)}</span>
                        <MiniBar value={l.score} max={100} color={l.score > 70 ? '#0f684c' : l.score > 40 ? '#f9a307' : '#94a3b8'} />
                      </td>
                      <td>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td>
                        <span className="num block text-[11.5px] font-bold">{tomanShort(l.estimatedValue)}</span>
                        <MiniBar value={l.estimatedValue} max={maxValue} />
                      </td>
                      <td className="text-[11px]">{repName}</td>
                      <td className="text-[11px] text-ink-400">{timeAgo(l.lastActivity)}</td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={() => setDetail(l)}>
                          <Icon name="eye" className="h-3.5 w-3.5" />
                          جزئیات
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrap>
          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`سرنخ — ${detail?.storeName ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('تماس تلفنی ثبت شد (نمایشی)')}>
              <Icon name="phone" className="h-4 w-4" />
              ثبت تماس
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                toast('سرنخ به مشتری تبدیل و پرونده اعتبارسنجی ایجاد شد (نمایشی)');
                setDetail(null);
              }}
            >
              <Icon name="check-circle" className="h-4 w-4" />
              تبدیل به مشتری
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-3 text-[11.5px]">
              {[
                ['مالک', detail.ownerName],
                ['موبایل', detail.mobile],
                ['نوع فروشگاه', detail.kind],
                ['شهر', detail.city],
                ['منبع', detail.source],
                ['امتیاز', `${faNum(detail.score)} از ۱۰۰`],
                ['ارزش تخمینی', tomanShort(detail.estimatedValue)],
                ['تاریخ ایجاد', jalaliDate(detail.createdAt)],
                ['آخرین فعالیت', timeAgo(detail.lastActivity)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="text-[11.5px] leading-6">
                <span className="font-bold">یادداشت: </span>
                {detail.note}
              </p>
            </Card>
            <Field label="تغییر مرحله قیف فروش">
              <select value={detail.stage} onChange={(e) => setDetail({ ...detail, stage: e.target.value as Lead['stage'] })} className="select">
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="ثبت فعالیت جدید" hint="در نسخه دمو ذخیره نمی‌شود.">
              <textarea rows={2} className="input" placeholder="مثلاً: تماس تلفنی — درخواست کاتالوگ لبنیات ارسال شد." />
            </Field>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default LeadsAdmin;
