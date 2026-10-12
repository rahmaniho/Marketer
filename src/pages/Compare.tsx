import { Link } from 'react-router-dom';
import { Card, EmptyState, SectionTitle, useToast } from '@/components/ui';
import { ProductVisual } from '@/components/ProductVisual';
import { Badge } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { categoryById } from '@/data/categories';
import { faNum, jalaliDate, percentFa, toman } from '@/lib/format';
import { useBrandMap, useOffers, useProducts, useStore } from '@/store/useStore';
import { computePrice } from '@/lib/pricing';

const Compare = () => {
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);
  const addToCart = useStore((s) => s.addToCart);
  const products = useProducts();
  const brandMap = useBrandMap();
  const offers = useOffers();
  const customer = useStore((s) => s.customer);
  const { toast } = useToast();

  const list = products.filter((p) => compare.includes(p.id));

  if (list.length === 0) {
    return (
      <EmptyState
        icon="sliders"
        title="کالایی برای مقایسه انتخاب نشده"
        description="در کارت یا صفحه هر کالا، دکمه مقایسه را بزنید (حداکثر ۴ کالا). سپس مشخصات فنی، قیمت پله‌ای و شرایط تأمین را کنار هم ببینید."
        action={<Link to="/catalog" className="btn-primary">انتخاب کالا از کاتالوگ</Link>}
      />
    );
  }

  const rows: { label: string; render: (p: (typeof list)[number]) => React.ReactNode }[] = [
    { label: 'دسته‌بندی', render: (p) => categoryById(p.categoryId)?.name ?? '—' },
    { label: 'برند', render: (p) => brandMap.get(p.brandId)?.name ?? '—' },
    { label: 'کشور مبدأ', render: (p) => p.country },
    { label: 'بسته‌بندی', render: (p) => p.packDesc },
    {
      label: 'قیمت پایه هر کارتن',
      render: (p) => <span className="num font-extrabold">{toman(p.basePrice, false)}</span>,
    },
    {
      label: 'قیمت پس از تخفیف (MOQ)',
      render: (p) => {
        const r = computePrice({ product: p, qty: p.moq, offers, customer, cashPayment: true });
        return (
          <span className="num font-extrabold text-brand-700 dark:text-brand-300">
            {toman(r.unitPrice, false)}
            <span className="mr-1 text-[10px] text-ink-400">({percentFa(r.discountPercent, true)})</span>
          </span>
        );
      },
    },
    { label: 'حداقل سفارش (MOQ)', render: (p) => <span className="num">{faNum(p.moq)} {p.unit}</span> },
    { label: 'تخفیف نقدی', render: (p) => percentFa(p.cashDiscountPercent) },
    {
      label: 'حداکثر تخفیف حجمی',
      render: (p) => percentFa(Math.max(...p.tiers.map((t) => t.discountPercent))),
    },
    { label: 'کارتن در پالت', render: (p) => <span className="num">{faNum(p.paletteQty)}</span> },
    {
      label: 'موجودی',
      render: (p) => (
        <Badge tone={p.stock > 20 ? 'success' : p.stock > 0 ? 'warning' : 'danger'}>
          {p.stock > 0 ? `${faNum(p.stock)} ${p.unit}` : 'ناموجود'}
        </Badge>
      ),
    },
    { label: 'تاریخ انقضا', render: (p) => <span className="num">{jalaliDate(p.expiryDate)}</span> },
    { label: 'بارکد', render: (p) => <span className="num">{p.barcode}</span> },
    { label: 'امتیاز و فروش', render: (p) => <span className="num">{faNum(p.rating, 1)} ★ • {faNum(p.soldCount)} فروش</span> },
    { label: 'مجوز / اصالت', render: (p) => <Badge tone="info">{p.badges.includes('imported') ? 'وارداتی (IRC)' : 'تولید داخل'}</Badge> },
    {
      label: 'اقدام',
      render: (p) => (
        <div className="flex flex-col gap-1.5">
          <button
            className="btn-primary btn-sm"
            onClick={() => {
              addToCart(p.id, p.moq);
              toast('به سبد اضافه شد');
            }}
          >
            <Icon name="cart" className="h-3.5 w-3.5" />
            افزودن
          </button>
          <button className="btn-ghost btn-sm" onClick={() => toggleCompare(p.id)}>
            حذف از مقایسه
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SectionTitle
        title="مقایسه کالا"
        subtitle={`${faNum(list.length)} کالا در حال مقایسه — حداکثر ۴ کالا`}
        icon="sliders"
        action={
          <button className="btn-ghost btn-sm" onClick={clearCompare}>
            <Icon name="trash" className="h-4 w-4" />
            پاک کردن مقایسه
          </button>
        }
      />

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-right text-[12px]">
          <thead>
            <tr>
              <th className="sticky right-0 z-10 w-40 border-b border-ink-200 bg-ink-50 px-3 py-3 text-[11px] font-bold dark:border-ink-800 dark:bg-ink-900">
                ویژگی
              </th>
              {list.map((p) => (
                <th key={p.id} className="border-b border-ink-200 bg-white px-3 py-3 dark:border-ink-800 dark:bg-ink-900">
                  <Link to={`/product/${p.id}`} className="block w-40">
                    <ProductVisual product={p} brand={brandMap.get(p.brandId)} size="sm" />
                    <span className="mt-1 block line-clamp-2 text-[11.5px] font-bold leading-5">{p.name}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="sticky right-0 z-10 border-b border-ink-100 bg-ink-50/95 px-3 py-2.5 font-bold text-ink-600 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 dark:text-ink-300">
                  {r.label}
                </td>
                {list.map((p) => (
                  <td key={p.id} className="border-b border-ink-100 px-3 py-2.5 dark:border-ink-800">
                    {r.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <p className="text-center text-[11px] text-ink-400">مقایسه بر پایه داده Mock و قیمت‌گذاری آبشاری محاسبه شده است.</p>
    </div>
  );
};

export default Compare;
