import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, Pagination, Stat, TableWrap, Tabs } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useOrders, useStore } from '@/store/useStore';
import { exportCsv, faNum, jalaliDate, timeAgo, toman, tomanShort } from '@/lib/format';
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types';

/** نگاشت وضعیت سفارش به برچسب و رنگ */
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: 'info' | 'brand' | 'accent' | 'success' | 'danger' | 'neutral'; icon: string }> = {
  draft: { label: 'پیش‌نویس', tone: 'neutral', icon: 'edit' },
  pending: { label: 'در انتظار تأیید', tone: 'accent', icon: 'clock' },
  confirmed: { label: 'تأیید‌شده', tone: 'info', icon: 'check-circle' },
  processing: { label: 'در حال آماده‌سازی', tone: 'info', icon: 'package' },
  packed: { label: 'بسته‌بندی‌شده', tone: 'brand', icon: 'box' },
  shipped: { label: 'ارسال‌شده', tone: 'brand', icon: 'truck' },
  delivered: { label: 'تحویل‌شده', tone: 'success', icon: 'check-circle' },
  canceled: { label: 'لغو‌شده', tone: 'danger', icon: 'x' },
  returned: { label: 'مرجوع‌شده', tone: 'danger', icon: 'undo' },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  unpaid: { label: 'پرداخت‌نشده', tone: 'warning' },
  partial: { label: 'پرداخت جزئی', tone: 'neutral' },
  paid: { label: 'تسویه‌شده', tone: 'success' },
  overdue: { label: 'معوق', tone: 'danger' },
};

const Orders = () => {
  const customer = useStore((s) => s.customer);
  const orders = useOrders();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const PER = 8;

  const mine = useMemo(
    () => orders.filter((o) => !customer || o.customerId === customer.id).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, customer],
  );

  const filtered = useMemo(() => {
    if (tab === 'all') return mine;
    if (tab === 'open') return mine.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.status));
    if (tab === 'delivered') return mine.filter((o) => o.status === 'delivered');
    if (tab === 'unpaid') return mine.filter((o) => o.paymentStatus !== 'paid');
    return mine.filter((o) => o.status === 'returned' || o.status === 'canceled');
  }, [mine, tab]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);
  const totalSpent = mine.reduce((s, o) => s + o.grandTotal, 0);

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState
          icon="login"
          title="برای مشاهده سفارش‌ها وارد حساب شوید"
          description="سفارش‌های ثبت‌شده به حساب فروشگاهی شما متصل می‌شوند."
          action={
            <Link to="/login" className="btn-primary">
              ورود / ثبت‌نام عمده‌فروشی
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold">سفارش‌های من</h1>
          <p className="num mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
            {customer.storeName} • {faNum(mine.length)} سفارش ثبت‌شده در پلتفرم
          </p>
        </div>
        <button
          className="btn-ghost btn-sm"
          onClick={() =>
            exportCsv(
              [['کد سفارش', 'تاریخ', 'مبلغ', 'وضعیت', 'پرداخت', 'روش تسویه'],
                ...mine.map((o) => [o.code, jalaliDate(o.createdAt), o.grandTotal, ORDER_STATUS_META[o.status].label, PAYMENT_STATUS_META[o.paymentStatus].label, o.paymentMethod])],
              'my-orders.csv',
            )
          }
        >
          <Icon name="sheet" className="h-4 w-4" />
          خروجی اکسل سفارش‌ها
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="مجموع خرید" value={tomanShort(totalSpent)} icon="chart" />
        <Stat label="سفارش‌های در جریان" value={faNum(mine.filter((o) => ['pending', 'confirmed', 'processing', 'packed', 'shipped'].includes(o.status)).length)} icon="truck" tone="info" />
        <Stat label="تسویه‌نشده" value={faNum(mine.filter((o) => o.paymentStatus !== 'paid').length)} icon="wallet" tone="accent" />
        <Stat label="میانگین سبد سفارش" value={tomanShort(totalSpent / Math.max(1, mine.length))} icon="cart" tone="vip" />
      </div>

      <div className="mt-4">
        <Tabs
          active={tab}
          onChange={(t) => { setTab(t); setPage(1); }}
          tabs={[
            { id: 'all', label: 'همه سفارش‌ها', icon: 'list', count: mine.length },
            { id: 'open', label: 'در جریان', icon: 'truck' },
            { id: 'delivered', label: 'تحویل‌شده', icon: 'check-circle' },
            { id: 'unpaid', label: 'در انتظار تسویه', icon: 'wallet' },
            { id: 'closed', label: 'لغو و مرجوعی', icon: 'undo' },
          ]}
        />
      </div>

      <Card className="mt-4" padded={false}>
        <TableWrap>
          <thead>
            <tr>
              <th>کد سفارش</th>
              <th>تاریخ ثبت</th>
              <th>اقلام</th>
              <th>مبلغ کل</th>
              <th>وضعیت</th>
              <th>پرداخت</th>
              <th>زمان تحویل</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[12.5px] text-ink-400">
                  سفارشی در این بخش وجود ندارد
                </td>
              </tr>
            ) : (
              items.map((o: Order) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/orders/${o.id}`} className="num font-bold hover:text-brand-700 dark:hover:text-brand-300">
                      {o.code}
                    </Link>
                    <span className="num block text-[10.5px] text-ink-400">{o.trackingCode}</span>
                  </td>
                  <td className="text-[11px]">
                    {jalaliDate(o.createdAt)}
                    <span className="block text-[10.5px] text-ink-400">{timeAgo(o.createdAt)}</span>
                  </td>
                  <td className="num">{faNum(o.items.length)} قلم</td>
                  <td className="num font-bold">{toman(o.grandTotal, false)}</td>
                  <td>
                    <Badge tone={ORDER_STATUS_META[o.status].tone} icon={ORDER_STATUS_META[o.status].icon}>
                      {ORDER_STATUS_META[o.status].label}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={PAYMENT_STATUS_META[o.paymentStatus].tone}>{PAYMENT_STATUS_META[o.paymentStatus].label}</Badge>
                  </td>
                  <td className="num text-[11px]">
                    {jalaliDate(o.deliveryDate, 'weekday')}
                    <span className="block text-[10.5px] text-ink-400">{o.deliverySlot}</span>
                  </td>
                  <td>
                    <Link to={`/orders/${o.id}`} className="btn-ghost btn-sm">
                      <Icon name="location" className="h-3.5 w-3.5" />
                      پیگیری
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Card>

      <Pagination page={page} pages={pages} onChange={setPage} />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          ['سفارش دوره‌ای بساز', 'سبد همیشگی فروشگاه را با یک کلیک تکرار کنید.', '/subscriptions', 'repeat'],
          ['خرید گروهی هم‌صنفان', 'با سایر فروشگاه‌ها به آستانه خرید عمده برسید.', '/group-buy', 'users'],
          ['استعلام قیمت (RFQ)', 'برای سفارش‌های بزرگ، پیشنهاد قیمت اختصاصی بگیرید.', '/rfq', 'clipboard'],
        ].map(([title, desc, to, icon]) => (
          <Link key={title} to={to} className="card transition hover:shadow-pop">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              <Icon name={icon} className="h-5 w-5" />
            </span>
            <p className="mt-2.5 text-[12.5px] font-extrabold">{title}</p>
            <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Orders;
