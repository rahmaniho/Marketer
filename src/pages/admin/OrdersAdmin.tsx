import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Modal, Pagination, Stat, TableWrap, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { Proforma } from '@/components/Proforma';
import { printElement } from '@/lib/pdf';
import { exportCsv, faNum, jalaliDate, toman, tomanShort } from '@/lib/format';
import { useCustomers, useOrders, useStore } from '@/store/useStore';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '@/pages/Orders';
import type { Order, OrderStatus } from '@/lib/types';
import { useRef } from 'react';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'canceled', 'returned'];

const OrdersAdmin = () => {
  const orders = useOrders();
  const customers = useCustomers();
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [city, setCity] = useState('all');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Order | null>(null);
  const proformaRef = useRef<HTMLDivElement>(null);
  const PER = 12;

  const cities = [...new Set(orders.map((o) => o.city))];

  const filtered = useMemo(() => {
    const term = q.trim();
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (payment !== 'all' && o.paymentStatus !== payment) return false;
      if (city !== 'all' && o.city !== city) return false;
      if (term && !o.code.includes(term) && !o.customerName.includes(term) && !o.trackingCode.includes(term)) return false;
      return true;
    });
  }, [orders, q, status, payment, city]);

  const pages = Math.ceil(filtered.length / PER);
  const pageItems = filtered.slice((page - 1) * PER, page * PER);
  const total = filtered.reduce((s, o) => s + o.grandTotal, 0);

  const exportAll = () =>
    exportCsv(
      [
        ['کد سفارش', 'مشتری', 'شهر', 'تاریخ', 'تعداد اقلام', 'جمع کالا', 'تخفیف', 'مالیات', 'ارسال', 'مبلغ کل', 'وضعیت', 'وضعیت پرداخت', 'روش تسویه'],
        ...filtered.map((o) => [
          o.code,
          o.customerName,
          o.city,
          jalaliDate(o.createdAt),
          o.items.length,
          o.subtotal,
          o.discountTotal,
          o.taxAmount,
          o.shippingCost,
          o.grandTotal,
          ORDER_STATUS_META[o.status].label,
          PAYMENT_STATUS_META[o.paymentStatus].label,
          o.paymentMethod,
        ]),
      ],
      'orders-report.csv',
    );

  return (
    <AdminPage
      title="مدیریت سفارش‌ها"
      subtitle={`${faNum(filtered.length)} سفارش • ارزش ${tomanShort(total)}`}
      icon="package"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={exportAll}>
            <Icon name="sheet" className="h-4 w-4" />
            خروجی CSV
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={() => toast('یادآوری تسویه برای سفارش‌های معوق ارسال شد (نمایشی)')}
          >
            <Icon name="bell" className="h-4 w-4" />
            یادآوری تسویه
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل سفارش‌های فیلترشده" value={faNum(filtered.length)} icon="package" />
        <Stat label="ارزش سفارش‌ها" value={tomanShort(total)} icon="chart" tone="info" />
        <Stat
          label="در انتظار تأیید"
          value={faNum(orders.filter((o) => o.status === 'pending').length)}
          icon="clock"
          tone="accent"
        />
        <Stat
          label="تسویه‌نشده"
          value={faNum(orders.filter((o) => o.paymentStatus !== 'paid').length)}
          icon="wallet"
          tone="danger"
        />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="جست‌وجوی کد سفارش، مشتری یا کد رهگیری…" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌ها</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select value={payment} onChange={(e) => setPayment(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه وضعیت‌های پرداخت</option>
          {(['unpaid', 'partial', 'paid', 'overdue'] as const).map((p) => (
            <option key={p} value={p}>
              {PAYMENT_STATUS_META[p].label}
            </option>
          ))}
        </select>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه شهرها</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>کد سفارش</th>
            <th>مشتری</th>
            <th>تاریخ</th>
            <th>اقلام</th>
            <th>مبلغ کل</th>
            <th>پرداخت</th>
            <th>وضعیت سفارش</th>
            <th>تغییر وضعیت</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageItems.length === 0 ? (
            <EmptyRow colSpan={9} text="سفارشی با این فیلترها یافت نشد" />
          ) : (
            pageItems.map((o) => (
              <tr key={o.id}>
                <td className="num font-bold">{o.code}</td>
                <td>
                  <span className="font-semibold">{o.customerName}</span>
                  <span className="block text-[10.5px] text-ink-400">
                    {o.city} • {o.channel === 'rep' ? 'ویزیتور' : o.channel === 'web' ? 'وب' : o.channel === 'app' ? 'اپلیکیشن' : 'تلفنی'}
                  </span>
                </td>
                <td className="num">{jalaliDate(o.createdAt)}</td>
                <td className="num">{faNum(o.items.length)}</td>
                <td className="num font-bold">{toman(o.grandTotal, false)}</td>
                <td>
                  <Badge tone={PAYMENT_STATUS_META[o.paymentStatus].tone}>{PAYMENT_STATUS_META[o.paymentStatus].label}</Badge>
                </td>
                <td>
                  <Badge tone={ORDER_STATUS_META[o.status].tone}>{ORDER_STATUS_META[o.status].label}</Badge>
                </td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => {
                      setOrderStatus(o.id, e.target.value as OrderStatus);
                      toast(`وضعیت سفارش ${o.code} به «${ORDER_STATUS_META[e.target.value as OrderStatus].label}» تغییر یافت`);
                    }}
                    className="select w-auto py-1.5 text-[11.5px]"
                    aria-label={`تغییر وضعیت ${o.code}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(o)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    فاکتور
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`سفارش ${detail?.code ?? ''}`}
        size="xl"
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button className="btn-ghost" onClick={() => detail && printElement(proformaRef.current!, `فاکتور ${detail.code}`)}>
              <Icon name="print" className="h-4 w-4" />
              چاپ فاکتور
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                toast('فاکتور رسمی برای مشتری ارسال شد (نمایشی)');
                setDetail(null);
              }}
            >
              <Icon name="send" className="h-4 w-4" />
              ارسال فاکتور به مشتری
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="grid gap-2.5 sm:grid-cols-4 text-[11.5px]">
              {[
                ['مشتری', detail.customerName],
                ['تاریخ ثبت', jalaliDate(detail.createdAt)],
                ['تاریخ تحویل', jalaliDate(detail.deliveryDate)],
                ['بازه تحویل', detail.deliverySlot],
                ['روش تسویه', detail.paymentMethod],
                ['راننده', detail.driverName ?? 'تخصیص نشده'],
                ['کد رهگیری', detail.trackingCode],
                ['اعتبار مصرف‌شده', toman(detail.grandTotal - detail.paidAmount, false)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <p className="text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num mt-0.5 font-bold">{v}</p>
                </div>
              ))}
            </div>

            <Card padded={false} className="p-3">
              <Proforma ref={proformaRef} order={detail} customer={customers.find((c) => c.id === detail.customerId)} />
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default OrdersAdmin;
