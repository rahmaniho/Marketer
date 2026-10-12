import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Stat, Switch, Tabs, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, daysUntil, toman, tomanShort } from '@/lib/format';
import { useBrands, useOffers, useProducts, useStore } from '@/store/useStore';
import { offerKindLabel } from '@/data/offers';
import { childrenOf, rootCategories } from '@/data/categories';
import type { Offer } from '@/lib/types';

const emptyOffer = (): Offer => ({
  id: `of-${Date.now()}`,
  title: '',
  kind: 'volume',
  description: '',
  percent: 5,
  code: '',
  brandIds: [],
  categoryIds: [],
  productIds: [],
  minCartAmount: 0,
  minQty: 0,
  startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  vipOnly: false,
  firstOrderOnly: false,
  maxUsage: 500,
  usedCount: 0,
  color: '#0f684c',
  icon: 'tag',
  isActive: true,
});

const OffersAdmin = () => {
  const offers = useOffers();
  const products = useProducts();
  const brands = useBrands();
  const upsertOffer = useStore((s) => s.upsertOffer);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [draft, setDraft] = useState<Offer | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim();
    return offers.filter((o) => {
      if (tab === 'active' && !o.isActive) return false;
      if (tab === 'scheduled' && +new Date(o.startsAt) <= Date.now()) return false;
      if (tab === 'expired' && +new Date(o.endsAt) > Date.now()) return false;
      if (tab === 'vip' && !o.vipOnly) return false;
      if (term && !o.title.includes(term) && !o.code.includes(term)) return false;
      return true;
    });
  }, [offers, q, tab]);

  const totalUsed = offers.reduce((s, o) => s + o.usedCount, 0);

  const save = () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast('عنوان کمپین را وارد کنید', 'error');
      return;
    }
    upsertOffer({ ...draft, code: draft.code || `MKT${Math.floor(Math.random() * 9000 + 1000)}` });
    toast(`کمپین «${draft.title}» ذخیره شد`);
    setDraft(null);
  };

  return (
    <AdminPage
      title="کمپین‌ها و آفرها"
      subtitle={`${faNum(offers.length)} کمپین • ${faNum(totalUsed)} بار استفاده‌شده`}
      icon="tag"
      actions={
        <button className="btn-primary btn-sm" onClick={() => setDraft(emptyOffer())}>
          <Icon name="plus" className="h-4 w-4" />
          کمپین جدید
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کمپین فعال" value={faNum(offers.filter((o) => o.isActive).length)} icon="flame" />
        <Stat label="کمپین VIP" value={faNum(offers.filter((o) => o.vipOnly).length)} icon="crown" tone="vip" />
        <Stat label="کمپین زمان‌دار" value={faNum(offers.filter((o) => daysUntil(o.endsAt) > 0).length)} icon="clock" tone="accent" />
        <Stat
          label="میانگین تخفیف"
          value={`${faNum(offers.reduce((s, o) => s + o.percent, 0) / Math.max(1, offers.length), 1)}٪`}
          icon="chart"
          tone="info"
        />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی عنوان یا کد کمپین…" />
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'همه', count: offers.length },
            { id: 'active', label: 'فعال', count: offers.filter((o) => o.isActive).length },
            { id: 'scheduled', label: 'زمان‌بندی‌شده' },
            { id: 'expired', label: 'منقضی' },
            { id: 'vip', label: 'VIP' },
          ]}
        />
      </AdminToolbar>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((o) => {
          const remaining = daysUntil(o.endsAt);
          return (
            <Card key={o.id} className="flex flex-col gap-3" hover>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: o.color }}>
                    <Icon name={o.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{o.title}</p>
                    <p className="text-[10.5px] text-ink-400">{offerKindLabel[o.kind]} • کد {o.code}</p>
                  </div>
                </div>
                <Badge tone={o.isActive ? 'success' : 'neutral'}>{o.isActive ? 'فعال' : 'غیرفعال'}</Badge>
              </div>

              <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{o.description}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">تخفیف</span>
                  <span className="num font-extrabold">{faNum(o.percent)}٪</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">حداقل سبد</span>
                  <span className="num font-extrabold">{tomanShort(o.minCartAmount)}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">استفاده‌شده</span>
                  <span className="num font-extrabold">{faNum(o.usedCount)} / {faNum(o.maxUsage)}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">مهلت</span>
                  <span className="num font-extrabold">{remaining > 0 ? `${faNum(remaining)} روز` : 'پایان‌یافته'}</span>
                </div>
              </div>

              {o.productIds.length > 0 && (
                <p className="num text-[10.5px] text-ink-400">
                  {faNum(o.productIds.length)} کالای منتخب • {o.productIds.slice(0, 2).map((id) => products.find((p) => p.id === id)?.name ?? id).join(' ، ')}
                </p>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                <Switch
                  checked={o.isActive}
                  onChange={(v) => {
                    upsertOffer({ ...o, isActive: v });
                    toast(v ? `کمپین ${o.code} فعال شد` : `کمپین ${o.code} غیرفعال شد`);
                  }}
                  label="وضعیت"
                />
                <button className="btn-ghost btn-sm" onClick={() => setDraft(o)}>
                  <Icon name="edit" className="h-3.5 w-3.5" />
                  ویرایش
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <p className="mb-3 text-[12.5px] font-extrabold">جدول خلاصه کمپین‌ها</p>
        <TableWrap>
          <thead>
            <tr>
              <th>کد</th>
              <th>عنوان</th>
              <th>نوع</th>
              <th>درصد</th>
              <th>بازه</th>
              <th>شرط</th>
              <th>استفاده</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow colSpan={8} text="کمپینی با این فیلترها یافت نشد" />
            ) : (
              filtered.map((o) => (
                <tr key={`row-${o.id}`}>
                  <td className="num font-bold">{o.code}</td>
                  <td className="font-semibold">{o.title}</td>
                  <td>{offerKindLabel[o.kind]}</td>
                  <td className="num">{faNum(o.percent)}٪</td>
                  <td className="num text-[11px]">
                    {jalaliDate(o.startsAt)} تا {jalaliDate(o.endsAt)}
                  </td>
                  <td className="text-[11px]">
                    {o.vipOnly ? 'فقط VIP' : o.firstOrderOnly ? 'اولین سفارش' : o.minCartAmount ? `سبد ${tomanShort(o.minCartAmount)}` : 'همه مشتریان'}
                  </td>
                  <td className="num">{faNum(o.usedCount)}</td>
                  <td>
                    <Badge tone={o.isActive ? 'success' : 'neutral'}>{o.isActive ? 'فعال' : 'غیرفعال'}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.title ? `ویرایش کمپین — ${draft.title}` : 'ایجاد کمپین جدید'}
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              انصراف
            </button>
            <button className="btn-primary" onClick={save}>
              <Icon name="check" className="h-4 w-4" />
              ذخیره کمپین
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="عنوان کمپین" required>
                <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" placeholder="مثلاً: جشنواره لبنیات بهار" />
              </Field>
              <Field label="کد کمپین" hint="در صورت خالی بودن، خودکار ساخته می‌شود.">
                <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className="input num" placeholder="MKT1234" />
              </Field>
              <Field label="نوع کمپین">
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Offer['kind'] })} className="select">
                  {(Object.keys(offerKindLabel) as Offer['kind'][]).map((k) => (
                    <option key={k} value={k}>
                      {offerKindLabel[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="درصد تخفیف">
                <input type="number" value={draft.percent} onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="حداقل مبلغ سبد (تومان)">
                <input type="number" value={draft.minCartAmount} onChange={(e) => setDraft({ ...draft, minCartAmount: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="حداقل تعداد اقلام">
                <input type="number" value={draft.minQty} onChange={(e) => setDraft({ ...draft, minQty: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="تاریخ شروع">
                <input type="date" value={draft.startsAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, startsAt: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
              <Field label="تاریخ پایان">
                <input type="date" value={draft.endsAt.slice(0, 10)} onChange={(e) => setDraft({ ...draft, endsAt: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
            </div>
            <Field label="توضیحات کمپین">
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="input" />
            </Field>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="دسته‌بندی‌های هدف">
                <select
                  multiple
                  value={draft.categoryIds}
                  onChange={(e) => setDraft({ ...draft, categoryIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
                  className="select h-32"
                >
                  {rootCategories.flatMap((r) => [r, ...childrenOf(r.id)]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="برندهای هدف">
                <select
                  multiple
                  value={draft.brandIds}
                  onChange={(e) => setDraft({ ...draft, brandIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
                  className="select h-32"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <Switch checked={draft.vipOnly} onChange={(v) => setDraft({ ...draft, vipOnly: v })} label="فقط مشتریان VIP" description="کمپین برای مشتریان با سطح VIP نمایش داده می‌شود." />
              <Switch checked={draft.firstOrderOnly} onChange={(v) => setDraft({ ...draft, firstOrderOnly: v })} label="فقط اولین سفارش" description="مناسب کمپین جذب مشتری جدید." />
              <Switch checked={draft.isActive} onChange={(v) => setDraft({ ...draft, isActive: v })} label="کمپین فعال" />
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default OffersAdmin;
