import { Link } from 'react-router-dom';
import { Badge, Card, SectionTitle, Stat } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useProducts } from '@/store/useStore';
import { childrenOf, rootCategories } from '@/data/categories';
import { faNum, tomanShort } from '@/lib/format';

const Categories = () => {
  const products = useProducts();

  const stats = (id: string) => {
    const kids = childrenOf(id).map((c) => c.id);
    const list = products.filter((p) => p.categoryId === id || kids.includes(p.categoryId));
    const min = list.length ? Math.min(...list.map((p) => p.basePrice)) : 0;
    return { count: list.length, min, brands: new Set(list.map((p) => p.brandId)).size };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold">دسته‌بندی کالاهای عمده</h1>
        <p className="mt-1 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
          {faNum(rootCategories.length)} گروه اصلی و بیش از {faNum(rootCategories.reduce((s, c) => s + childrenOf(c.id).length, 0))} زیرگروه کالا،
          از لبنیات و نوشیدنی تا پروتئین، خشکبار، غذای کودک و ملزومات فروشگاه.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل کد کالای عمده" value={faNum(products.length)} icon="package" />
        <Stat label="گروه‌های اصلی" value={faNum(rootCategories.length)} icon="grid" tone="info" />
        <Stat label="زیرگروه‌ها" value={faNum(rootCategories.reduce((s, c) => s + childrenOf(c.id).length, 0))} icon="layers" tone="accent" />
        <Stat label="برندهای فعال" value={faNum(new Set(products.map((p) => p.brandId)).size)} icon="award" tone="vip" />
      </div>

      <div className="mt-5 space-y-4">
        {rootCategories.map((c) => {
          const s = stats(c.id);
          const kids = childrenOf(c.id);
          const samples = products.filter((p) => p.categoryId === c.id || kids.some((k) => k.id === p.categoryId)).slice(0, 6);
          return (
            <Card key={c.id} hover>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl2" style={{ background: `${c.color}18`, color: c.color }}>
                    <Icon name={c.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <Link to={`/catalog?cat=${c.id}`} className="text-[14px] font-extrabold hover:text-brand-700 dark:hover:text-brand-300">
                      {c.name}
                    </Link>
                    <p className="text-[10.5px] text-ink-400" dir="ltr">
                      {c.nameEn}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{c.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{faNum(s.count)} کالا</Badge>
                  <Badge tone="info">{faNum(s.brands)} برند</Badge>
                  {s.min > 0 && <Badge tone="accent">از {tomanShort(s.min)} تومان</Badge>}
                  <Link to={`/catalog?cat=${c.id}`} className="btn-ghost btn-sm">
                    مشاهده کالاها
                    <Icon name="chevron-left" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {kids.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {kids.map((k) => (
                    <Link
                      key={k.id}
                      to={`/catalog?cat=${k.id}`}
                      className="chip bg-ink-100 text-ink-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-brand-900/40"
                    >
                      {k.name}
                      <span className="num opacity-70">
                        ({faNum(products.filter((p) => p.categoryId === k.id).length)})
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {samples.length > 0 && (
                <div className="mt-3 grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                  {samples.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.id}`}
                      className="rounded-xl border border-ink-200 p-2.5 transition hover:border-brand-400 dark:border-ink-700"
                    >
                      <p className="line-clamp-2 text-[11px] font-semibold leading-5">{p.name}</p>
                      <p className="num mt-1 text-[11px] font-bold text-brand-700 dark:text-brand-300">{tomanShort(p.basePrice)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <SectionTitle title="دسته‌بندی کالا بر پایه کاربرد فروشگاهی" subtitle="راهنمای انتخاب سریع برای انواع کسب‌وکار" icon="store" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['سوپرمارکت محله', ['تنقلات و شکلات', 'لبنیات و بستنی', 'نوشیدنی', 'ماکارونی و غذای آماده'], 'store'],
            ['رستوران و فست‌فود', ['روغن، رب، کنسرو و سس', 'پروتئین و فرآورده گوشتی', 'ماکارونی و غلات', 'ملزومات مصرفی'], 'bowl'],
            ['قنادی و کافه', ['شکلات و کاکائو', 'خشکبار و مغزها', 'لبنیات (خامه و کره)', 'نوشیدنی گرم و سرد'], 'cake'],
            ['پخش و عمده‌فروشی', ['پالت کامل نوشیدنی', 'روغن و برنج', 'شوینده و بهداشتی', 'غذای کودک'], 'truck'],
            ['هتل و پذیرایی', ['پروتئین', 'سبزیجات فریزری', 'نوشیدنی پرمصرف', 'دسر و بستنی'], 'star'],
            ['فروشگاه ارگانیک', ['خشکبار ارگانیک', 'روغن‌های خاص', 'چای و دمنوش', 'غذای کودک طبیعی'], 'leaf'],
          ].map(([title, items, icon]) => (
            <div key={title as string} className="rounded-xl2 border border-ink-200 p-3.5 dark:border-ink-700">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon name={icon as string} className="h-5 w-5" />
              </span>
              <p className="mt-2.5 text-[12.5px] font-extrabold">{title}</p>
              <ul className="mt-2 space-y-1.5">
                {(items as string[]).map((i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Categories;
