import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Card, EmptyState, SectionTitle, Stat, TableWrap } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark } from '@/components/BrandLogo';
import { BrandBanner, ProductVisual } from '@/components/ProductVisual';
import { ProductCard } from '@/components/ProductCard';
import { useBrands, useProducts } from '@/store/useStore';
import { categoryById } from '@/data/categories';
import { faNum, jalaliDate, daysUntil, tomanShort } from '@/lib/format';

const BrandDetail = () => {
  const { id } = useParams();
  const brands = useBrands();
  const products = useProducts();

  const brand = brands.find((b) => b.id === id);
  const items = useMemo(() => products.filter((p) => p.brandId === id), [products, id]);
  const otherBrands = useMemo(
    () => brands.filter((b) => b.id !== id && b.categoryIds.some((c) => brand?.categoryIds.includes(c))).slice(0, 12),
    [brands, brand, id],
  );

  if (!brand) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <EmptyState icon="award" title="برند یافت نشد" action={<Link to="/brands" className="btn-primary">بازگشت به فهرست برندها</Link>} />
      </div>
    );
  }

  const totalStock = items.reduce((s, p) => s + p.stock, 0);
  const cheapest = items.length ? Math.min(...items.map((p) => p.basePrice)) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 flex items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
        <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">خانه</Link>
        <Icon name="chevron-left" className="h-3 w-3" />
        <Link to="/brands" className="hover:text-brand-700 dark:hover:text-brand-300">برندها</Link>
        <Icon name="chevron-left" className="h-3 w-3" />
        <span>{brand.name}</span>
      </nav>

      <Card padded={false} className="overflow-hidden">
        <BrandBanner brand={brand} className="h-40" />
        <div className="flex flex-wrap items-end justify-between gap-4 p-5">
          <div className="flex items-end gap-4">
            <span className="-mt-12 rounded-2xl bg-white p-1.5 shadow-soft dark:bg-ink-900">
              <BrandMark brand={brand} size={72} rounded />
            </span>
            <div>
              <h1 className="text-lg font-extrabold">{brand.name}</h1>
              <p className="text-[11.5px] text-ink-500 dark:text-ink-400" dir="ltr">
                {brand.nameEn}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={brand.origin === 'iran' ? 'brand' : 'info'}>{brand.origin === 'iran' ? 'برند ایرانی' : `وارداتی — ${brand.country}`}</Badge>
                <Badge tone={brand.licenseStatus === 'valid' ? 'success' : 'warning'}>
                  {brand.licenseKind} — {brand.licenseStatus === 'valid' ? 'معتبر' : brand.licenseStatus === 'expiring' ? 'نزدیک انقضا' : brand.licenseStatus === 'pending' ? 'در حال تمدید' : 'منقضی'}
                </Badge>
                {brand.exclusive && <Badge tone="vip">نمایندگی انحصاری</Badge>}
                <span className="num text-[11px] text-ink-400">تأسیس {faNum(brand.established)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/catalog?brand=${brand.id}`} className="btn-primary">
              <Icon name="grid" className="h-4 w-4" />
              مشاهده کالاهای عمده این برند
            </Link>
            <Link to="/rfq" className="btn-ghost">
              <Icon name="clipboard" className="h-4 w-4" />
              استعلام قیمت عمده
            </Link>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="تعداد کد کالا" value={faNum(items.length)} icon="package" />
        <Stat label="ارزان‌ترین قیمت عمده" value={`${tomanShort(cheapest)} تومان`} icon="tag" tone="accent" />
        <Stat label="موجودی کل انبارها" value={faNum(totalStock)} icon="warehouse" tone="info" />
        <Stat label="امتیاز برند" value={`${faNum(brand.rating, 1)} از ۵`} icon="star" tone="vip" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <SectionTitle title="کالاهای عمده این برند" subtitle={`${faNum(items.length)} کد کالا با نرخ‌نامه پله‌ای`} icon="grid" />
          {items.length === 0 ? (
            <EmptyState icon="package" title="کالایی برای این برند ثبت نشده است" />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {items.slice(0, 12).map((p) => (
                <ProductCard key={p.id} product={p} compact />
              ))}
            </div>
          )}
          {items.length > 12 && (
            <Link to={`/catalog?brand=${brand.id}`} className="btn-soft mt-3 w-full">
              مشاهده همه {faNum(items.length)} کد کالای این برند
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <Card>
            <SectionTitle title="اطلاعات برند" icon="info" />
            <p className="text-[11.5px] leading-7 text-ink-600 dark:text-ink-300">{brand.description}</p>
            <div className="mt-3 space-y-2 text-[11.5px]">
              {[
                ['کشور مبدأ', brand.country],
                ['نوع مجوز', brand.licenseKind],
                ['کد مجوز / IRC', brand.licenseCode],
                ['تاریخ اعتبار مجوز', `${jalaliDate(brand.licenseExpiry)} (${faNum(Math.max(0, daysUntil(brand.licenseExpiry)))} روز)`],
                ['نماینده رسمی در ایران', brand.representative ?? '—'],
                ['گروه‌های محصولی', brand.productLines.join(' ، ')],
              ].map(([l, v]) => (
                <div key={l} className="flex items-start justify-between gap-3 rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className="num max-w-[60%] text-left font-semibold" dir={l === 'کد مجوز / IRC' ? 'ltr' : 'rtl'}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {brand.tags.map((t) => (
                <span key={t} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  {t}
                </span>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle title="حوزه‌های فعالیت" icon="layers" />
            <div className="space-y-2">
              {brand.categoryIds.map((c) => {
                const cat = categoryById(c);
                if (!cat) return null;
                const count = items.filter((p) => p.categoryId === c).length;
                return (
                  <Link
                    key={c}
                    to={`/catalog?cat=${c}&brand=${brand.id}`}
                    className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 transition hover:border-brand-400 dark:border-ink-700"
                  >
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: `${cat.color}18`, color: cat.color }}>
                      <Icon name={cat.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-bold">{cat.name}</span>
                      <span className="num block text-[10.5px] text-ink-400">{faNum(count)} کالا در این دسته</span>
                    </span>
                    <Icon name="chevron-left" className="h-4 w-4 text-ink-300" />
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle title="خطوط تولید برند" icon="package" />
            <div className="flex flex-wrap gap-1.5">
              {brand.productLines.map((l) => (
                <span key={l} className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  {l}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-4">
        <SectionTitle title="مقایسه سریع کالاهای این برند" subtitle="قیمت پایه هر کارتن و پله‌های تخفیف" icon="chart" />
        <TableWrap>
          <thead>
            <tr>
              <th>کالا</th>
              <th>دسته</th>
              <th>بسته‌بندی</th>
              <th>قیمت پایه</th>
              <th>پله‌های تخفیف</th>
              <th>موجودی</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 20).map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <span className="h-10 w-10 flex-none overflow-hidden rounded-lg">
                      <ProductVisual product={p} size="sm" />
                    </span>
                    <Link to={`/product/${p.id}`} className="font-semibold hover:text-brand-700 dark:hover:text-brand-300">
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="text-[11px]">{categoryById(p.categoryId)?.name}</td>
                <td className="num text-[11px]">{p.packDesc}</td>
                <td className="num font-bold">{tomanShort(p.basePrice)}</td>
                <td className="num text-[11px]">
                  {p.tiers.filter((t) => t.discountPercent > 0).map((t) => `${faNum(t.minQty)}+ → ${faNum(t.discountPercent)}٪`).join(' | ') || '—'}
                </td>
                <td className="num">
                  {faNum(p.stock)} {p.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Card>

      {otherBrands.length > 0 && (
        <section className="mt-6">
          <SectionTitle title="برندهای مشابه" subtitle="در همان حوزه‌های فعالیت" icon="award" />
          <div className="flex flex-wrap gap-2.5">
            {otherBrands.map((b) => (
              <Link key={b.id} to={`/brand/${b.id}`} title={b.name} className="transition hover:-translate-y-0.5">
                <BrandMark brand={b} size={46} rounded />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BrandDetail;
