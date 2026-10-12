import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, DemoNote, EmptyState, Field, Modal, SectionTitle, Stat, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark } from '@/components/BrandLogo';
import { faNum, jalaliDate, toman, tomanShort } from '@/lib/format';
import { useBrands, useOrders, useProducts, useStore } from '@/store/useStore';
import { suppliers } from '@/data/ops';
import { batches } from '@/data/ops';
import { products as mockProducts } from '@/data/products';

/**
 * پورتال تأمین‌کننده (Mock)
 * نمایش سفارش‌های مرتبط، موجودی، قیمت پیشنهادی و اسناد
 */
const SupplierPortal = () => {
  const supplier = suppliers[0];
  const products = useProducts();
  const brands = useBrands();
  const orders = useOrders();
  const upsertProduct = useStore((s) => s.upsertProduct);
  const { toast } = useToast();
  const [tab, setTab] = useState('orders');
  const [editing, setEditing] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState(0);

  const supplierProducts = products.filter((p) => supplier.brandIds.includes(p.brandId));
  const supplierOrders = orders.filter((o) => o.items.some((i) => supplierProducts.some((p) => p.id === i.productId)));
  const supplierBatches = batches.filter((b) => supplierProducts.some((p) => p.id === b.productId));
  const revenue = supplierOrders.reduce((s, o) => s + o.grandTotal, 0);

  const editingProduct = supplierProducts.find((p) => p.id === editing);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="پورتال تأمین‌کننده"
        subtitle={`${supplier.name} — نماینده برند ${brands.find((b) => b.id === supplier.brandIds[0])?.name ?? ''} • نسخه نمایشی`}
        icon="server"
        action={
          <Link to="/admin" className="btn-ghost btn-sm">
            <Icon name="shield" className="h-4 w-4" />
            بازگشت به پنل مدیریت
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="کد کالای من" value={faNum(supplierProducts.length)} icon="package" />
        <Stat label="سفارش‌های مرتبط" value={faNum(supplierOrders.length)} icon="clipboard" tone="info" />
        <Stat label="ارزش سفارش‌ها" value={tomanShort(revenue)} icon="chart" tone="accent" />
        <Stat label="نرخ تأمین (Fill Rate)" value={`${faNum(supplier.fillRate)}٪`} icon="check-circle" tone="brand" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'orders', label: 'سفارش‌های مرتبط', icon: 'clipboard', count: supplierOrders.length },
          { id: 'catalog', label: 'کالا و قیمت پیشنهادی', icon: 'tag', count: supplierProducts.length },
          { id: 'inventory', label: 'موجودی و بچ', icon: 'warehouse' },
          { id: 'docs', label: 'اسناد و قرارداد', icon: 'fileText' },
        ]}
      />

      {tab === 'orders' && (
        <Card padded={false} className="overflow-x-auto">
          {supplierOrders.length === 0 ? (
            <EmptyState title="سفارشی مرتبط با کالاهای این تأمین‌کننده وجود ندارد" />
          ) : (
            <table className="table-basic min-w-[760px]">
              <thead>
                <tr>
                  <th>کد سفارش</th>
                  <th>مشتری</th>
                  <th>تاریخ</th>
                  <th>اقلام مرتبط</th>
                  <th>مبلغ کل سفارش</th>
                  <th>وضعیت</th>
                  <th>اقدام</th>
                </tr>
              </thead>
              <tbody>
                {supplierOrders.slice(0, 12).map((o) => {
                  const related = o.items.filter((i) => supplierProducts.some((p) => p.id === i.productId));
                  return (
                    <tr key={o.id}>
                      <td className="num font-bold">{o.code}</td>
                      <td>{o.customerName}</td>
                      <td className="num">{jalaliDate(o.createdAt)}</td>
                      <td className="num">{faNum(related.length)} قلم</td>
                      <td className="num">{toman(o.grandTotal, false)}</td>
                      <td>
                        <Badge tone={o.status === 'delivered' ? 'success' : o.status === 'canceled' ? 'danger' : 'info'}>
                          {o.status === 'delivered' ? 'تحویل‌شده' : o.status === 'canceled' ? 'لغوشده' : 'در جریان'}
                        </Badge>
                      </td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={() => toast('تأیید تأمین ثبت شد (نمایشی)')}>
                          تأیید تأمین
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'catalog' && (
        <Card padded={false} className="overflow-x-auto">
          <table className="table-basic min-w-[720px]">
            <thead>
              <tr>
                <th>کالا</th>
                <th>برند</th>
                <th>قیمت فعلی پلتفرم</th>
                <th>قیمت پیشنهادی شما</th>
                <th>موجودی</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {supplierProducts.slice(0, 15).map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td>{brands.find((b) => b.id === p.brandId)?.name}</td>
                  <td className="num">{faNum(p.basePrice)}</td>
                  <td className="num text-brand-700 dark:text-brand-300">{faNum(Math.round(p.basePrice * 0.96))}</td>
                  <td className="num">{faNum(p.stock)} {p.unit}</td>
                  <td>
                    <button
                      className="btn-soft btn-sm"
                      onClick={() => {
                        setEditing(p.id);
                        setNewPrice(Math.round(p.basePrice * 0.96));
                      }}
                    >
                      <Icon name="edit" className="h-3.5 w-3.5" />
                      پیشنهاد قیمت
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'inventory' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">موجودی کالاهای من</p>
            <div className="space-y-2">
              {supplierProducts.slice(0, 8).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                  <span className="truncate">{p.name}</span>
                  <span className="num font-bold">{faNum(p.stock)} {p.unit}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">بچ‌های تولیدی</p>
            <div className="max-h-72 space-y-2 overflow-y-auto pl-1">
              {supplierBatches.slice(0, 10).map((b) => (
                <div key={b.id} className="rounded-xl border border-ink-200 px-3 py-2 text-[11px] dark:border-ink-700">
                  <div className="flex items-center justify-between">
                    <span className="num font-bold">{b.batchNo}</span>
                    <Badge tone={b.qcStatus === 'passed' ? 'success' : b.qcStatus === 'pending' ? 'warning' : 'danger'}>
                      {b.qcStatus === 'passed' ? 'کیفیت تأییدشده' : b.qcStatus === 'pending' ? 'در انتظار آزمون' : 'مردود'}
                    </Badge>
                  </div>
                  <p className="num mt-0.5 text-ink-500 dark:text-ink-400">
                    تولید {jalaliDate(b.productionDate)} • انقضا {jalaliDate(b.expiryDate)} • {faNum(b.qty)} کارتن
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'docs' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">اطلاعات قرارداد</p>
            <div className="space-y-2 text-[12px]">
              {[
                ['کد قرارداد', supplier.contractCode],
                ['شماره تماس', supplier.phone],
                ['ایمیل', supplier.email],
                ['شرایط پرداخت', supplier.paymentTerms],
                ['مهلت تأمین (Lead Time)', `${faNum(supplier.leadTimeDays)} روز`],
                ['تاریخ انقضا', jalaliDate(supplier.contractExpiry)],
                ['امتیاز عملکرد', `${faNum(supplier.rating, 1)} از ۵`],
                ['وضعیت', supplier.status === 'active' ? 'فعال' : 'معلق'],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between border-b border-dashed border-ink-200 py-1.5 dark:border-ink-700">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className="num font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">اسناد و مجوزهای بارگذاری‌شده</p>
            <div className="space-y-2">
              {[
                ['پروانه ساخت / IRC', 'verified'],
                ['گواهی حلال', 'verified'],
                ['گواهی آزمون کیفیت آزمایشگاه', 'pending'],
                ['بارنامه و اسناد حمل', 'verified'],
                ['بیمه‌نامه محصول', 'pending'],
              ].map(([n, s]) => (
                <div key={n} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                  <span className="flex items-center gap-2">
                    <Icon name="fileText" className="h-4 w-4 text-ink-400" />
                    {n}
                  </span>
                  <Badge tone={s === 'verified' ? 'success' : 'warning'}>{s === 'verified' ? 'تأییدشده' : 'در انتظار'}</Badge>
                </div>
              ))}
            </div>
            <button className="btn-soft btn-sm mt-3 w-full" onClick={() => toast('آپلود سند در نسخه دمو غیرفعال است', 'info')}>
              <Icon name="plus" className="h-4 w-4" />
              بارگذاری سند جدید
            </button>
          </Card>
        </div>
      )}

      <Card>
        <p className="mb-2 text-[13px] font-extrabold">پروفایل برند تحت نمایندگی</p>
        <div className="flex flex-wrap items-center gap-3">
          {supplier.brandIds.map((bid) => {
            const b = brands.find((x) => x.id === bid);
            return b ? (
              <div key={bid} className="flex items-center gap-2.5 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                <BrandMark brand={b} size={34} />
                <div>
                  <p className="text-[12.5px] font-bold">{b.name}</p>
                  <p className="text-[10.5px] text-ink-500 dark:text-ink-400">{b.country} • {b.licenseKind}</p>
                </div>
              </div>
            ) : null;
          })}
        </div>
      </Card>

      <DemoNote>
        پورتال تأمین‌کننده در این نسخه نمایشی است. در نسخه عملیاتی، تأمین‌کننده می‌تواند قیمت پیشنهادی، موجودی و اسناد
        خود را به‌روزرسانی کند و سفارش‌های مرتبط را تأیید نماید.
      </DemoNote>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="ثبت قیمت پیشنهادی تأمین‌کننده"
        size="sm"
        footer={
          <div className="flex w-full gap-2">
            <button className="btn-ghost flex-1" onClick={() => setEditing(null)}>
              انصراف
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() => {
                if (editingProduct && newPrice > 0) {
                  upsertProduct({ ...editingProduct, basePrice: newPrice });
                  toast('قیمت پیشنهادی ثبت و برای تأیید مدیر فروش ارسال شد (نمایشی)');
                }
                setEditing(null);
              }}
            >
              ثبت پیشنهاد
            </button>
          </div>
        }
      >
        {editingProduct && (
          <div className="space-y-3">
            <p className="text-[12.5px] font-bold">{editingProduct.name}</p>
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="rounded-xl bg-ink-50 px-3 py-2 dark:bg-ink-800/60">
                <p className="text-ink-500 dark:text-ink-400">قیمت فعلی پلتفرم</p>
                <p className="num font-bold">{toman(editingProduct.basePrice, false)}</p>
              </div>
              <div className="rounded-xl bg-ink-50 px-3 py-2 dark:bg-ink-800/60">
                <p className="text-ink-500 dark:text-ink-400">قیمت پیشنهادی</p>
                <p className="num font-bold text-brand-700 dark:text-brand-300">{toman(newPrice, false)}</p>
              </div>
            </div>
            <Field label="قیمت پیشنهادی جدید (تومان)" hint={`قیمت فعلی پلتفرم: ${toman(editingProduct.basePrice, false)} تومان`}>
              <input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} className="input num" />
            </Field>
            <DemoNote>
              ثبت قیمت پیشنهادی در این دمو فقط روی داده محلی اعمال می‌شود و نیازی به تأیید واقعی ندارد.
            </DemoNote>
          </div>
        )}
      </Modal>

      <p className="text-center text-[11px] text-ink-400">
        تعداد کالای نمونه در پورتال تأمین‌کننده: {faNum(mockProducts.length)} کد کالا (کل کاتالوگ دمو)
      </p>
    </div>
  );
};

export default SupplierPortal;
