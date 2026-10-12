import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Pagination, Stat, Switch, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductVisual } from '@/components/ProductVisual';
import { faNum, toman, tomanShort, jalaliDate, exportCsv } from '@/lib/format';
import { useBrands, useProducts, useStore } from '@/store/useStore';
import { childrenOf, rootCategories, categoryById } from '@/data/categories';
import { warehouses } from '@/data/ops';
import type { Product, SalesUnit } from '@/lib/types';

const BADGE_LABELS: Record<string, string> = {
  halal: 'حلال',
  organic: 'ارگانیک',
  imported: 'وارداتی',
  irc: 'IRC',
  new: 'جدید',
  bestseller: 'پرفروش',
  expiring: 'نزدیک انقضا',
};

const UNITS: SalesUnit[] = ['کارتن', 'شرینک', 'کیسه', 'بسته', 'پالت', 'حلقه'];

const ProductsAdmin = () => {
  const products = useProducts();
  const brands = useBrands();
  const upsertProduct = useStore((s) => s.upsertProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('all');
  const [root, setRoot] = useState('all');
  const [stock, setStock] = useState('all');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Product | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const PER = 10;

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const lowStock = products.filter((p) => p.stock <= 12).length;

  const filtered = useMemo(() => {
    const term = q.trim();
    return products.filter((p) => {
      if (brand !== 'all' && p.brandId !== brand) return false;
      if (root !== 'all') {
        const cat = categoryById(p.categoryId);
        const rootId = cat?.parentId ?? cat?.id;
        if (rootId !== root) return false;
      }
      if (stock === 'low' && p.stock > 12) return false;
      if (stock === 'zero' && p.stock > 0) return false;
      if (stock === 'expiring' && !p.badges.includes('expiring')) return false;
      if (term && !p.name.includes(term) && !p.sku.includes(term) && !p.barcode.includes(term)) return false;
      return true;
    });
  }, [products, q, brand, root, stock]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);

  const newProduct = (): Product => ({
    id: `p-${Math.floor(Math.random() * 9000 + 1000)}`,
    name: '',
    nameEn: '',
    brandId: brands[0]?.id ?? '',
    categoryId: rootCategories[0].id,
    barcode: '6260000000000',
    sku: 'NEW-1000',
    unit: 'کارتن',
    unitsPerCarton: 12,
    packDesc: '۱۲ عدد',
    basePrice: 1_000_000,
    marketPrice: 1_150_000,
    cashDiscountPercent: 3,
    tiers: [
      { minQty: 1, price: 1_000_000, discountPercent: 0, label: 'قیمت پایه' },
      { minQty: 5, price: 950_000, discountPercent: 5, label: '۵ کارتن' },
      { minQty: 20, price: 900_000, discountPercent: 10, label: '۲۰ کارتن' },
    ],
    stock: 50,
    reserved: 0,
    warehouseId: warehouses[0].id,
    productionDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
    shelfLifeMonths: 12,
    moq: 2,
    paletteQty: 48,
    country: 'ایران',
    images: [{ seed: 'new', hue: '#0f684c', icon: 'package' }],
    badges: ['halal'],
    tags: [],
    description: '',
    rating: 4.5,
    soldCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  return (
    <AdminPage
      title="مدیریت کالاها"
      subtitle={`${faNum(products.length)} کد کالا • ${faNum(lowStock)} کالا زیر نقطه سفارش`}
      icon="package"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => exportCsv([['نام', 'برند', 'SKU', 'بارکد', 'قیمت پایه', 'موجودی', 'MOQ', 'وضعیت'], ...filtered.map((p) => [p.name, brandMap.get(p.brandId)?.name ?? '', p.sku, p.barcode, p.basePrice, p.stock, p.moq, p.isActive ? 'فعال' : 'غیرفعال'])], 'products-report.csv')}>
            <Icon name="sheet" className="h-4 w-4" />
            خروجی CSV
          </button>
          <button className="btn-primary btn-sm" onClick={() => setDraft(newProduct())}>
            <Icon name="plus" className="h-4 w-4" />
            کالای جدید
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل کدهای کالا" value={faNum(products.length)} icon="package" />
        <Stat label="کالاهای وارداتی" value={faNum(products.filter((p) => p.badges.includes('imported')).length)} icon="globe" tone="info" />
        <Stat label="نزدیک انقضا" value={faNum(products.filter((p) => p.badges.includes('expiring')).length)} icon="alert" tone="accent" />
        <Stat label="ناموجود / کم‌موجود" value={faNum(products.filter((p) => p.stock <= 12).length)} icon="box" tone="danger" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی نام کالا، SKU یا بارکد…" />
        <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه برندها</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select value={root} onChange={(e) => { setRoot(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه دسته‌ها</option>
          {rootCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={stock} onChange={(e) => { setStock(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">وضعیت موجودی (همه)</option>
          <option value="low">کم‌موجود</option>
          <option value="zero">ناموجود</option>
          <option value="expiring">نزدیک انقضا</option>
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>کالا</th>
            <th>برند / دسته</th>
            <th>وضعیت‌ها</th>
            <th>قیمت پایه</th>
            <th>پله‌های قیمت</th>
            <th>موجودی</th>
            <th>MOQ</th>
            <th>فعال</th>
            <th>اقدام</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <EmptyRow colSpan={9} text="کالایی با این فیلترها یافت نشد" />
          ) : (
            items.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 flex-none overflow-hidden rounded-lg">
                      <ProductVisual product={p} size="sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="num text-[10.5px] text-ink-400">{p.sku} • {p.barcode}</p>
                    </div>
                  </div>
                </td>
                <td>
                  {brandMap.get(p.brandId)?.name ?? '—'}
                  <span className="block text-[10.5px] text-ink-400">{categoryById(p.categoryId)?.name}</span>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {p.badges.slice(0, 2).map((b) => (
                      <span key={b} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        {BADGE_LABELS[b] ?? b}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="num font-bold">{toman(p.basePrice, false)}</td>
                <td className="num text-[11px]">
                  {p.tiers.slice(0, 3).map((t) => `${faNum(t.minQty)}+→${faNum(t.discountPercent)}٪`).join(' | ')}
                </td>
                <td>
                  <span className={`num font-bold ${p.stock <= 12 ? 'text-rose-600 dark:text-rose-400' : ''}`}>{faNum(p.stock)}</span>
                  <span className="block text-[10.5px] text-ink-400">{p.unit}</span>
                </td>
                <td className="num">{faNum(p.moq)}</td>
                <td>
                  <Switch
                    checked={p.isActive}
                    onChange={(v) => {
                      upsertProduct({ ...p, isActive: v });
                      toast(v ? `«${p.name}» فعال شد` : `«${p.name}» غیرفعال شد`);
                    }}
                    label=""
                  />
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-sm" onClick={() => setViewing(p)}>
                      <Icon name="eye" className="h-3.5 w-3.5" />
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => setDraft({ ...p })}>
                      <Icon name="edit" className="h-3.5 w-3.5" />
                    </button>
                    <button className="btn-ghost btn-sm text-rose-600" onClick={() => setConfirmDelete(p)}>
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      {/* فرم کالا */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.name ? `ویرایش کالا — ${draft.name}` : 'افزودن کالای جدید'}
        size="xl"
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
                  toast('نام کالا الزامی است', 'error');
                  return;
                }
                upsertProduct(draft);
                toast(`کالای «${draft.name}» ذخیره شد`);
                setDraft(null);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ذخیره کالا
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="نام فارسی کالا" required>
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
              </Field>
              <Field label="نام لاتین">
                <input value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} className="input" dir="ltr" />
              </Field>
              <Field label="کد SKU">
                <input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} className="input num" dir="ltr" />
              </Field>
              <Field label="برند">
                <select value={draft.brandId} onChange={(e) => setDraft({ ...draft, brandId: e.target.value })} className="select">
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="دسته‌بندی">
                <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="select">
                  {rootCategories.flatMap((r) => [r, ...childrenOf(r.id)]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `— ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="بارکد">
                <input value={draft.barcode} onChange={(e) => setDraft({ ...draft, barcode: e.target.value })} className="input num" dir="ltr" />
              </Field>
              <Field label="قیمت پایه هر واحد (تومان)" required>
                <input type="number" value={draft.basePrice} onChange={(e) => setDraft({ ...draft, basePrice: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="قیمت مصرف‌کننده (تومان)">
                <input type="number" value={draft.marketPrice} onChange={(e) => setDraft({ ...draft, marketPrice: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="تخفیف نقدی (٪)">
                <input type="number" value={draft.cashDiscountPercent} onChange={(e) => setDraft({ ...draft, cashDiscountPercent: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="واحد فروش">
                <select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as SalesUnit })} className="select">
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </Field>
              <Field label="تعداد در بسته‌بندی">
                <input type="number" value={draft.unitsPerCarton} onChange={(e) => setDraft({ ...draft, unitsPerCarton: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="شرح بسته‌بندی">
                <input value={draft.packDesc} onChange={(e) => setDraft({ ...draft, packDesc: e.target.value })} className="input" placeholder="۱۲ عدد × ۱ لیتر" />
              </Field>
              <Field label="موجودی">
                <input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="حداقل سفارش (MOQ)">
                <input type="number" value={draft.moq} onChange={(e) => setDraft({ ...draft, moq: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="تعداد در پالت">
                <input type="number" value={draft.paletteQty} onChange={(e) => setDraft({ ...draft, paletteQty: Number(e.target.value) })} className="input num" />
              </Field>
              <Field label="انبار">
                <select value={draft.warehouseId} onChange={(e) => setDraft({ ...draft, warehouseId: e.target.value })} className="select">
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="کشور مبدأ">
                <input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} className="input" />
              </Field>
              <Field label="تاریخ انقضا">
                <input type="date" value={draft.expiryDate.slice(0, 10)} onChange={(e) => setDraft({ ...draft, expiryDate: new Date(e.target.value).toISOString() })} className="input num" />
              </Field>
            </div>

            <Card padded={false} className="p-3">
              <p className="mb-2 text-[12px] font-extrabold">پله‌های قیمت عمده</p>
              <div className="space-y-2">
                {draft.tiers.map((t, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-4">
                    <input
                      type="number"
                      value={t.minQty}
                      onChange={(e) => {
                        const tiers = [...draft.tiers];
                        tiers[i] = { ...t, minQty: Number(e.target.value) };
                        setDraft({ ...draft, tiers });
                      }}
                      className="input num"
                      placeholder="از تعداد"
                    />
                    <input
                      type="number"
                      value={t.price}
                      onChange={(e) => {
                        const tiers = [...draft.tiers];
                        tiers[i] = { ...t, price: Number(e.target.value) };
                        setDraft({ ...draft, tiers });
                      }}
                      className="input num"
                      placeholder="قیمت واحد"
                    />
                    <input
                      type="number"
                      value={t.discountPercent}
                      onChange={(e) => {
                        const tiers = [...draft.tiers];
                        tiers[i] = { ...t, discountPercent: Number(e.target.value) };
                        setDraft({ ...draft, tiers });
                      }}
                      className="input num"
                      placeholder="درصد تخفیف"
                    />
                    <input value={t.label} onChange={(e) => {
                      const tiers = [...draft.tiers];
                      tiers[i] = { ...t, label: e.target.value };
                      setDraft({ ...draft, tiers });
                    }} className="input" placeholder="برچسب پله" />
                  </div>
                ))}
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setDraft({ ...draft, tiers: [...draft.tiers, { minQty: 50, price: Math.round(draft.basePrice * 0.87), discountPercent: 13, label: '۵۰ کارتن' }] })}
                >
                  <Icon name="plus" className="h-3.5 w-3.5" />
                  افزودن پله قیمت
                </button>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="برچسب‌ها (با کاما جدا کنید)">
                <input value={draft.tags.join('، ')} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })} className="input" />
              </Field>
              <Field label="توضیحات کالا">
                <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input" />
              </Field>
            </div>

            <Card padded={false} className="p-3">
              <p className="mb-2 text-[12px] font-extrabold">تصاویر کالا</p>
              <div className="flex flex-wrap items-center gap-2">
                {draft.images.map((im) => (
                  <div key={im.seed} className="h-16 w-16 overflow-hidden rounded-xl border border-ink-200 dark:border-ink-700">
                    <div className="flex h-full w-full items-center justify-center" style={{ background: `${im.hue}1a` }}>
                      <Icon name={im.icon} className="h-6 w-6" />
                    </div>
                  </div>
                ))}
                <button
                  className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-[10px] text-ink-400 hover:border-brand-400 dark:border-ink-600"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      images: [...draft.images, { seed: `up-${draft.images.length + 1}`, hue: '#0f684c', icon: 'image' }],
                    });
                    toast('تصویر نمایشی جدید افزوده شد (بارگذاری واقعی در نسخه عملیاتی)');
                  }}
                >
                  <Icon name="image" className="h-5 w-5" />
                  افزودن تصویر
                </button>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* پیش‌نمایش */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`پیش‌نمایش کالا — ${viewing?.name ?? ''}`} size="md">
        {viewing && (
          <div className="space-y-3">
            <div className="mx-auto h-40 w-full max-w-xs overflow-hidden rounded-xl2">
              <ProductVisual product={viewing} />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 text-[11.5px]">
              {[
                ['برند', brandMap.get(viewing.brandId)?.name ?? '—'],
                ['دسته', categoryById(viewing.categoryId)?.name ?? '—'],
                ['قیمت پایه', toman(viewing.basePrice, false)],
                ['قیمت مصرف‌کننده', toman(viewing.marketPrice, false)],
                ['موجودی', `${faNum(viewing.stock)} ${viewing.unit}`],
                ['انبار', warehouses.find((w) => w.id === viewing.warehouseId)?.name ?? '—'],
                ['کشور', viewing.country],
                ['تاریخ انقضا', jalaliDate(viewing.expiryDate)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{viewing.description}</p>
          </div>
        )}
      </Modal>

      {/* حذف */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="حذف کالا"
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>
              انصراف
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (confirmDelete) {
                  deleteProduct(confirmDelete.id);
                  toast(`کالای «${confirmDelete.name}» حذف شد`, 'error');
                }
                setConfirmDelete(null);
              }}
            >
              حذف قطعی
            </button>
          </div>
        }
      >
        <p className="text-[12.5px] leading-6">
          آیا از حذف کالای <span className="font-bold">«{confirmDelete?.name}»</span> مطمئن هستید؟ این عمل در نسخه دمو قابل بازگشت است (بازنشانی دمو).
        </p>
      </Modal>
    </AdminPage>
  );
};

export default ProductsAdmin;
