import { Link } from 'react-router-dom';
import { Card, EmptyState, SectionTitle } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import { Icon } from '@/components/Icon';
import { faNum, toman } from '@/lib/format';
import { useBrandMap, useProducts, useStore } from '@/store/useStore';

const Favorites = () => {
  const favorites = useStore((s) => s.favorites);
  const addToCart = useStore((s) => s.addToCart);
  const products = useProducts();
  const brandMap = useBrandMap();
  const list = products.filter((p) => favorites.includes(p.id));
  const total = list.reduce((s, p) => s + p.basePrice * p.moq, 0);

  if (list.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title="لیست علاقه‌مندی‌ها خالی است"
        description="با زدن آیکون قلب روی هر کالا، آن را برای خرید بعدی ذخیره کنید."
        action={<Link to="/catalog" className="btn-primary">رفتن به کاتالوگ</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        title="لیست علاقه‌مندی‌ها"
        subtitle={`${faNum(list.length)} کالا ذخیره شده`}
        icon="heart"
        action={
          <button
            className="btn-primary btn-sm"
            onClick={() => list.forEach((p) => addToCart(p.id, p.moq))}
          >
            <Icon name="cart" className="h-4 w-4" />
            افزودن همه با حداقل سفارش
          </button>
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-ink-500 dark:text-ink-400">
          برآورد مبلغ سبد پیشنهادی (حداقل سفارش هر کالا): <span className="num font-extrabold text-ink-800 dark:text-ink-200">{toman(total)}</span>
        </p>
        <Link to="/compare" className="btn-ghost btn-sm">
          <Icon name="sliders" className="h-4 w-4" />
          مقایسه کالاهای منتخب
        </Link>
      </Card>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} brand={brandMap.get(p.brandId)} />
        ))}
      </div>
    </div>
  );
};

export default Favorites;
