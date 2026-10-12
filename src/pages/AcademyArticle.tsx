import { Link, useParams } from 'react-router-dom';
import { Badge, Card, DemoNote, EmptyState, SectionTitle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { articles } from '@/data/content';
import { faNum, jalaliDate } from '@/lib/format';
import { useProducts } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';
import { useBrandMap } from '@/store/useStore';

const AcademyArticle = () => {
  const { id = '' } = useParams();
  const article = articles.find((a) => a.id === id);
  const products = useProducts();
  const brandMap = useBrandMap();

  if (!article) {
    return <EmptyState icon="award" title="محتوا یافت نشد" action={<Link to="/academy" className="btn-primary">بازگشت به آکادمی</Link>} />;
  }

  const related = products.filter((p) => p.badges.includes('bestseller')).slice(0, 4);
  const others = articles.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="space-y-5">
      <nav className="flex items-center gap-1.5 text-[11.5px] text-ink-500 dark:text-ink-400">
        <Link to="/academy" className="hover:text-brand-700">آکادمی</Link>
        <Icon name="chevron-left" className="h-3 w-3" />
        <span>{article.category}</span>
      </nav>

      <Card padded={false} className="overflow-hidden">
        <div className="relative h-40 sm:h-52" style={{ background: `linear-gradient(135deg, ${article.cover.from}, ${article.cover.to})` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name={article.cover.icon} className="h-16 w-16 text-white/85" />
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand">{article.category}</Badge>
            <Badge tone="neutral">{article.kind === 'video' ? 'ویدیو' : article.kind === 'recipe' ? 'دستور پخت' : article.kind === 'webinar' ? 'وبینار' : 'مقاله'}</Badge>
            <span className="num text-[11px] text-ink-400">
              {jalaliDate(article.publishedAt, 'long')} • {faNum(article.readMinutes)} دقیقه مطالعه • {faNum(article.views)} بازدید
            </span>
          </div>
          <h1 className="mt-3 text-lg font-extrabold leading-8 text-ink-900 dark:text-ink-50">{article.title}</h1>
          <p className="mt-2 text-[13px] leading-7 text-ink-600 dark:text-ink-300">{article.excerpt}</p>

          <div className="mt-4 space-y-3 text-[12.5px] leading-7 text-ink-700 dark:text-ink-200">
            {article.body.split('. ').map((p, i) => (
              <p key={i}>{p.trim().endsWith('.') ? p.trim() : `${p.trim()}.`}</p>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <span key={t} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">#{t}</span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 dark:border-ink-800">
            <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
              نویسنده: <span className="font-bold">{article.author}</span>
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost btn-sm" onClick={() => window.print()}>
                <Icon name="print" className="h-4 w-4" />
                چاپ مقاله
              </button>
              <Link to="/academy" className="btn-ghost btn-sm">
                بازگشت به آکادمی
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {article.kind === 'webinar' && (
        <DemoNote icon="video">
          ثبت‌نام وبینار در این دمو نمایشی است. در نسخه عملیاتی لینک پخش زنده و یادآوری پیامکی برای ثبت‌نام‌کنندگان ارسال
          می‌شود.
        </DemoNote>
      )}

      <section>
        <SectionTitle title="کالاهای پرکاربرد در این موضوع" subtitle="پیشنهاد تأمین مرتبط با محتوای آموزشی" icon="package" />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} brand={brandMap.get(p.brandId)} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="مطالب مرتبط" icon="award" />
        <div className="grid gap-3 sm:grid-cols-3">
          {others.map((a) => (
            <Link key={a.id} to={`/academy/${a.id}`} className="card p-3.5 transition hover:shadow-pop">
              <div className="h-20 rounded-xl" style={{ background: `linear-gradient(135deg, ${a.cover.from}, ${a.cover.to})` }} />
              <p className="mt-2.5 line-clamp-2 text-[12.5px] font-bold">{a.title}</p>
              <p className="num mt-1 text-[10.5px] text-ink-400">{faNum(a.readMinutes)} دقیقه</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AcademyArticle;
