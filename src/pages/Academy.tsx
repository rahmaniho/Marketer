import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, SectionTitle, Tabs } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { articles, faqs } from '@/data/content';
import { faNum, jalaliDate } from '@/lib/format';

const KIND_META: Record<string, { label: string; tone: 'brand' | 'info' | 'accent' | 'vip'; icon: string }> = {
  article: { label: 'مقاله آموزشی', tone: 'brand', icon: 'fileText' },
  video: { label: 'ویدیو', tone: 'info', icon: 'play' },
  recipe: { label: 'دستور پخت', tone: 'accent', icon: 'soup' },
  webinar: { label: 'وبینار', tone: 'vip', icon: 'video' },
};

const Academy = () => {
  const [tab, setTab] = useState('all');
  const [openFaq, setOpenFaq] = useState<string | null>(faqs[0].id);

  const list = articles.filter((a) => (tab === 'all' ? true : a.kind === tab));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="آکادمی خرده‌فروش و آموزش"
        subtitle="مقالات، ویدیو، دستور پخت و وبینار برای افزایش سود فروشگاه و رستوران شما"
        icon="award"
      />

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'همه محتوا', count: articles.length },
          { id: 'article', label: 'مقالات', count: articles.filter((a) => a.kind === 'article').length },
          { id: 'video', label: 'ویدیوها', count: articles.filter((a) => a.kind === 'video').length },
          { id: 'recipe', label: 'دستور پخت', count: articles.filter((a) => a.kind === 'recipe').length },
          { id: 'webinar', label: 'وبینار', count: articles.filter((a) => a.kind === 'webinar').length },
        ]}
      />

      {list.length === 0 ? (
        <EmptyState icon="award" title="محتوایی در این بخش نیست" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {list.map((a) => {
            const meta = KIND_META[a.kind];
            return (
              <Card key={a.id} className="flex flex-col" hover>
                <div className="relative h-32 overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${a.cover.from}, ${a.cover.to})` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name={a.cover.icon} className="h-12 w-12 text-white/85" />
                  </div>
                  <span className="absolute right-2 top-2">
                    <Badge className="bg-white/90 text-ink-800" icon={meta.icon}>
                      {meta.label}
                    </Badge>
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] font-extrabold leading-6 text-ink-900 dark:text-ink-50">{a.title}</p>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[11.5px] leading-5 text-ink-500 dark:text-ink-400">{a.excerpt}</p>
                <div className="mt-3 flex items-center justify-between text-[10.5px] text-ink-400">
                  <span className="num">{jalaliDate(a.publishedAt)} • {faNum(a.readMinutes)} دقیقه</span>
                  <span className="num flex items-center gap-1">
                    <Icon name="eye" className="h-3.5 w-3.5" />
                    {faNum(a.views)}
                  </span>
                </div>
                <Link to={`/academy/${a.id}`} className="btn-ghost btn-sm mt-3 w-full">
                  {a.kind === 'webinar' ? 'ثبت‌نام در وبینار' : a.kind === 'video' ? 'تماشای ویدیو' : 'ادامه مطلب'}
                  <Icon name="chevron-left" className="h-3.5 w-3.5" />
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <SectionTitle title="پرسش‌های متداول" subtitle="پاسخ سریع به سوالات رایج فروشگاه‌ها" icon="info" />
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="rounded-xl border border-ink-200 dark:border-ink-700">
              <button
                onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-right"
                aria-expanded={openFaq === f.id}
              >
                <span className="text-[12.5px] font-bold text-ink-800 dark:text-ink-200">{f.question}</span>
                <span className="flex items-center gap-2">
                  <Badge tone="neutral">{f.category}</Badge>
                  <Icon name={openFaq === f.id ? 'chevron-up' : 'chevron-down'} className="h-4 w-4 flex-none text-ink-400" />
                </span>
              </button>
              {openFaq === f.id && (
                <div className="border-t border-ink-100 px-3.5 py-3 text-[12px] leading-6 text-ink-600 dark:border-ink-800 dark:text-ink-300">
                  {f.answer}
                  <p className="num mt-2 text-[10.5px] text-ink-400">{faNum(f.helpful)} نفر این پاسخ را مفید دانستند</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Academy;
