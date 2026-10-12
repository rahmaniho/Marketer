import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, MiniBar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Modal, Progress, Stat, Tabs, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, daysUntil, exportCsv, tomanShort } from '@/lib/format';
import { useBrands, useProducts } from '@/store/useStore';
import { batches, inventory, suppliers, warehouses } from '@/data/ops';
import { categoryById } from '@/data/categories';
import type { Batch } from '@/lib/types';

const QC_META: Record<Batch['qcStatus'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  passed: { label: 'تأییدشده', tone: 'success' },
  pending: { label: 'در انتظار کنترل', tone: 'warning' },
  failed: { label: 'رد شده', tone: 'danger' },
};

const WarehouseAdmin = () => {
  const products = useProducts();
  const brands = useBrands();
  const { toast } = useToast();
  const [tab, setTab] = useState('stock');
  const [q, setQ] = useState('');
  const [wh, setWh] = useState('all');
  const [batchDetail, setBatchDetail] = useState<Batch | null>(null);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const stockRows = useMemo(() => {
    const term = q.trim();
    return inventory.filter((r) => {
      const p = productMap.get(r.productId);
      if (!p) return false;
      if (wh !== 'all' && r.warehouseId !== wh) return false;
      if (term && !p.name.includes(term) && !p.sku.includes(term)) return false;
      return true;
    });
  }, [inventory, productMap, q, wh]);

  const expiring = batches.filter((b) => daysUntil(b.expiryDate) <= 90);
  const failedQc = batches.filter((b) => b.qcStatus === 'failed');
  const unitCost = useMemo(() => new Map(batches.map((b) => [b.productId, b.costPrice])), []);
  const totalValue = inventory.reduce((s, r) => s + r.onHand * (unitCost.get(r.productId) ?? 0), 0);

  return (
    <AdminPage
      title="انبار و موجودی"
      subtitle={`${faNum(warehouses.length)} انبار • ${faNum(inventory.length)} رکورد موجودی • ${tomanShort(totalValue)} ارزش ریالی انبار`}
      icon="warehouse"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => exportCsv([['انبار', 'کد کالا', 'نام', 'موجودی', 'رزرو', 'نقطه سفارش', 'تاریخ انقضا'], ...stockRows.map((r) => [warehouses.find((w) => w.id === r.warehouseId)?.name ?? '', productMap.get(r.productId)?.sku ?? '', productMap.get(r.productId)?.name ?? '', r.onHand, r.reserved, r.reorderPoint, productMap.get(r.productId)?.expiryDate ?? ''])], 'warehouse-report.csv')}>
            <Icon name="sheet" className="h-4 w-4" />
            خروجی موجودی
          </button>
          <button className="btn-primary btn-sm" onClick={() => toast('سفارش خرید به تأمین‌کننده ارسال شد (نمایشی)')}>
            <Icon name="truck" className="h-4 w-4" />
            سفارش خرید
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="ارزش موجودی انبار" value={tomanShort(totalValue)} icon="warehouse" />
        <Stat label="کالاهای زیر نقطه سفارش" value={faNum(inventory.filter((r) => r.onHand <= r.reorderPoint).length)} icon="alert" tone="danger" />
        <Stat label="بچ‌های نزدیک انقضا" value={faNum(expiring.length)} icon="clock" tone="accent" hint="کمتر از ۹۰ روز" />
        <Stat label="کنترل کیفیت ردشده" value={faNum(failedQc.length)} icon="shield" tone="vip" />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {warehouses.map((w) => {
          const rows = inventory.filter((r) => r.warehouseId === w.id);
          const used = Math.max(w.used, rows.reduce((s, r) => s + r.onHand, 0));
          const pct = (used / w.capacity) * 100;
          return (
            <Card key={w.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-extrabold">{w.name}</p>
                  <p className="text-[10.5px] text-ink-400">{w.city} — {w.address}</p>
                </div>
                <Badge tone={w.isActive ? 'success' : 'warning'}>{w.isActive ? 'فعال' : 'غیرفعال'}</Badge>
              </div>
              <div>
                <Progress value={pct} label={`اشغال ظرفیت: ${faNum(pct, 1)}٪ (${faNum(used)} از ${faNum(w.capacity)} واحد)`} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">مسئول انبار</span>
                  <span className="font-bold">{w.managerName}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">رکورد کالا</span>
                  <span className="num font-bold">{faNum(rows.length)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {w.zones.map((z) => (
                  <span key={z} className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {z}
                  </span>
                ))}
                {w.tempControlled && <Badge tone="info" icon="snow">کنترل دما</Badge>}
                <span className="num chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{w.phone}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <AdminToolbar>
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'stock', label: 'موجودی کالا', icon: 'package', count: inventory.length },
            { id: 'batches', label: 'بچ و انقضا', icon: 'clock', count: batches.length },
            { id: 'qc', label: 'کنترل کیفیت', icon: 'shield', count: failedQc.length },
            { id: 'suppliers', label: 'تأمین‌کنندگان', icon: 'truck', count: suppliers.length },
          ]}
        />
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی کالا یا SKU…" />
        <select value={wh} onChange={(e) => setWh(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه انبارها</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </AdminToolbar>

      {tab === 'stock' && (
        <TableWrap>
          <thead>
            <tr>
              <th>کالا</th>
              <th>انبار</th>
              <th>دسته</th>
              <th>موجودی</th>
              <th>رزرو شده</th>
              <th>قابل فروش</th>
              <th>نقطه سفارش</th>
              <th>ارزش</th>
              <th>تاریخ انقضا</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.length === 0 ? (
              <EmptyRow colSpan={9} text="رکوردی یافت نشد" />
            ) : (
              stockRows.slice(0, 40).map((r) => {
                const p = productMap.get(r.productId)!;
                const low = r.onHand <= r.reorderPoint;
                const cost = unitCost.get(r.productId) ?? 0;
                return (
                  <tr key={r.id}>
                    <td>
                      <span className="font-semibold">{p.name}</span>
                      <span className="num block text-[10.5px] text-ink-400">{p.sku}</span>
                    </td>
                    <td className="text-[11px]">{warehouses.find((w) => w.id === r.warehouseId)?.name}</td>
                    <td className="text-[11px]">{categoryById(p.categoryId)?.name}</td>
                    <td>
                      <span className={`num font-bold ${low ? 'text-rose-600 dark:text-rose-400' : ''}`}>{faNum(r.onHand)}</span>
                      <MiniBar value={r.onHand} max={200} color={low ? '#e11d48' : '#0f684c'} />
                    </td>
                    <td className="num">{faNum(r.reserved)}</td>
                    <td className="num font-bold">{faNum(Math.max(0, r.onHand - r.reserved))}</td>
                    <td className="num">{faNum(r.reorderPoint)}</td>
                    <td className="num">{tomanShort(r.onHand * cost)}</td>
                    <td className="num text-[11px]">{jalaliDate(p.expiryDate)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      )}

      {tab === 'batches' && (
        <TableWrap>
          <thead>
            <tr>
              <th>شماره بچ (LOT)</th>
              <th>کالا</th>
              <th>انبار</th>
              <th>تاریخ تولید</th>
              <th>تاریخ انقضا</th>
              <th>باقی‌مانده</th>
              <th>تعداد</th>
              <th>وضعیت QC</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {batches.slice(0, 40).map((b) => {
              const left = daysUntil(b.expiryDate);
              return (
                <tr key={b.id}>
                  <td className="num font-bold" dir="ltr">
                    {b.batchNo}
                  </td>
                  <td className="text-[11.5px]">{productMap.get(b.productId)?.name}</td>
                  <td className="text-[11px]">{warehouses.find((w) => w.id === b.warehouseId)?.name}</td>
                  <td className="num text-[11px]">{jalaliDate(b.productionDate)}</td>
                  <td className="num text-[11px]">{jalaliDate(b.expiryDate)}</td>
                  <td>
                    <Badge tone={left < 30 ? 'danger' : left < 90 ? 'warning' : 'success'}>{faNum(left)} روز</Badge>
                  </td>
                  <td className="num">{faNum(b.qty)}</td>
                  <td>
                    <Badge tone={QC_META[b.qcStatus].tone}>{QC_META[b.qcStatus].label}</Badge>
                  </td>
                  <td>
                    <button className="btn-ghost btn-sm" onClick={() => setBatchDetail(b)}>
                      <Icon name="eye" className="h-3.5 w-3.5" />
                      ردیابی
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      {tab === 'qc' && (
        <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">نتایج کنترل کیفیت</p>
            <div className="space-y-2">
              {failedQc.map((b) => (
                <div key={b.id} className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-900/40 dark:bg-rose-900/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="num text-[11.5px] font-bold" dir="ltr">
                      {b.batchNo}
                    </span>
                    <Badge tone="danger">رد شده در QC</Badge>
                  </div>
                  <p className="mt-1 text-[11.5px]">{productMap.get(b.productId)?.name}</p>
                  <p className="mt-1 text-[10.5px] text-ink-500 dark:text-ink-400">
                    دلیل ثبت‌شده: مغایرت دما در حمل / آسیب بسته‌بندی — نیازمند فراخوان کالا (Recall)
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => toast('فراخوان کالا ثبت و به مشتریان خریدار اطلاع داده شد (نمایشی)', 'error')}>
                      ثبت فراخوان
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => toast('مرجوعی به تأمین‌کننده ثبت شد (نمایشی)')}>
                      مرجوعی به تأمین‌کننده
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">چک‌لیست روزانه انبار</p>
            <div className="space-y-2 text-[11.5px]">
              {[
                ['کنترل دمای سردخانه (۲ تا ۴ درجه)', 'done'],
                ['بازرسی بسته‌بندی پالت‌های ورودی', 'done'],
                ['برچسب‌گذاری تاریخ انقضا روی قفسه‌ها', 'pending'],
                ['شمارش دوره‌ای موجودی (Cycle Count)', 'pending'],
                ['ضدعفونی سطح بارگیری', 'done'],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span>{label}</span>
                  <Badge tone={status === 'done' ? 'success' : 'warning'}>{status === 'done' ? 'انجام شد' : 'در انتظار'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {suppliers.map((s) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[13px] font-extrabold">{s.name}</p>
                  <p className="text-[10.5px] text-ink-400">{s.country} — {s.contractCode}</p>
                </div>
                <Badge tone={s.status === 'active' ? 'success' : s.status === 'review' ? 'warning' : 'danger'}>
                  {s.status === 'active' ? 'فعال' : s.status === 'review' ? 'در بازبینی' : 'معلق'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">نرخ تأمین</span>
                  <span className="num font-bold">{faNum(s.fillRate, 1)}٪</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">زمان تحویل</span>
                  <span className="num font-bold">{faNum(s.leadTimeDays)} روز</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">شرایط پرداخت</span>
                  <span className="text-[10.5px] font-bold">{s.paymentTerms}</span>
                </div>
                <div className="rounded-lg bg-ink-50 px-2.5 py-1.5 dark:bg-ink-800/60">
                  <span className="block text-ink-400">حجم ماهانه</span>
                  <span className="num font-bold">{tomanShort(s.monthlyVolume)}</span>
                </div>
              </div>
              <p className="text-[10.5px] text-ink-400">
                برندها: {s.brandIds.map((id) => brands.find((b) => b.id === id)?.name ?? id).slice(0, 3).join(' ، ')}
              </p>
              <p className="num text-[10.5px] text-ink-400">انقضای قرارداد: {jalaliDate(s.contractExpiry)}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!batchDetail}
        onClose={() => setBatchDetail(null)}
        title={`ردیابی بچ ${batchDetail?.batchNo ?? ''}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => toast('فراخوان کالا ثبت شد (نمایشی)', 'error')}>
              فراخوان کالا
            </button>
            <button className="btn-primary" onClick={() => setBatchDetail(null)}>
              بستن
            </button>
          </div>
        }
      >
        {batchDetail && (
          <div className="space-y-3">
            <div className="grid gap-2.5 sm:grid-cols-2 text-[11.5px]">
              {[
                ['کالا', productMap.get(batchDetail.productId)?.name ?? '—'],
                ['انبار', warehouses.find((w) => w.id === batchDetail.warehouseId)?.name ?? '—'],
                ['تأمین‌کننده', suppliers.find((s) => s.id === batchDetail.supplierId)?.name ?? '—'],
                ['قیمت تمام‌شده واحد', tomanShort(batchDetail.costPrice)],
                ['تاریخ تولید', jalaliDate(batchDetail.productionDate)],
                ['تاریخ انقضا', jalaliDate(batchDetail.expiryDate)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-2 text-[12px] font-extrabold">زنجیره ردیابی (Traceability)</p>
              <div className="space-y-2 text-[11.5px]">
                {['تولید در کارخانه', 'بازرسی و ترخیص', 'ورود به انبار مرکزی', 'تخصیص به سفارش', 'تحویل به مشتری'].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white">{faNum(i + 1)}</span>
                    <span>{step}</span>
                    <Icon name="check" className="mr-auto h-3.5 w-3.5 text-brand-600" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default WarehouseAdmin;
