import { useMemo, useState } from 'react';
import { AdminPage, EmptyRow, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Modal, Progress, Stat, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark } from '@/components/BrandLogo';
import { daysUntil, faNum, jalaliDate, tomanShort } from '@/lib/format';
import { useBrands, useProducts } from '@/store/useStore';
import { batches, suppliers } from '@/data/ops';
import type { Supplier } from '@/lib/types';

const SuppliersAdmin = () => {
  const brands = useBrands();
  const products = useProducts();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim();
    return suppliers.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (term && !s.name.includes(term) && !s.contractCode.includes(term) && !s.contactName.includes(term)) return false;
      return true;
    });
  }, [q, status]);

  const avgFill = suppliers.reduce((s, x) => s + x.fillRate, 0) / Math.max(1, suppliers.length);
  const totalVolume = suppliers.reduce((s, x) => s + x.monthlyVolume, 0);

  return (
    <AdminPage
      title="تأمین‌کنندگان و کارخانه‌ها"
      subtitle={`${faNum(suppliers.length)} تأمین‌کننده فعال • میانگین نرخ تأمین ${faNum(avgFill, 1)}٪`}
      icon="truck"
      actions={
        <button className="btn-ghost btn-sm" onClick={() => toast('فرم ارزیابی تأمین‌کننده به کارخانه‌ها ارسال شد (نمایشی)')}>
          <Icon name="clipboard" className="h-4 w-4" />
          ارزیابی دوره‌ای
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="تأمین‌کنندگان فعال" value={faNum(suppliers.filter((s) => s.status === 'active').length)} icon="truck" />
        <Stat label="حجم خرید ماهانه" value={tomanShort(totalVolume)} icon="chart" tone="info" />
        <Stat label="میانگین نرخ تأمین" value={`${faNum(avgFill, 1)}٪`} icon="check-circle" tone="accent" />
        <Stat label="قراردادهای نزدیک انقضا" value={faNum(suppliers.filter((s) => daysUntil(s.contractExpiry) < 120).length)} icon="alert" tone="danger" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl2 border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی نام تأمین‌کننده، کد قرارداد یا شخص رابط…" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="review">در بازبینی</option>
          <option value="suspended">معلق</option>
        </select>
      </div>

      <TableWrap>
        <thead>
          <tr>
            <th>تأمین‌کننده</th>
            <th>کشور</th>
            <th>برندهای تحت پوشش</th>
            <th>نرخ تأمین</th>
            <th>زمان تحویل</th>
            <th>شرایط پرداخت</th>
            <th>حجم ماهانه</th>
            <th>انقضای قرارداد</th>
            <th>وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={10} text="تأمین‌کننده‌ای یافت نشد" />
          ) : (
            filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="font-semibold">{s.name}</span>
                  <span className="num block text-[10.5px] text-ink-400">{s.contactName} • {s.phone}</span>
                </td>
                <td className="text-[11.5px]">{s.country}</td>
                <td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.brandIds.slice(0, 4).map((id) => {
                      const b = brands.find((x) => x.id === id);
                      return b ? <BrandMark key={id} brand={b} size={24} rounded /> : null;
                    })}
                    <span className="num text-[10.5px] text-ink-400">{faNum(s.brandIds.length)} برند</span>
                  </div>
                </td>
                <td>
                  <span className="num text-[11.5px] font-bold">{faNum(s.fillRate, 1)}٪</span>
                  <MiniBar value={s.fillRate} max={100} color={s.fillRate > 90 ? '#0f684c' : '#f9a307'} />
                </td>
                <td className="num">{faNum(s.leadTimeDays)} روز</td>
                <td className="text-[11px]">{s.paymentTerms}</td>
                <td className="num font-bold">{tomanShort(s.monthlyVolume)}</td>
                <td className="num text-[11px]">{jalaliDate(s.contractExpiry)}</td>
                <td>
                  <Badge tone={s.status === 'active' ? 'success' : s.status === 'review' ? 'warning' : 'danger'}>
                    {s.status === 'active' ? 'فعال' : s.status === 'review' ? 'در بازبینی' : 'معلق'}
                  </Badge>
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(s)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    پرونده
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">توزیع حجم خرید بین تأمین‌کنندگان</p>
          <div className="space-y-2.5">
            {[...suppliers]
              .sort((a, b) => b.monthlyVolume - a.monthlyVolume)
              .map((s) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{s.name}</span>
                    <span className="num text-ink-500 dark:text-ink-400">{tomanShort(s.monthlyVolume)}</span>
                  </div>
                  <MiniBar value={s.monthlyVolume} max={Math.max(...suppliers.map((x) => x.monthlyVolume))} />
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">پورتال تأمین‌کننده (نمایشی)</p>
          <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
            هر تأمین‌کننده در نسخه عملیاتی به پورتال اختصاصی دسترسی دارد و می‌تواند موجودی، قیمت‌های عمده، زمان
            تولید و اسناد کیفیت را بارگذاری کند. در این دمو، نمونه‌ی این پورتال در مسیر{' '}
            <span className="num font-bold">/admin/supplier-portal</span> شبیه‌سازی شده است.
          </p>
          <div className="mt-3 space-y-2 text-[11.5px]">
            {[
              ['ثبت قیمت عمده جدید', 'tag'],
              ['اعلام موجودی و زمان تولید', 'warehouse'],
              ['بارگذاری گواهی‌ها و آزمون آزمایشگاه', 'shield'],
              ['مشاهده سفارش‌های خرید پلتفرم', 'truck'],
            ].map(([label, icon]) => (
              <div key={label} className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                <Icon name={icon} className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>{label}</span>
                <Badge tone="neutral" className="mr-auto">
                  نمایشی
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`پرونده تأمین‌کننده — ${detail?.name ?? ''}`}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('درخواست تمدید قرارداد ثبت شد (نمایشی)')}>
              درخواست تمدید
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
                ['شخص رابط', detail.contactName],
                ['تلفن', detail.phone],
                ['ایمیل', detail.email],
                ['کد قرارداد', detail.contractCode],
                ['انقضای قرارداد', jalaliDate(detail.contractExpiry)],
                ['امتیاز ارزیابی', `${faNum(detail.rating, 1)} از ۵`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>

            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-2 text-[11.5px] font-bold">شاخص‌های عملکرد (KPI)</p>
              <div className="space-y-2.5">
                <Progress value={detail.fillRate} label={`نرخ تأمین به‌موقع: ${faNum(detail.fillRate, 1)}٪`} />
                <Progress value={(detail.rating / 5) * 100} color="#f9a307" label={`کیفیت کالا: ${faNum((detail.rating / 5) * 100, 0)}٪`} />
                <Progress value={100 - detail.leadTimeDays} color="#0ea5e9" label={`سرعت تحویل: ${faNum(detail.leadTimeDays)} روز زمان تأمین`} />
              </div>
            </Card>

            <div>
              <p className="mb-2 text-[11.5px] font-bold">بچ‌های تأمین‌شده توسط این تأمین‌کننده</p>
              <div className="space-y-2">
                {batches
                  .filter((b) => b.supplierId === detail.id)
                  .slice(0, 5)
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11px] dark:border-ink-700">
                      <span className="num" dir="ltr">
                        {b.batchNo}
                      </span>
                      <span className="truncate">{products.find((p) => p.id === b.productId)?.name}</span>
                      <span className="num">{faNum(b.qty)}</span>
                      <Badge tone={b.qcStatus === 'passed' ? 'success' : b.qcStatus === 'pending' ? 'warning' : 'danger'}>
                        {b.qcStatus === 'passed' ? 'QC تأیید' : b.qcStatus === 'pending' ? 'در انتظار' : 'رد شده'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{detail.notes}</p>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default SuppliersAdmin;
