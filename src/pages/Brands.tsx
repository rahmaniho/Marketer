import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, Pagination, SectionTitle, Stat, Tabs } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark } from '@/components/BrandLogo';
import { useBrands, useProducts } from '@/store/useStore';
import { faNum } from '@/lib/format';
import { rootCategories } from '@/data/categories';

const Brands = () => {
  const brands = useBrands();
  const products = useProducts();
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const PER = 24;

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.brandId, (map.get(p.brandId) ?? 0) + 1));
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return brands.filter((b) => {
      if (tab === 'iran' && b.origin !== 'iran') return false;
      if (tab === 'international' && b.origin !== 'international') return false;
      if (tab === 'exclusive' && !b.exclusive) return false;
      if (cat !== 'all' && !b.categoryIds.includes(cat)) return false;
      if (term && !b.name.includes(term) && !b.nameEn.toLowerCase().includes(term.toLowerCase())) return false;
      return true;
    });
  }, [brands, tab, cat, q]);

  const pages = Math.ceil(filtered.length / PER);
  const items = filtered.slice((page - 1) * PER, page * PER);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-lg font-extrabold">برندها و تأمین‌کنندگان</h1>
        <p className="mt-1 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
          کاتالوگ کامل برندهای ایرانی صنایع غذایی و برندهای بین‌المللی دارای مجوز و نمایندگی رسمی در ایران. تمام
          برندها در یک پلتفرم، با نرخ‌نامه عمده شفاف و امکان سفارش ترکیبی چندبرندی در یک سبد.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل برندها" value={`${faNum(brands.length)} برند`} icon="award" />
        <Stat label="برندهای ایرانی" value={`${faNum(brands.filter((b) => b.origin === 'iran').length)} برند`} icon="store" tone="info" />
        <Stat label="برندهای بین‌المللی" value={`${faNum(brands.filter((b) => b.origin === 'international').length)} برند`} icon="globe" tone="accent" hint="دارای مجوز و IRC" />
        <Stat label="کد کالای فعال" value={faNum(products.length)} icon="package" tone="vip" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tabs
          size="sm"
          active={tab}
          onChange={(t) => { setTab(t); setPage(1); }}
          tabs={[
            { id: 'all', label: 'همه برندها', count: brands.length },
            { id: 'iran', label: 'ایرانی', count: brands.filter((b) => b.origin === 'iran').length },
            { id: 'international', label: 'بین‌المللی', count: brands.filter((b) => b.origin === 'international').length },
            { id: 'exclusive', label: 'نمایندگی انحصاری' },
          ]}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه دسته‌های فعالیت</option>
          {rootCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="relative min-w-[200px] flex-1">
          <Icon name="search" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="جست‌وجوی برند (فارسی یا لاتین)…"
            className="input py-2 pr-9 text-[12px]"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon="award" title="برندی با این مشخصات یافت نشد" description="عبارت دیگری جست‌وجو کنید یا فیلترها را تغییر دهید." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((b) => (
            <Link key={b.id} to={`/brand/${b.id}`} className="card flex flex-col gap-3 transition hover:shadow-pop">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <BrandMark brand={b} size={46} rounded />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-extrabold">{b.name}</p>
                    <p className="truncate text-[10px] text-ink-400" dir="ltr">
                      {b.nameEn}
                    </p>
                  </div>
                </div>
                <Badge tone={b.origin === 'iran' ? 'brand' : 'info'}>{b.origin === 'iran' ? 'ایرانی' : 'وارداتی'}</Badge>
              </div>
              <p className="line-clamp-2 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{b.description}</p>
              <div className="flex flex-wrap gap-1">
                {b.productLines.slice(0, 3).map((l) => (
                  <span key={l} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    {l}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-2.5 text-[10.5px] dark:border-ink-800">
                <span className="num text-ink-500 dark:text-ink-400">{faNum(counts.get(b.id) ?? 0)} کد کالا</span>
                <span className="num">{b.country}</span>
                <span className="flex items-center gap-1 text-brand-700 dark:text-brand-300">
                  مشاهده
                  <Icon name="chevron-left" className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} onChange={setPage} />

      <Card className="mt-6">
        <SectionTitle title="دسته‌بندی برندها بر پایه حوزه فعالیت" subtitle="برای مشاهده کالاهای هر حوزه، روی دسته کلیک کنید" icon="grid" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {rootCategories.map((c) => {
            const list = brands.filter((b) => b.categoryIds.includes(c.id));
            return (
              <button
                key={c.id}
                onClick={() => { setCat(c.id); setTab('all'); setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-3 text-right transition hover:border-brand-400 dark:border-ink-700"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: `${c.color}18`, color: c.color }}>
                  <Icon name={c.icon} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-bold">{c.name}</span>
                  <span className="num block text-[10.5px] text-ink-400">{faNum(list.length)} برند</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4 bg-ink-50/70 dark:bg-ink-800/40">
        <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
          <span className="font-bold">نکته: </span>
          لوگوهای نمایش‌داده‌شده در این دمو، طرح‌های مونوگرام اختصاصی («لوگوی نمایشی») هستند که برای نمایش چیدمان
          طراحی شده‌اند و جایگزین فایل رسمی لوگوی برندها نیستند.
        </p>
      </Card>
    </div>
  );
};

export default Brands;
