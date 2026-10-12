import { useEffect, useRef, useState } from 'react';
import { Card, DemoNote, SectionTitle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { chatScripts } from '@/data/content';
import { normalizeFa } from '@/lib/format';

const QUICK = ['قیمت عمده چطور محاسبه می‌شود؟', 'ارسال و تحویل چند روز است؟', 'تسویه اعتباری و چک', 'شرایط مرجوعی', 'استعلام قیمت تیراژ بالا', 'QR و اصالت کالا'];

const Chat = () => {
  const messages = useStore((s) => s.chatMessages);
  const pushChat = useStore((s) => s.pushChat);
  const customer = useStore((s) => s.customer);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // در برخی محیط‌های محدود (یا مرورگرهای قدیمی) ممکن است این متد موجود نباشد
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typing]);

  const answer = (q: string): string => {
    const n = normalizeFa(q);
    const hit = chatScripts.find((s) => s.patterns.some((p) => n.includes(normalizeFa(p))));
    if (hit) return hit.answer;
    if (n.includes('سلام') || n.includes('درود')) return 'سلام و وقت بخیر 🌿 در خدمتم. درباره قیمت، ارسال، تسویه، مرجوعی یا اصالت کالا بپرسید.';
    return 'این پرسش را ثبت کردم. برای پاسخ دقیق‌تر، کارشناس فروش تا دقایقی با شما تماس می‌گیرد. در این دمو می‌توانم درباره قیمت‌گذاری پله‌ای، تسویه (نقدی/اعتباری/چک)، ارسال، مرجوعی، RFQ، QR اصالت کالا و سفارش دوره‌ای راهنمایی کنم.';
  };

  const send = (value: string) => {
    const t = value.trim();
    if (!t) return;
    pushChat({ id: `m-${Date.now()}`, from: 'me', text: t, at: new Date().toISOString() });
    setText('');
    setTyping(true);
    setTimeout(() => {
      pushChat({ id: `b-${Date.now()}`, from: 'bot', text: answer(t), at: new Date().toISOString() });
      setTyping(false);
    }, 700);
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="پشتیبانی آنلاین (چت‌بات نمایشی)"
        subtitle="پاسخ‌های این چت‌بات از پیش تعریف‌شده است و داده‌ای ارسال یا دریافت نمی‌شود"
        icon="message"
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card padded={false} className="flex h-[600px] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-2xl text-white">
              <Icon name="sparkles" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold">دستیار هوشمند بازارعمده</p>
              <p className="text-[11px] text-brand-700 dark:text-brand-300">آنلاین • پاسخ در چند ثانیه</p>
            </div>
            <span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">دمو</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-6 ${
                    m.from === 'me'
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-800 dark:bg-ink-800 dark:text-ink-100'
                  }`}
                >
                  <p>{m.text}</p>
                  <p className={`num mt-1 text-[10px] ${m.from === 'me' ? 'text-white/70' : 'text-ink-400'}`}>
                    {jalaliDateTime(m.at)}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-end">
                <div className="flex items-center gap-1 rounded-2xl bg-ink-100 px-4 py-3 dark:bg-ink-800">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-ink-100 p-3 dark:border-ink-800">
            <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="flex-none rounded-full border border-ink-200 px-2.5 py-1 text-[11px] font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-700 dark:border-ink-700 dark:text-ink-300"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(text);
              }}
            >
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="پرسش خود را بنویسید…" className="input" aria-label="متن پیام" />
              <button className="btn-primary" aria-label="ارسال پیام">
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <p className="mb-2 text-[13px] font-extrabold">اطلاعات تماس نمایشی</p>
            <div className="space-y-2 text-[11.5px] text-ink-600 dark:text-ink-300">
              <p className="flex items-center gap-2">
                <Icon name="phone" className="h-4 w-4 text-brand-600" />
                <span className="num">۰۲۱-۴۴۵۵۶۶۷۷</span> (شنبه تا چهارشنبه ۸ تا ۱۷)
              </p>
              <p className="flex items-center gap-2">
                <Icon name="mail" className="h-4 w-4 text-brand-600" />
                <span dir="ltr">sales@marketer.demo</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="whatsapp" className="h-4 w-4 text-brand-600" />
                واتساپ بیزینس (نمایشی)
              </p>
              <p className="flex items-center gap-2">
                <Icon name="user" className="h-4 w-4 text-brand-600" />
                کارشناس اختصاصی: {customer ? 'آقای نیما برزگر' : '—'}
              </p>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">کارشناسان پاسخ‌گو</p>
            <div className="space-y-2">
              {[
                ['نیما برزگر', 'اپراتور سفارش — داخلی ۱۰۲'],
                ['مریم کیانی', 'کارشناس مالی و اعتبار — داخلی ۲۰۵'],
                ['حسین داودی', 'مسئول انبار و ارسال — داخلی ۳۰۱'],
              ].map(([n, r]) => (
                <div key={n} className="flex items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-[12px] font-extrabold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {n.split(' ')[0][0]}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold">{n}</p>
                    <p className="text-[10.5px] text-ink-500 dark:text-ink-400">{r}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">آمار پاسخ‌گویی (نمایشی)</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                ['میانگین پاسخ', '۲ دقیقه'],
                ['رضایت مشتری', '۹۴٪'],
                ['تیکت باز', `${faNum(6)} مورد`],
                ['NPS', `${faNum(7.8, 1)} از ۱۰`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-ink-50 px-2 py-2.5 dark:bg-ink-800/60">
                  <p className="text-[10.5px] text-ink-500 dark:text-ink-400">{l}</p>
                  <p className="num text-[13px] font-extrabold">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <DemoNote>
            این چت‌بات کاملاً سمت کلاینت و با پاسخ‌های از پیش تعریف‌شده کار می‌کند؛ هیچ پیامی به سرور ارسال نمی‌شود.
            در نسخه عملیاتی می‌توان آن را به مدل زبانی و سیستم CRM متصل کرد.
          </DemoNote>
        </div>
      </div>
    </div>
  );
};

export default Chat;
