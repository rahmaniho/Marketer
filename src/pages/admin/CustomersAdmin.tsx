import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Pagination, Stat, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { exportCsv, faNum, jalaliDate, percentFa, toman, tomanShort } from '@/lib/format';
import { useCustomers, useOrders, useStore } from '@/store/useStore';
import type { Customer, CustomerTier } from '@/lib/types';

const CustomersAdmin = () => {
  const customers = useCustomers();
  const orders = useOrders();
  const upsertCustomer = useStore((s) => s.upsertCustomer);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('all');
  const [docs, setDocs] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [approving, setApproving] = useState<Customer | null>(null);
  const PER = 12;

  const filtered = useMemo(() => {
    const term = q.trim();
    return customers.filter((c) => {
      if (tier !== 'all' && c.tier !== tier) return false;
      if (docs !== 'all' && c.docsStatus !== docs) return false;
      if (term && !c.storeName.includes(term) && !c.ownerName.includes(term) && !c.mobile.includes(term) && !c.city.includes(term))
        return false;
      return true;
    });
  }, [customers, q, tier, docs]);

  const pages = Math.ceil(filtered.length / PER);
  const pageItems = filtered.slice((page - 1) * PER, page * PER);
  const maxLtv = Math.max(...customers.map((c) => c.ltv), 1);

  const exportAll = () =>
    exportCsv(
      [
        ['نام فروشگاه', 'مالک', 'موبایل', 'نوع', 'سطح', 'شهر', 'سقف اعتبار', 'اعتبار مصرف‌شده', 'LTV', 'ریسک ریزش', 'وضعیت مدارک', 'وضعیت حساب'],
        ...filtered.map((c) => [
          c.storeName,
          c.ownerName,
          c.mobile,
          c.kind,
          c.tier,
          c.city,
          c.creditLimit,
          c.creditUsed,
          c.ltv,
          c.churnRisk,
          c.docsStatus,
          c.status,
        ]),
      ],
      'customers-report.csv',
    );

  return (
    <AdminPage
      title="مدیریت مشتریان و اعتبارسنجی"
      subtitle={`${faNum(filtered.length)} مشتری • ${faNum(customers.filter((c) => c.docsStatus === 'pending').length)} پرونده در انتظار تأیید`}
      icon="users"
      actions={
        <button className="btn-ghost btn-sm" onClick={exportAll}>
          <Icon name="sheet" className="h-4 w-4" />
          خروجی CSV
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل مشتریان" value={faNum(customers.length)} icon="users" />
        <Stat label="مشتریان VIP" value={faNum(customers.filter((c) => c.tier === 'VIP').length)} icon="crown" tone="vip" />
        <Stat
          label="مجموع اعتبار اعطاشده"
          value={tomanShort(customers.reduce((s, c) => s + c.creditLimit, 0))}
          icon="wallet"
          tone="info"
        />
        <Stat
          label="اعتبار مصرف‌شده"
          value={tomanShort(customers.reduce((s, c) => s + c.creditUsed, 0))}
          icon="chart"
          tone="accent"
        />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی نام فروشگاه، مالک، موبایل یا شهر…" />
        <select value={tier} onChange={(e) => setTier(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه سطوح</option>
          {(['VIP', 'A', 'B', 'C'] as CustomerTier[]).map((t) => (
            <option key={t} value={t}>
              سطح {t}
            </option>
          ))}
        </select>
        <select value={docs} onChange={(e) => setDocs(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">وضعیت مدارک (همه)</option>
          <option value="verified">تأییدشده</option>
          <option value="pending">در انتظار بررسی</option>
          <option value="rejected">رد شده</option>
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>فروشگاه</th>
            <th>نوع / شهر</th>
            <th>سطح</th>
            <th>سفارش‌ها</th>
            <th>اعتبار</th>
            <th>LTV</th>
            <th>ریسک ریزش</th>
            <th>مدارک</th>
            <th>اقدام</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 ? (
            <EmptyRow colSpan={9} text="مشتری با این فیلترها یافت نشد" />
          ) : (
            pageItems.map((c) => {
              const myOrders = orders.filter((o) => o.customerId === c.id).length;
              return (
                <tr key={c.id}>
                  <td>
                    <span className="font-semibold">{c.storeName}</span>
                    <span className="block text-[10.5px] text-ink-400">
                      {c.ownerName} • <span className="num">{c.mobile}</span>
                    </span>
                  </td>
                  <td>
                    {c.kind}
                    <span className="block text-[10.5px] text-ink-400">{c.city}</span>
                  </td>
                  <td>
                    <Badge tone={c.tier === 'VIP' ? 'vip' : c.tier === 'A' ? 'brand' : 'neutral'}>{c.tier}</Badge>
                  </td>
                  <td className="num">{faNum(myOrders)}</td>
                  <td>
                    <span className="num block text-[11px]">
                      {toman(c.creditUsed, false)} / {toman(c.creditLimit, false)}
                    </span>
                    <MiniBar value={c.creditUsed} max={c.creditLimit} color="#f9a307" />
                  </td>
                  <td>
                    <span className="num block text-[11px] font-bold">{tomanShort(c.ltv)}</span>
                    <MiniBar value={c.ltv} max={maxLtv} />
                  </td>
                  <td>
                    <Badge tone={c.churnRisk > 50 ? 'danger' : c.churnRisk > 25 ? 'warning' : 'success'}>
                      {percentFa(c.churnRisk)}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={c.docsStatus === 'verified' ? 'success' : c.docsStatus === 'pending' ? 'warning' : 'danger'}>
                      {c.docsStatus === 'verified' ? 'تأییدشده' : c.docsStatus === 'pending' ? 'در انتظار' : 'رد شده'}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => setEditing(c)}>
                        <Icon name="edit" className="h-3.5 w-3.5" />
                        ویرایش
                      </button>
                      <button className="btn-soft btn-sm" onClick={() => setApproving(c)}>
                        <Icon name="clipboard" className="h-3.5 w-3.5" />
                        مدارک
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {/* ویرایش مشتری */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="ویرایش مشتری و اعتبار"
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (editing) {
                  upsertCustomer(editing);
                  toast(`اطلاعات ${editing.storeName} ذخیره شد`);
                }
                setEditing(null);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ذخیره تغییرات
            </button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام فروشگاه">
                <input value={editing.storeName} onChange={(e) => setEditing({ ...editing, storeName: e.target.value })} className="input" />
              </Field>
              <Field label="نام مالک">
                <input value={editing.ownerName} onChange={(e) => setEditing({ ...editing, ownerName: e.target.value })} className="input" />
              </Field>
              <Field label="نوع فروشگاه">
                <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as Customer['kind'] })} className="select">
                  {['سوپرمارکت', 'هایپرمارکت', 'رستوران', 'عمده‌فروش', 'کافه', 'قنادی', 'هتل'].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="سطح مشتری">
                <select value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value as CustomerTier })} className="select">
                  {['VIP', 'A', 'B', 'C'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="سقف اعتبار (تومان)">
                <input
                  type="number"
                  value={editing.creditLimit}
                  onChange={(e) => setEditing({ ...editing, creditLimit: Number(e.target.value) })}
                  className="input num"
                />
              </Field>
              <Field label="اعتبار مصرف‌شده (تومان)">
                <input
                  type="number"
                  value={editing.creditUsed}
                  onChange={(e) => setEditing({ ...editing, creditUsed: Number(e.target.value) })}
                  className="input num"
                />
              </Field>
              <Field label="وضعیت حساب">
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as Customer['status'] })} className="select">
                  <option value="active">فعال</option>
                  <option value="pending">در انتظار تأیید</option>
                  <option value="suspended">معلق</option>
                </select>
              </Field>
              <Field label="کارشناس فروش اختصاصی">
                <input value={editing.assignedRepId} onChange={(e) => setEditing({ ...editing, assignedRepId: e.target.value })} className="input" />
              </Field>
            </div>
            <Field label="آدرس">
              <textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} className="input" />
            </Field>
            <Field label="یادداشت داخلی">
              <textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} className="input" />
            </Field>
            <div className="rounded-xl bg-ink-50 p-3 text-[11.5px] dark:bg-ink-800/60">
              <p className="font-bold">اطلاعات تحلیلی این مشتری</p>
              <p className="num mt-1 text-ink-500 dark:text-ink-400">
                میانگین سفارش: {toman(editing.avgOrderValue, false)} تومان • خرید ماهانه: {faNum(editing.monthlyOrders)} بار • LTV: {toman(editing.ltv, false)} تومان
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* تأیید مدارک */}
      <Modal
        open={!!approving}
        onClose={() => setApproving(null)}
        title={`بررسی مدارک — ${approving?.storeName ?? ''}`}
        size="md"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button
              className="btn-ghost"
              onClick={() => {
                if (approving) {
                  upsertCustomer({ ...approving, docsStatus: 'rejected', status: 'suspended', docs: approving.docs.map((d) => ({ ...d, status: 'rejected' as const })) });
                  toast('مدارک رد شد و وضعیت حساب معلق شد', 'error');
                }
                setApproving(null);
              }}
            >
              رد مدارک
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (approving) {
                  upsertCustomer({
                    ...approving,
                    docsStatus: 'verified',
                    status: 'active',
                    docs: approving.docs.map((d) => ({ ...d, status: 'verified' as const })),
                  });
                  toast('مدارک تأیید و سقف اعتبار فعال شد');
                }
                setApproving(null);
              }}
            >
              <Icon name="check-circle" className="h-4 w-4" />
              تأیید مدارک و فعال‌سازی اعتبار
            </button>
          </div>
        }
      >
        {approving && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 text-[11.5px]">
              {[
                ['کد اقتصادی', approving.taxId],
                ['موبایل', approving.mobile],
                ['شهر', `${approving.city} — ${approving.province}`],
                ['سقف اعتبار درخواستی', toman(approving.creditLimit, false)],
                ['تاریخ عضویت', jalaliDate(approving.createdAt)],
                ['آخرین سفارش', jalaliDate(approving.lastOrderAt)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {approving.docs.map((d) => (
                <div key={d.name} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                  <span className="flex items-center gap-2">
                    <Icon name="fileText" className="h-4 w-4 text-ink-400" />
                    {d.name}
                    <span className="num text-[10.5px] text-ink-400">({jalaliDate(d.date)})</span>
                  </span>
                  <Badge tone={d.status === 'verified' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                    {d.status === 'verified' ? 'تأییدشده' : d.status === 'pending' ? 'در انتظار' : 'رد شده'}
                  </Badge>
                </div>
              ))}
            </div>
            <Card className="bg-brand-50/60 dark:bg-brand-900/20">
              <p className="text-[11.5px] leading-6 text-brand-900 dark:text-brand-200">
                پیشنهاد سیستم (نمایشی): با توجه به سابقه سفارش، شهر و نوع فروشگاه، سقف اعتبار{' '}
                <span className="num font-bold">{toman(approving.creditLimit, false)}</span> تومان و سطح{' '}
                <span className="font-bold">{approving.tier}</span> پیشنهاد می‌شود.
              </p>
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default CustomersAdmin;
