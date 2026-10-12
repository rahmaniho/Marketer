import { useMemo, useState } from 'react';
import { AdminPage, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Progress, Stat, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { daysUntil, faNum, jalaliDate, toman, tomanShort } from '@/lib/format';
import { useCustomers, useProducts, useStore } from '@/store/useStore';
import { contractProductNames, contracts as seedContracts } from '@/data/crm';
import type { Contract } from '@/lib/types';

const STATUS_META: Record<Contract['status'], { label: string; tone: 'success' | 'warning' | 'neutral' | 'info' }> = {
  active: { label: 'فعال', tone: 'success' },
  expiring: { label: 'نزدیک انقضا', tone: 'warning' },
  expired: { label: 'منقضی', tone: 'neutral' },
  draft: { label: 'پیش‌نویس', tone: 'info' },
};

const ContractsAdmin = () => {
  const storeContracts = useStore((s) => s.contractsExtra);
  const addContract = useStore((s) => s.addContract);
  const customers = useCustomers();
  const products = useProducts();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState<Contract | null>(null);
  const [draft, setDraft] = useState<Contract | null>(null);

  const all = useMemo(() => [...storeContracts, ...seedContracts], [storeContracts]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return all.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (term && !c.title.includes(term) && !c.customerName.includes(term) && !c.code.includes(term)) return false;
      return true;
    });
  }, [all, q, tab]);

  const totalCommitted = all.reduce((s, c) => s + c.discountPercent * c.minMonthlyQty, 0);
  const expiring = all.filter((c) => daysUntil(c.endsAt) < 60 && c.status !== 'expired');

  const newContract = (): Contract => ({
    id: `ct-${Date.now()}`,
    code: `CT-${Math.floor(Math.random() * 9000 + 1000)}`,
    customerId: customers[0]?.id ?? '',
    customerName: customers[0]?.storeName ?? '',
    title: 'قرارداد قیمت پیمانی سالانه',
    productIds: products.slice(0, 5).map((p) => p.id),
    discountPercent: 6,
    minMonthlyQty: 40,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    status: 'draft',
    signedBy: '',
    signedAt: '',
    signatureHash: '',
    attachment: '',
    settlement: 'اعتباری ۳۰ روزه',
    note: '',
  });

  return (
    <AdminPage
      title="قراردادهای قیمت پیمانی"
      subtitle={`${faNum(all.filter((c) => c.status === 'active').length)} قرارداد فعال • ${faNum(expiring.length)} قرارداد نزدیک انقضا`}
      icon="signature"
      actions={
        <button className="btn-primary btn-sm" onClick={() => setDraft(newContract())}>
          <Icon name="plus" className="h-4 w-4" />
          قرارداد جدید
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="قراردادهای فعال" value={faNum(all.filter((c) => c.status === 'active').length)} icon="signature" />
        <Stat label="میانگین تخفیف پیمانی" value={`${faNum(all.reduce((s, c) => s + c.discountPercent, 0) / Math.max(1, all.length), 1)}٪`} icon="tag" tone="accent" />
        <Stat label="نزدیک انقضا (۶۰ روز)" value={faNum(expiring.length)} icon="alert" tone="danger" />
        <Stat label="شاخص تعهد حجمی" value={faNum(totalCommitted)} icon="chart" tone="info" hint="مجموع درصد × حداقل حجم ماهانه" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl2 border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی عنوان قرارداد، مشتری یا کد…" />
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'همه', count: all.length },
            { id: 'active', label: 'فعال', count: all.filter((c) => c.status === 'active').length },
            { id: 'expiring', label: 'نزدیک انقضا' },
            { id: 'draft', label: 'پیش‌نویس' },
            { id: 'expired', label: 'منقضی' },
          ]}
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th>کد</th>
            <th>عنوان قرارداد</th>
            <th>مشتری</th>
            <th>اقلام تحت پوشش</th>
            <th>تخفیف</th>
            <th>حداقل حجم ماهانه</th>
            <th>بازه اعتبار</th>
            <th>تسویه</th>
            <th>وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={10} text="قراردادی با این فیلترها یافت نشد" />
          ) : (
            filtered.map((c) => (
              <tr key={c.id}>
                <td className="num font-bold">{c.code}</td>
                <td className="max-w-[240px] truncate font-semibold">{c.title}</td>
                <td>{c.customerName}</td>
                <td className="num text-[11px]">{faNum(c.productIds.length)} کالا</td>
                <td>
                  <Badge tone="brand">{faNum(c.discountPercent)}٪</Badge>
                </td>
                <td className="num">{faNum(c.minMonthlyQty)} واحد</td>
                <td className="num text-[11px]">
                  {jalaliDate(c.startsAt)} — {jalaliDate(c.endsAt)}
                  <span className="block text-[10.5px] text-ink-400">{faNum(Math.max(0, daysUntil(c.endsAt)))} روز باقی‌مانده</span>
                </td>
                <td className="text-[11px]">{c.settlement}</td>
                <td>
                  <Badge tone={STATUS_META[c.status].tone}>{STATUS_META[c.status].label}</Badge>
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(c)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    مشاهده
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">پایش تحقق تعهد حجمی قراردادها</p>
          <div className="space-y-3">
            {all.slice(0, 6).map((c) => {
              const fulfilled = 40 + ((c.discountPercent * 7) % 55);
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{c.customerName}</span>
                    <span className="num text-ink-500 dark:text-ink-400">{faNum(fulfilled)}٪ تحقق</span>
                  </div>
                  <Progress value={fulfilled} color={fulfilled > 70 ? '#0f684c' : fulfilled > 45 ? '#f9a307' : '#e11d48'} label={`${c.code} — تخفیف ${faNum(c.discountPercent)}٪`} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">مزایای قیمت پیمانی در پلتفرم</p>
          <div className="space-y-2 text-[11.5px]">
            {[
              ['قیمت تضمین‌شده برای کل دوره قرارداد', 'کاهش ریسک نوسان قیمت برای فروشگاه'],
              ['اولویت تخصیص موجودی در کمبود عرضه', 'اطمینان از تأمین کالا'],
              ['ارسال رایگان در سفارش‌های بالای تعهد', 'کاهش هزینه توزیع'],
              ['گزارش تحقق تعهد و پاداش پایان دوره', 'شفافیت کامل خرید'],
              ['امضای دیجیتال و بایگانی سند', 'بدون کاغذبازی و رفت‌وآمد'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                <p className="font-semibold">{t}</p>
                <p className="text-[10.5px] text-ink-400">{d}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`قرارداد ${detail?.code ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('نسخه PDF قرارداد دانلود شد (نمایشی)')}>
              <Icon name="download" className="h-4 w-4" />
              دانلود سند
            </button>
            <button className="btn-soft" onClick={() => toast('پیام تمدید قرارداد برای مشتری ارسال شد (نمایشی)')}>
              پیشنهاد تمدید
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
                ['مشتری', detail.customerName],
                ['تخفیف قراردادی', `${faNum(detail.discountPercent)}٪`],
                ['حداقل حجم ماهانه', `${faNum(detail.minMonthlyQty)} واحد`],
                ['شروع', jalaliDate(detail.startsAt)],
                ['پایان', jalaliDate(detail.endsAt)],
                ['شرایط تسویه', detail.settlement],
                ['امضاکننده', detail.signedBy || 'امضا نشده'],
                ['تاریخ امضا', detail.signedAt ? jalaliDate(detail.signedAt) : '—'],
                ['ارزش تخمینی سالانه', tomanShort(detail.minMonthlyQty * 12 * 2_400_000)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-2 text-[11.5px] font-bold">اقلام تحت پوشش قرارداد</p>
              <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">{contractProductNames(detail.productIds) || '—'}</p>
            </Card>
            {detail.signatureHash && (
              <Field label="هش امضای دیجیتال (نمایشی)">
                <p className="num break-all text-[10.5px] text-ink-400" dir="ltr">
                  sha256:{detail.signatureHash}
                </p>
              </Field>
            )}
            {detail.note && <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{detail.note}</p>}
          </div>
        )}
      </Modal>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title="ایجاد قرارداد قیمت پیمانی"
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (draft) {
                  addContract({ ...draft, status: 'draft' });
                  toast(`پیش‌نویس قرارداد ${draft.code} ایجاد شد و برای امضا ارسال می‌شود`);
                }
                setDraft(null);
              }}
            >
              <Icon name="send" className="h-4 w-4" />
              ایجاد و ارسال برای امضا
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="مشتری" required>
                <select
                  value={draft.customerId}
                  onChange={(e) => {
                    const c = customers.find((x) => x.id === e.target.value);
                    setDraft({ ...draft, customerId: e.target.value, customerName: c?.storeName ?? '' });
                  }}
                  className="select"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.storeName} — {c.city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="عنوان قرارداد">
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" />
              </Field>
              <Field label="درصد تخفیف پیمانی">
                <input type="number" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="حداقل حجم ماهانه (واحد)">
                <input type="number" value={draft.minMonthlyQty} onChange={(e) => setDraft({ ...draft, minMonthlyQty: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="تاریخ شروع">
                <input type="date" value={draft.startsAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, startsAt: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
              <Field label="تاریخ پایان">
                <input type="date" value={draft.endsAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, endsAt: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
              <Field label="شرایط تسویه">
                <select value={draft.settlement} onChange={(e) => setDraft({ ...draft, settlement: e.target.value })} className="select">
                  {['نقدی', 'اعتباری ۳۰ روزه', 'اعتباری ۴۵ روزه', 'چک ۶۰ روزه'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="ارزش تخمینی سالانه (تومان)">
                <input readOnly value={toman(draft.minMonthlyQty * 12 * 2_400_000, false)} className="input num bg-ink-50 dark:bg-ink-800" />
              </Field>
            </div>

            <Field label="کالاهای تحت پوشش قرارداد" hint="با نگه‌داشتن Ctrl چند کالا انتخاب کنید.">
              <select
                multiple
                value={draft.productIds}
                onChange={(e) => setDraft({ ...draft, productIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
                className="select h-40"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="یادداشت قرارداد">
              <textarea rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="input" />
            </Field>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default ContractsAdmin;
