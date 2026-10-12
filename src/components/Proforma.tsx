import { forwardRef } from 'react';
import type { Customer, Order } from '@/lib/types';
import { faNum, jalaliDate, jalaliDateTime, toman } from '@/lib/format';

const PAYMENT_LABELS: Record<Order['paymentMethod'], string> = {
  cash: 'نقدی (تخفیف ۳٪)',
  credit: 'اعتباری',
  installment: 'اقساطی',
  cheque: 'چک',
  online: 'پرداخت آنلاین (Mock)',
};

/**
 * پیش‌فاکتور / فاکتور قابل چاپ و PDF
 * (فونت فارسی و راست‌به‌چپ با html2canvas در خروجی PDF حفظ می‌شود)
 */
export const Proforma = forwardRef<HTMLDivElement, { order: Order; customer?: Customer | null; kind?: 'proforma' | 'invoice' }>(
  ({ order, customer, kind = 'proforma' }, ref) => {
    const title = kind === 'proforma' ? 'پیش‌فاکتور فروش عمده' : 'فاکتور فروش رسمی';
    return (
      <div ref={ref} className="mx-auto w-full max-w-[820px] bg-white p-6 text-ink-900" dir="rtl">
        <div className="flex items-start justify-between border-b-2 border-brand-600 pb-4">
          <div>
            <p className="text-lg font-extrabold text-brand-700">بازارعمده</p>
            <p className="text-[11px] text-ink-600">پلتفرم B2B عمده‌فروشی هوشمند صنایع غذایی</p>
            <p className="mt-1 text-[10px] text-ink-500">
              تهران، کیلومتر ۱۲ جاده مخصوص، شهرک صنعتی — تلفن: ۰۲۱-۴۴۵۵۶۶۷۷ — کد اقتصادی: ۴۱۱۲۳۴۵۶۷۸۹
            </p>
          </div>
          <div className="text-left">
            <p className="text-sm font-extrabold">{title}</p>
            <p className="num mt-1 text-[11px]">شماره: {order.code}</p>
            <p className="text-[11px]">تاریخ: {jalaliDate(order.createdAt)}</p>
            <p className="num text-[11px]">کد رهگیری: {order.trackingCode}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-[11px]">
          <div className="rounded-lg bg-ink-50 p-3">
            <p className="mb-1 font-bold">مشخصات خریدار</p>
            <p>نام فروشگاه: {order.customerName}</p>
            <p>مالک: {customer?.ownerName ?? '—'}</p>
            <p className="num">موبایل: {customer?.mobile ?? '—'}</p>
            <p className="num">شناسه مالیاتی: {customer?.taxId ?? '—'}</p>
            <p>آدرس: {order.address}</p>
          </div>
          <div className="rounded-lg bg-ink-50 p-3">
            <p className="mb-1 font-bold">اطلاعات ارسال و تسویه</p>
            <p>شهر: {order.city}</p>
            <p>تاریخ تحویل: {jalaliDate(order.deliveryDate)} — بازه {order.deliverySlot}</p>
            <p>روش تسویه: {PAYMENT_LABELS[order.paymentMethod]}</p>
            <p>وضعیت پرداخت: {order.paymentStatus}</p>
            <p className="num">تاریخ صدور: {jalaliDateTime(order.createdAt)}</p>
          </div>
        </div>

        <table className="mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-brand-700 text-white">
              <th className="border border-brand-700 px-2 py-1.5 text-center">#</th>
              <th className="border border-brand-700 px-2 py-1.5 text-right">شرح کالا</th>
              <th className="border border-brand-700 px-2 py-1.5 text-right">برند</th>
              <th className="border border-brand-700 px-2 py-1.5 text-center">تعداد</th>
              <th className="border border-brand-700 px-2 py-1.5 text-center">واحد</th>
              <th className="border border-brand-700 px-2 py-1.5 text-center">قیمت واحد (تومان)</th>
              <th className="border border-brand-700 px-2 py-1.5 text-center">مبلغ کل (تومان)</th>
              <th className="border border-brand-700 px-2 py-1.5 text-center">پله قیمتی</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={it.productId + i} className={i % 2 ? 'bg-ink-50' : ''}>
                <td className="num border border-ink-200 px-2 py-1.5 text-center">{faNum(i + 1)}</td>
                <td className="border border-ink-200 px-2 py-1.5">{it.name}</td>
                <td className="border border-ink-200 px-2 py-1.5">{it.brandName}</td>
                <td className="num border border-ink-200 px-2 py-1.5 text-center">{faNum(it.qty)}</td>
                <td className="border border-ink-200 px-2 py-1.5 text-center">{it.unit}</td>
                <td className="num border border-ink-200 px-2 py-1.5 text-center">{faNum(it.unitPrice)}</td>
                <td className="num border border-ink-200 px-2 py-1.5 text-center">{faNum(it.total)}</td>
                <td className="border border-ink-200 px-2 py-1.5 text-center">{it.tierLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-between gap-6 text-[11px]">
          <div className="flex-1 rounded-lg border border-dashed border-ink-300 p-3">
            <p className="font-bold">شرایط و توضیحات</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-ink-600">
              <li>این {kind === 'proforma' ? 'پیش‌فاکتور' : 'فاکتور'} تا ۴۸ ساعت اعتبار دارد و پس از آن قیمت‌ها بازبینی می‌شود.</li>
              <li>ارسال به عهده فروشنده و در بازه زمانی توافقی انجام می‌شود.</li>
              <li>مرجوعی کالای معیوب تا ۴۸ ساعت پس از تحویل پذیرفته می‌شود.</li>
              <li>کالاها دارای IRC یا پروانه بهداشت و QR ردیابی بچ هستند.</li>
            </ul>
          </div>
          <div className="w-64">
            <Row label="جمع کل کالا" value={toman(order.subtotal)} />
            <Row label="تخفیف‌ها (نقدی/حجمی/کمپین)" value={`− ${toman(order.discountTotal)}`} />
            <Row label="مالیات بر ارزش افزوده" value={toman(order.taxAmount)} />
            <Row label="هزینه ارسال" value={order.shippingCost === 0 ? 'رایگان' : toman(order.shippingCost)} />
            <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-[13px] font-extrabold text-brand-800">
              <span>مبلغ قابل پرداخت</span>
              <span className="num">{toman(order.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-ink-200 pt-3 text-[10px] text-ink-500">
          <div>
            <p className="font-bold text-ink-700">مهر و امضای فروشنده</p>
            <p className="mt-6">پلتفرم بازارعمده — امضای دیجیتال: {order.podSignature ?? '—'}</p>
          </div>
          <div className="text-left">
            <p className="font-bold text-ink-700">امضای خریدار</p>
            <p className="mt-6">{order.podSigned ? 'امضا شده (POD)' : 'در انتظار تحویل'}</p>
          </div>
          <div className="text-left leading-relaxed">
            <p>طراحی و توسعه: کارن سافت — Karen-soft.ir</p>
            <p>سامانه مودیان (Mock): شناسه یکتای کالا در انتهای فاکتور رسمی درج می‌شود.</p>
          </div>
        </div>
      </div>
    );
  },
);

Proforma.displayName = 'Proforma';

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between border-b border-dashed border-ink-200 py-1.5">
    <span className="text-ink-600">{label}</span>
    <span className="num font-semibold">{value}</span>
  </div>
);
