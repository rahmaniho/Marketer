import { useState } from 'react';
import { Badge, Card, DemoNote, Field, SectionTitle, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { forumTopics } from '@/data/content';
import { faNum, timeAgo } from '@/lib/format';

const Forum = () => {
  const [topics, setTopics] = useState(forumTopics);
  const [openId, setOpenId] = useState<string | null>(forumTopics[0].id);
  const [tab, setTab] = useState('all');
  const [reply, setReply] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const { toast } = useToast();

  const list = topics.filter((t) => (tab === 'all' ? true : tab === 'solved' ? t.solved : tab === 'unsolved' ? !t.solved : t.pinned));

  const addReply = (id: string) => {
    if (reply.trim().length < 3) return;
    setTopics((s) =>
      s.map((t) =>
        t.id === id
          ? { ...t, replies: [...t.replies, { author: 'شما (مشتری دمو)', role: 'سوپرمارکت زنجیره‌ای آفتاب', body: reply.trim(), at: new Date().toISOString() }] }
          : t,
      ),
    );
    setReply('');
    toast('پاسخ شما ثبت شد (نمایشی)');
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="انجمن گفت‌وگوی فروشگاه‌ها"
        subtitle="تجربه‌ها، پرسش‌ها و راهنمایی متقابل میان سوپرمارکت‌ها، رستوران‌ها و عمده‌فروشان"
        icon="users"
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'all', label: 'همه موضوعات', count: topics.length },
              { id: 'pinned', label: 'سنجاق‌شده', count: topics.filter((t) => t.pinned).length },
              { id: 'solved', label: 'حل‌شده', count: topics.filter((t) => t.solved).length },
              { id: 'unsolved', label: 'بدون پاسخ', count: topics.filter((t) => !t.solved).length },
            ]}
          />

          {list.map((t) => (
            <Card key={t.id}>
              <button className="w-full text-right" onClick={() => setOpenId(openId === t.id ? null : t.id)} aria-expanded={openId === t.id}>
                <div className="flex flex-wrap items-center gap-2">
                  {t.pinned && <Badge tone="accent" icon="star">سنجاق‌شده</Badge>}
                  {t.solved && <Badge tone="success" icon="check-circle">حل‌شده</Badge>}
                  <p className="text-[13.5px] font-extrabold text-ink-900 dark:text-ink-50">{t.title}</p>
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
                  <span className="font-semibold">{t.author}</span>
                  <span>• {t.role}</span>
                  <span className="num">• {timeAgo(t.createdAt)}</span>
                  <span className="num">• {faNum(t.replies.length)} پاسخ</span>
                  <span className="num">• {faNum(t.views)} بازدید</span>
                </p>
              </button>

              {openId === t.id && (
                <div className="mt-3 space-y-3 border-t border-ink-100 pt-3 dark:border-ink-800">
                  <p className="rounded-xl bg-ink-50 p-3 text-[12px] leading-6 text-ink-700 dark:bg-ink-800/60 dark:text-ink-200">{t.body}</p>
                  <div className="space-y-2">
                    {t.replies.map((r, i) => (
                      <div key={i} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                        <p className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-bold text-ink-800 dark:text-ink-200">{r.author}</span>
                          <Badge tone="neutral">{r.role}</Badge>
                          <span className="num text-ink-400">{timeAgo(r.at)}</span>
                        </p>
                        <p className="mt-1.5 text-[12px] leading-6 text-ink-600 dark:text-ink-300">{r.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ خود را بنویسید…" className="input py-2 text-[12px]" aria-label="پاسخ" />
                    <button className="btn-primary btn-sm" onClick={() => addReply(t.id)}>
                      <Icon name="send" className="h-3.5 w-3.5" />
                      ثبت
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">ایجاد موضوع جدید</p>
            <div className="space-y-2.5">
              <Field label="عنوان موضوع">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="مثال: تجربه خرید پالتی نوشیدنی" className="input" />
              </Field>
              <Field label="متن موضوع">
                <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={3} placeholder="تجربه یا پرسش خود را بنویسید…" className="input" />
              </Field>
              <button
                className="btn-primary w-full"
                onClick={() => {
                  if (newTitle.trim().length < 5 || newBody.trim().length < 10) {
                    toast('عنوان و متن موضوع را کامل‌تر وارد کنید', 'error');
                    return;
                  }
                  setTopics((s) => [
                    {
                      id: `ft-new-${Date.now()}`,
                      title: newTitle,
                      author: 'شما (مشتری دمو)',
                      role: 'سوپرمارکت زنجیره‌ای آفتاب',
                      body: newBody,
                      replies: [],
                      tags: ['موضوع جدید'],
                      views: 0,
                      createdAt: new Date().toISOString(),
                      pinned: false,
                      solved: false,
                    },
                    ...s,
                  ]);
                  setNewTitle('');
                  setNewBody('');
                  toast('موضوع شما ثبت شد (نمایشی)');
                }}
              >
                <Icon name="plus" className="h-4 w-4" />
                ثبت موضوع
              </button>
            </div>
          </Card>

          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">کاربران فعال انجمن</p>
            <div className="space-y-2">
              {[
                ['مهدی رضایی', 'سوپرمارکت زنجیره‌ای آفتاب', 128],
                ['جعفر رستمی', 'پخش مواد غذایی کاسپین', 96],
                ['نگار احمدی', 'کافه‌رستوران بلوط', 74],
                ['کارشناس بازارعمده', 'تیم پشتیبانی', 412],
              ].map(([n, r, c]) => (
                <div key={n as string} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-[12px] font-extrabold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {(n as string)[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold">{n}</p>
                    <p className="truncate text-[10.5px] text-ink-500 dark:text-ink-400">{r}</p>
                  </div>
                  <span className="num text-[11px] text-ink-400">{faNum(c as number)} پاسخ</span>
                </div>
              ))}
            </div>
          </Card>

          <DemoNote icon="users">
            در نسخه دمو، موضوعات و پاسخ‌ها فقط در مرورگر شما ذخیره می‌شوند. در نسخه عملیاتی، انجمن با پروفایل واقعی
            کسب‌وکارها و رتبه‌بندی کاربران فعال می‌شود.
          </DemoNote>
        </div>
      </div>
    </div>
  );
};

export default Forum;
