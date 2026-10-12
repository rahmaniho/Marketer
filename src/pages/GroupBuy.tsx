import { Badge, Card, DemoNote, Progress, SectionTitle, Stat, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { ProductVisual } from '@/components/ProductVisual';
import { faNum, daysUntil, jalaliDate, toman } from '@/lib/format';
import { useBrandMap, useProducts, useStore } from '@/store/useStore';

const GroupBuy = () => {
  const groupBuys = useStore((s) => s.groupBuys);
  const joinGroupBuy = useStore((s) => s.joinGroupBuy);
  const addToCart = useStore((s) => s.addToCart);
  const products = useProducts();
  const brandMap = useBrandMap();
  const { toast } = useToast();

  const totalJoined = groupBuys.reduce((s, g) => s + g.joinedQty, 0);
  const potentialSaving = groupBuys.reduce((s, g) => s + g.joinedQty * 45_000, 0);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="خرید گروهی فروشگاه‌ها"
        subtitle="با تجمیع سفارش فروشگاه‌های هم‌شهر به تیراژ پالتی برسید و تخفیف بیشتری بگیرید"
        icon="users"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="کمپین‌های خرید گروهی" value={faNum(groupBuys.length)} icon="users" />
        <Stat label="مجموع تقاضای تجمیع‌شده" value={faNum(totalJoined)} unit="کارتن" icon="layers" tone="info" />
        <Stat label="صرفه‌جویی تخمینی" value={toman(potentialSaving, false)} unit="تومان" icon="percent" tone="accent" />
      </div>

      <div className="space-y-3">
        {groupBuys.map((g) => {
          const product = products.find((p) => p.id === g.productId) ?? products[0];
          const brand = brandMap.get(product.brandId);
          const progress = (g.joinedQty / g.targetQty) * 100;
          const remaining = daysUntil(g.endsAt);
          const baseUnit = product.basePrice;
          const targetUnit = Math.round((baseUnit * 0.88) / 1000) * 1000;
          return (
            <Card key={g.id} className="flex flex-col gap-4 lg:flex-row">
              <div className="w-full flex-none lg:w-44">
                <ProductVisual product={product} brand={brand} size="sm" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] font-extrabold">{product.name}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-500 dark:text-ink-400">
                      {brand?.name} • {product.packDesc} • گروه خرید شهر {g.city}
                    </p>
                  </div>
                  <Badge tone={remaining < 3 ? 'danger' : 'warning'} icon="clock">
                    {remaining > 0 ? `${faNum(remaining)} روز مانده` : 'پایان‌یافته'}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">تیراژ هدف</p>
                    <p className="num font-bold">{faNum(g.targetQty)} کارتن</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">تجمیع‌شده</p>
                    <p className="num font-bold">{faNum(g.joinedQty)} کارتن</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">قیمت فعلی پلتفرم</p>
                    <p className="num font-bold">{faNum(baseUnit)}</p>
                  </div>
                  <div className="rounded-xl bg-brand-50 px-2.5 py-2 dark:bg-brand-900/25">
                    <p className="text-brand-700 dark:text-brand-300">قیمت هدف گروهی</p>
                    <p className="num font-bold text-brand-800 dark:text-brand-200">{faNum(targetUnit)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Progress value={progress} label={`${faNum(progress, 0)}٪ از تیراژ هدف تکمیل شده — پایان ${jalaliDate(g.endsAt)}`} />
                </div>
              </div>

              <div className="flex w-full flex-none flex-col justify-center gap-2 lg:w-52">
                <button
                  className="btn-primary"
                  onClick={() => {
                    joinGroupBuy(g.id, 20);
                    toast('۲۰ کارتن به کمپین گروهی اضافه شد (نمایشی)');
                  }}
                >
                  <Icon name="users" className="h-4 w-4" />
                  مشارکت با ۲۰ کارتن
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    addToCart(product.id, 20);
                    toast('به سبد خرید معمولی اضافه شد');
                  }}
                >
                  خرید تکی (بدون تخفیف گروهی)
                </button>
                <p className="text-center text-[10.5px] text-ink-400">
                  در صورت عدم تکمیل تیراژ، مبلغ پرداختی به کیف پول بازگردانده می‌شود.
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <DemoNote icon="users">
        خرید گروهی در نسخه دمو فقط نمایشی است و مبلغی دریافت نمی‌شود. در نسخه عملیاتی، تسویه‌ها در حساب امانی نگه‌داری و
        پس از تکمیل تیراژ آزاد می‌شود.
      </DemoNote>
    </div>
  );
};

export default GroupBuy;
