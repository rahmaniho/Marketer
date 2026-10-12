import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Pagination, Stat, Switch, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark } from '@/components/BrandLogo';
import { faNum, jalaliDate, exportCsv, daysUntil } from '@/lib/format';
import { useBrands, useProducts, useStore } from '@/store/useStore';
import { rootCategories, categoryById } from '@/data/categories';
import type { Brand, LicenseKind, LicenseStatus } from '@/lib/types';

const LICENSE_LABELS: Record<LicenseKind, string> = {
  IRC: 'پروانه ثبت کالا (IRC)',
  'وزارت بهداشت': 'پروانه وزارت بهداشت',
  حلال: 'گواهی حلال',
  ارگانیک: 'گواهی ارگانیک',
  استاندارد: 'استاندارد ملی ایران',
};

const STATUS_LABELS: Record<LicenseStatus, string> = {
  valid: 'معتبر',
  expiring: 'نزدیک انقضا',
  pending: 'در حال تمدید',
  expired: 'منقضی',
};

const BrandsAdmin = () => {
  const brands = useBrands();
  const products = useProducts();
  const upsertBrand = useStore((s) => s.upsertBrand);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [origin, setOrigin] = useState('all');
  const [cat, setCat] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Brand | null>(null);
  const PER = 12;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.brandId, (map.get(p.brandId) ?? 0) + 1));
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return brands.filter((b) => {
      if (origin !== 'all' && b.origin !== origin) return false;
      if (cat !== 'all' && !b.categoryIds.includes(cat)) return false;
      if (status !== 'all' && b.licenseStatus !== status) return false;
      if (term && !b.name.includes(term) && !b.nameEn.toLowerCase().includes(term.toLowerCase())) return false;
      return true;
    });
  }, [brands, q, origin, cat, status]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);

  const newBrand = (): Brand => ({
    id: `b-${Math.floor(Math.random() * 900 + 100)}`,
    name: '',
    nameEn: '',
    slug: '',
    country: 'ایران',
    origin: 'iran',
    industry: 'food',
    categoryIds: [rootCategories[0].id],
    productLines: [],
    description: '',
    licenseKind: 'IRC',
    licenseCode: '',
    licenseStatus: 'valid',
    licenseExpiry: new Date(Date.now() + 365 * 86400000).toISOString(),
    logo: { from: '#0f684c', to: '#0a4a35', fg: '#ffffff', shape: 'round', initials: '' },
    established: 1400,
    rating: 4.5,
    isActive: true,
    tags: [],
  });

  return (
    <AdminPage
      title="مدیریت برندها و مجوزها"
      subtitle={`${faNum(brands.length)} برند • ${faNum(brands.filter((b) => b.origin === 'international').length)} برند خارجی دارای مجوز`}
      icon="award"
      actions={
        <>
          <button
            className="btn-ghost btn-sm"
            onClick={() =>
              exportCsv(
                [['نام', 'نام لاتین', 'کشور', 'نوع', 'کد مجوز', 'وضعیت مجوز', 'انقضا', 'تعداد کالا'],
                  ...filtered.map((b) => [b.name, b.nameEn, b.country, LICENSE_LABELS[b.licenseKind], b.licenseCode, STATUS_LABELS[b.licenseStatus], b.licenseExpiry, counts.get(b.id) ?? 0])],
                'brands-report.csv',
              )
            }
          >
            <Icon name="sheet" className="h-4 w-4" />
            خروجی CSV
          </button>
          <button className="btn-primary btn-sm" onClick={() => setDraft(newBrand())}>
            <Icon name="plus" className="h-4 w-4" />
            برند جدید
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کدهای کالای فعال" value={faNum(products.length)} icon="package" />
        <Stat label="برندهای ایرانی" value={faNum(brands.filter((b) => b.origin === 'iran').length)} icon="award" />
        <Stat label="برندهای وارداتی" value={faNum(brands.filter((b) => b.origin === 'international').length)} icon="globe" tone="info" />
        <Stat label="مجوزهای نیازمند تمدید" value={faNum(brands.filter((b) => b.licenseStatus !== 'valid').length)} icon="alert" tone="accent" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی نام فارسی یا لاتین برند…" />
        <select value={origin} onChange={(e) => { setOrigin(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه مبدأها</option>
          <option value="iran">ایرانی</option>
          <option value="international">بین‌المللی</option>
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه دسته‌ها</option>
          {rootCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">وضعیت مجوز (همه)</option>
          {(Object.keys(STATUS_LABELS) as LicenseStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>برند</th>
            <th>کشور / نوع</th>
            <th>دسته‌های فعالیت</th>
            <th>خطوط تولید</th>
            <th>کد مجوز</th>
            <th>وضعیت مجوز</th>
            <th>کالا</th>
            <th>فعال</th>
            <th>اقدام</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={9} text="برندی با این فیلترها یافت نشد" />
          ) : (
            items.map((b) => (
              <tr key={b.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <BrandMark brand={b} size={38} rounded />
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-[10.5px] text-ink-400" dir="ltr">
                        {b.nameEn}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  {b.country}
                  <span className="block text-[10.5px] text-ink-400">{LICENSE_LABELS[b.licenseKind]}</span>
                </td>
                <td className="text-[11px]">
                  {b.categoryIds
                    .map((id) => categoryById(id)?.name)
                    .filter(Boolean)
                    .join(' ، ')}
                </td>
                <td className="num text-[11px]">{faNum(b.productLines.length)} خط تولید</td>
                <td className="num text-[11px]" dir="ltr">
                  {b.licenseCode}
                  <span className="block text-[10.5px] text-ink-400">انقضا: {jalaliDate(b.licenseExpiry)}</span>
                </td>
                <td>
                  <Badge
                    tone={
                      b.licenseStatus === 'valid' ? 'success' : b.licenseStatus === 'expiring' ? 'warning' : b.licenseStatus === 'pending' ? 'info' : 'danger'
                    }
                  >
                    {STATUS_LABELS[b.licenseStatus]}
                  </Badge>
                  {b.licenseStatus === 'expiring' && (
                    <span className="num mt-1 block text-[10.5px] text-amber-600 dark:text-amber-400">{faNum(daysUntil(b.licenseExpiry))} روز مانده</span>
                  )}
                </td>
                <td className="num">{faNum(counts.get(b.id) ?? 0)}</td>
                <td>
                  <Switch
                    checked={b.isActive}
                    onChange={(v) => {
                      upsertBrand({ ...b, isActive: v });
                      toast(v ? `برند ${b.name} فعال شد` : `برند ${b.name} غیرفعال شد`);
                    }}
                    label=""
                  />
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDraft({ ...b })}>
                    <Icon name="edit" className="h-3.5 w-3.5" />
                    ویرایش
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Card className="bg-ink-50/70 dark:bg-ink-800/40">
        <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
          <span className="font-bold">توجه نمایشی: </span>
          لوگوهای نمایش‌داده‌شده در این پنل، طرح‌های مونوگرام اختصاصی این دمو هستند («لوگوی نمایشی») و صرفاً برای
          نمایش چیدمان استفاده می‌شوند؛ در نسخه عملیاتی، فایل رسمی لوگو و مجوز بهره‌برداری از برند در این بخش بارگذاری
          و بایگانی می‌شود.
        </p>
      </Card>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.name ? `ویرایش برند — ${draft.name}` : 'افزودن برند جدید'}
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!draft) return;
                if (!draft.name.trim()) {
                  toast('نام برند الزامی است', 'error');
                  return;
                }
                upsertBrand({ ...draft, slug: draft.slug || draft.nameEn.toLowerCase().replace(/\s+/g, '-') });
                toast(`برند «${draft.name}» ذخیره شد`);
                setDraft(null);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ذخیره برند
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام فارسی" required>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
              </Field>
              <Field label="نام لاتین">
                <input value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} className="input" dir="ltr" />
              </Field>
              <Field label="کشور مبدأ">
                <input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className="input" />
              </Field>
              <Field label="سال تأسیس">
                <input type="number" value={draft.established} onChange={(e) => setDraft({ ...draft, established: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="نوع برند / مجوز">
                <select value={draft.licenseKind} onChange={(e) => setDraft({ ...draft, licenseKind: e.target.value as LicenseKind })} className="select">
                  {(Object.keys(LICENSE_LABELS) as LicenseKind[]).map((k) => (
                    <option key={k} value={k}>
                      {LICENSE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="وضعیت مجوز">
                <select value={draft.licenseStatus} onChange={(e) => setDraft({ ...draft, licenseStatus: e.target.value as LicenseStatus })} className="select">
                  {(Object.keys(STATUS_LABELS) as LicenseStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="کد مجوز / IRC">
                <input value={draft.licenseCode} onChange={(e) => setDraft({ ...draft, licenseCode: e.target.value })} className="input num" dir="ltr" />
              </Field>
              <Field label="تاریخ انقضای مجوز">
                <input type="date" value={draft.licenseExpiry.slice(0, 10)} onChange={(e) => setDraft({ ...draft, licenseExpiry: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
            </div>

            <Field label="دسته‌های فعالیت">
              <select
                multiple
                value={draft.categoryIds}
                onChange={(e) => setDraft({ ...draft, categoryIds: Array.from(e.target.selectedOptions).map((o) => o.value) })}
                className="select h-36"
              >
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="خطوط تولید (با کاما جدا کنید)">
              <input
                value={draft.productLines.join('، ')}
                onChange={(e) => setDraft({ ...draft, productLines: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })}
                className="input"
                placeholder="لبنیات، بستنی، پنیر"
              />
            </Field>

            <Field label="توضیح برند">
              <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="input" />
            </Field>

            <Card padded={false} className="p-3">
              <p className="mb-2 text-[12px] font-extrabold">لوگوی نمایشی (مونوگرام)</p>
              <div className="flex flex-wrap items-center gap-3">
                <BrandMark brand={draft} size={56} rounded />
                <div className="grid flex-1 gap-2 sm:grid-cols-3">
                  <Field label="حروف اختصاری">
                    <input value={draft.logo.initials} maxLength={3} onChange={(e) => setDraft({ ...draft, logo: { ...draft.logo, initials: e.target.value } })} className="input" />
                  </Field>
                  <Field label="رنگ اصلی">
                    <input type="color" value={draft.logo.from} onChange={(e) => setDraft({ ...draft, logo: { ...draft.logo, from: e.target.value } })} className="input h-10 p-1" />
                  </Field>
                  <Field label="شکل">
                    <select value={draft.logo.shape} onChange={(e) => setDraft({ ...draft, logo: { ...draft.logo, shape: e.target.value as Brand['logo']['shape'] } })} className="select">
                      {['round', 'square', 'shield', 'hex', 'pill'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default BrandsAdmin;
