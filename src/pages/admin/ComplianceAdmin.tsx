import { useMemo, useState } from 'react';
import { AdminPage, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, DemoNote, Field, Modal, Progress, Stat, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { daysUntil, faNum, jalaliDate, timeAgo } from '@/lib/format';
import { useBrands, useOrders, useProducts } from '@/store/useStore';
import { batches } from '@/data/ops';
import { complianceItems, securityFeatures } from '@/data/content';
import { roles } from '@/data/crm';

const ComplianceAdmin = () => {
  const brands = useBrands();
  const products = useProducts();
  const orders = useOrders();
  const { toast } = useToast();
  const [tab, setTab] = useState('licenses');
  const [q, setQ] = useState('');
  const [recallOpen, setRecallOpen] = useState(false);
  const [recallBatch, setRecallBatch] = useState(batches[0]);
  const [recallScope, setRecallScope] = useState('فقط مشتریان خریدار این بچ');

  const licensedBrands = useMemo(() => brands.filter((b) => b.licenseKind === 'IRC' || b.licenseKind === 'حلال' || b.licenseKind === 'ارگانیک'), [brands]);
  const filteredBrands = useMemo(() => {
    const term = q.trim();
    return licensedBrands.filter((b) => !term || b.name.includes(term) || b.licenseCode.includes(term));
  }, [licensedBrands, q]);

  const expiringSoon = licensedBrands.filter((b) => daysUntil(b.licenseExpiry) < 180);
  const halalCount = products.filter((p) => p.badges.includes('halal')).length;
  const organicCount = products.filter((p) => p.badges.includes('organic')).length;

  return (
    <AdminPage
      title="انطباق، مجوزها و امنیت"
      subtitle={`${faNum(licensedBrands.length)} برند دارای مجوز • ${faNum(complianceItems.length)} محور انطباق • ردیابی بچ و فراخوان کالا`}
      icon="shield"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => setRecallOpen(true)}>
            <Icon name="alert" className="h-4 w-4" />
            فراخوان کالا
          </button>
          <button className="btn-primary btn-sm" onClick={() => toast('گزارش انطباق برای بازرس آماده شد (نمایشی)')}>
            <Icon name="download" className="h-4 w-4" />
            گزارش بازرسی
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="مجوزهای معتبر" value={faNum(licensedBrands.filter((b) => b.licenseStatus === 'valid').length)} icon="shield" />
        <Stat label="مجوزهای نزدیک انقضا" value={faNum(expiringSoon.length)} icon="alert" tone="accent" hint="کمتر از ۶ ماه" />
        <Stat label="کالاهای دارای گواهی حلال" value={faNum(halalCount)} icon="badge" tone="info" />
        <Stat label="کالاهای ارگانیک" value={faNum(organicCount)} icon="leaf" tone="vip" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'licenses', label: 'مجوزها و گواهی‌ها', icon: 'award' },
          { id: 'traceability', label: 'ردیابی و فراخوان', icon: 'search' },
          { id: 'signature', label: 'امضای دیجیتال و قرارداد', icon: 'signature' },
          { id: 'security', label: 'امنیت و دسترسی', icon: 'lock' },
        ]}
      />

      {tab === 'licenses' && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {complianceItems.map((c) => (
              <Card key={c.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    <Icon name={c.icon} className="h-5 w-5" />
                  </span>
                  <Badge tone={c.status === 'valid' ? 'success' : c.status === 'expiring' ? 'warning' : 'danger'}>
                    {c.status === 'valid' ? 'معتبر' : c.status === 'expiring' ? 'نزدیک انقضا' : 'نیازمند اقدام'}
                  </Badge>
                </div>
                <p className="text-[12.5px] font-extrabold">{c.title}</p>
                <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{c.description}</p>
                <p className="text-[10.5px] text-ink-400">{c.detail}</p>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px] font-extrabold">فهرست مجوزهای برندهای وارداتی و نمایندگی</p>
              <div className="w-full max-w-xs">
                <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی برند یا کد مجوز…" />
              </div>
            </div>
            <TableWrap>
              <thead>
                <tr>
                  <th>برند</th>
                  <th>کشور</th>
                  <th>نوع</th>
                  <th>شماره پروانه / IRC</th>
                  <th>نماینده رسمی</th>
                  <th>اعتبار</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.length === 0 ? (
                  <EmptyRow colSpan={7} text="برندی با این مشخصات یافت نشد" />
                ) : (
                  filteredBrands.slice(0, 24).map((b) => (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.name}</td>
                      <td>{b.country}</td>
                      <td className="text-[11px]">
                        {b.licenseKind}
                        {b.exclusive ? ' — نمایندگی انحصاری' : ''}
                      </td>
                      <td className="num text-[11px]" dir="ltr">
                        {b.licenseCode}
                      </td>
                      <td className="text-[11px]">{b.representative ?? '—'}</td>
                      <td className="num text-[11px]">
                        {jalaliDate(b.licenseExpiry)}
                        <span className="block text-[10.5px] text-ink-400">{faNum(daysUntil(b.licenseExpiry))} روز</span>
                      </td>
                      <td>
                        <Badge tone={b.licenseStatus === 'valid' ? 'success' : b.licenseStatus === 'expiring' ? 'warning' : 'danger'}>
                          {b.licenseStatus === 'valid' ? 'معتبر' : b.licenseStatus === 'expiring' ? 'نزدیک انقضا' : b.licenseStatus === 'pending' ? 'در تمدید' : 'منقضی'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'traceability' && (
        <div className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <p className="mb-3 text-[12.5px] font-extrabold">زنجیره ردیابی کالا (از کارخانه تا فروشگاه)</p>
              <div className="space-y-2">
                {[
                  ['تولید در کارخانه تأمین‌کننده', 'ثبت بچ، تاریخ تولید و آزمایش‌های کیفیت', 'check-circle'],
                  ['ورود به انبار مرکزی', 'ثبت شماره LOT، دما و شرایط نگهداری', 'warehouse'],
                  ['بسته‌بندی و پالت‌بندی', 'تخصیص بارکد داخلی و QR پالت', 'box'],
                  ['حمل با خودروی یخچال‌دار', 'پایش دما در مسیر و ثبت GPS', 'truck'],
                  ['تحویل به فروشگاه', 'ثبت امضای دیجیتال و بارنامه', 'signature'],
                  ['پایش پس از فروش', 'امکان فراخوان سریع بر اساس شماره بچ', 'search'],
                ].map(([title, desc, icon], i) => (
                  <div key={title} className="flex gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      <Icon name={icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="num text-[11.5px] font-bold">
                        {faNum(i + 1)}. {title}
                      </p>
                      <p className="text-[11px] text-ink-500 dark:text-ink-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="space-y-3">
              <Card>
                <p className="mb-3 text-[12.5px] font-extrabold">آمار بچ‌های فعال</p>
                <div className="space-y-3">
                  <Progress value={(batches.filter((b) => b.qcStatus === 'passed').length / batches.length) * 100} label={`بچ تأییدشده: ${faNum(batches.filter((b) => b.qcStatus === 'passed').length)} از ${faNum(batches.length)}`} />
                  <Progress value={(batches.filter((b) => daysUntil(b.expiryDate) < 90).length / batches.length) * 100} color="#f9a307" label={`بچ نزدیک انقضا: ${faNum(batches.filter((b) => daysUntil(b.expiryDate) < 90).length)}`} />
                  <Progress value={(batches.filter((b) => b.qcStatus === 'failed').length / batches.length) * 100} color="#e11d48" label={`بچ ردشده در QC: ${faNum(batches.filter((b) => b.qcStatus === 'failed').length)}`} />
                </div>
              </Card>
              <Card>
                <p className="mb-2 text-[12.5px] font-extrabold">آخرین فراخوان‌ها</p>
                <div className="space-y-2 text-[11.5px]">
                  {[
                    ['فراخوان بچ LOT240195 — پنیر پیتزا', '۲ روز پیش', 'اطلاع‌رسانی به ۱۴ مشتری'],
                    ['فراخوان بچ LOT240117 — ماست پرچرب', '۱۹ روز پیش', 'بازگشت ۸۶ کارتن به انبار'],
                  ].map(([t, w, d]) => (
                    <div key={t} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                      <p className="font-semibold">{t}</p>
                      <p className="text-[10.5px] text-ink-400">
                        {w} • {d}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === 'signature' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">قراردادهای امضاشده دیجیتال</p>
            <div className="space-y-2">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-[11.5px] dark:border-ink-700">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{o.customerName}</p>
                    <p className="num text-[10.5px] text-ink-400">{o.code} • {timeAgo(o.createdAt)}</p>
                  </div>
                  <Badge tone="success" icon="signature">
                    امضاشده
                  </Badge>
                </div>
              ))}
            </div>
            <DemoNote>
              امضای الکترونیک در این دمو شبیه‌سازی شده است. در نسخه عملیاتی، هش SHA-256 سند، مهر زمانی (TSA) و
              شناسه ملی امضاکننده ذخیره می‌شود.
            </DemoNote>
          </Card>
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">سندباکس انطباق (Compliance Checklist)</p>
            <div className="space-y-2 text-[11.5px]">
              {[
                ['ثبت پروانه کسب فروشگاه‌ها', 'verified'],
                ['کنترل شماره پروانه IRC کالاهای وارداتی', 'verified'],
                ['بررسی گواهی حلال فرآورده‌های پروتئینی', 'verified'],
                ['کنترل برچسب فارسی و وزن خالص', 'verified'],
                ['کنترل تاریخ انقضا هنگام برداشت از انبار (FEFO)', 'verified'],
                ['پایش دمای زنجیره سرد در حمل', 'pending'],
                ['بایگانی اسناد خرید و فروش برای ۱۰ سال', 'verified'],
              ].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span>{label}</span>
                  <Badge tone={state === 'verified' ? 'success' : 'warning'}>{state === 'verified' ? 'انجام‌شده' : 'در جریان'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {securityFeatures.map((s) => (
              <Card key={s.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <Badge tone={s.enabled ? 'success' : 'neutral'}>{s.enabled ? 'فعال' : 'غیرفعال'}</Badge>
                </div>
                <p className="text-[12.5px] font-extrabold">{s.title}</p>
                <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{s.description}</p>
              </Card>
            ))}
          </div>
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">ماتریس دسترسی نقش‌ها (RBAC)</p>
            <TableWrap>
              <thead>
                <tr>
                  <th>نقش</th>
                  <th>تعداد مجوز</th>
                  <th>حوزه دسترسی</th>
                  <th>2FA اجباری</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.name}</td>
                    <td className="num">{faNum(r.permissions.length)}</td>
                    <td className="text-[11px]">{r.description}</td>
                    <td>
                      <Badge tone={['superadmin', 'sales-manager', 'finance'].includes(r.id) ? 'success' : 'neutral'}>
                        {['superadmin', 'sales-manager', 'finance'].includes(r.id) ? 'اجباری' : 'اختیاری'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>
        </div>
      )}

      <Modal
        open={recallOpen}
        onClose={() => setRecallOpen(false)}
        title="فراخوان کالا (Product Recall)"
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setRecallOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                toast(`فراخوان بچ ${recallBatch.batchNo} ثبت و به مشتریان اطلاع داده شد (نمایشی)`, 'error');
                setRecallOpen(false);
              }}
            >
              <Icon name="alert" className="h-4 w-4" />
              ثبت و اطلاع‌رسانی فراخوان
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <Field label="انتخاب بچ مورد فراخوان">
            <select
              className="select num"
              value={recallBatch.id}
              onChange={(e) => setRecallBatch(batches.find((b) => b.id === e.target.value) ?? batches[0])}
            >
              {batches.slice(0, 40).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNo} — {products.find((p) => p.id === b.productId)?.name ?? b.productId}
                </option>
              ))}
            </select>
          </Field>
          <Field label="دامنه اطلاع‌رسانی">
            <select className="select" value={recallScope} onChange={(e) => setRecallScope(e.target.value)}>
              {['فقط مشتریان خریدار این بچ', 'همه مشتریان دارای این کالا', 'اعلام عمومی در سایت'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="علت فراخوان">
            <textarea rows={3} className="input" defaultValue="مغایرت در دمای نگهداری و احتمال افت کیفیت — اقدام احتیاطی." />
          </Field>
          <Card className="bg-rose-50/70 dark:bg-rose-900/20">
            <p className="num text-[11.5px] leading-6 text-rose-800 dark:text-rose-200">
              با ثبت فراخوان، به مشتریان خریدار پیامک/اعلان نمایشی ارسال می‌شود، کالا از کاتالوگ موقتاً غیرفعال و
              مرجوعی به تأمین‌کننده ثبت می‌گردد. مسیر اطلاع‌رسانی: {recallScope}
            </p>
          </Card>
        </div>
      </Modal>
    </AdminPage>
  );
};
export default ComplianceAdmin;
