import { Badge, Card, DemoNote, SectionTitle, Stat, Switch, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { useStore, useProducts } from '@/store/useStore';
import { Progress } from '@/components/ui';

const Subscriptions = () => {
  const subscriptions = useStore((s) => s.subscriptions);
  const toggle = useStore((s) => s.toggleSubscription);
  const addToCart = useStore((s) => s.addToCart);
  const products = useProducts();
  const { toast } = useToast();

  const active = subscriptions.filter((s) => s.active);
  const monthlyValue = active.reduce((s, x) => s + (x.period === 'هفتگی' ? x.amount * 4 : x.period === 'دوهفته‌ای' ? x.amount * 2 : x.amount), 0);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="سفارش دوره‌ای و اشتراک تأمین"
        subtitle="سبد ثابت فروشگاه را در بازه‌های منظم و با قیمت تثبیت‌شده دریافت کنید"
        icon="repeat"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="اشتراک‌های فعال" value={faNum(active.length)} icon="repeat" unit={`از ${faNum(subscriptions.length)}`} />
        <Stat label="ارزش ماهانه تأمین" value={toman(monthlyValue, false)} unit="تومان" icon="wallet" tone="info" />
        <Stat label="صرفه‌جویی تخمینی" value={toman(monthlyValue * 0.06, false)} unit="تومان/ماه" icon="percent" tone="accent" hint="با قیمت تثبیت‌شده" />
        <Stat label="تحویل بعدی" value={active[0] ? jalaliDate(active[0].nextDate) : '—'} icon="truck" tone="brand" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {subscriptions.map((s) => {
          const product = products.find((p) => p.name.includes(s.title.split(' ')[1] ?? '')) ?? products[0];
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl2 ${s.active ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-ink-100 text-ink-400 dark:bg-ink-800'}`}>
                    <Icon name="repeat" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-extrabold">{s.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500 dark:text-ink-400">
                      <Badge tone="info">{s.period}</Badge>
                      <span className="num">تحویل بعدی: {jalaliDate(s.nextDate)}</span>
                    </p>
                  </div>
                </div>
                <Switch checked={s.active} onChange={() => { toggle(s.id); toast(s.active ? 'اشتراک موقتاً غیرفعال شد' : 'اشتراک فعال شد'); }} label="" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                  <p className="text-ink-500 dark:text-ink-400">ارزش هر دوره</p>
                  <p className="num font-bold">{toman(s.amount, false)} تومان</p>
                </div>
                <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                  <p className="text-ink-500 dark:text-ink-400">تعداد اقلام نمونه</p>
                  <p className="num font-bold">{faNum(4 + (s.id.length % 5))} قلم</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-soft btn-sm" onClick={() => { addToCart(product.id, product.moq); toast('اقلام دوره بعدی به سبد اضافه شد'); }}>
                  <Icon name="cart" className="h-4 w-4" />
                  افزودن دوره بعدی به سبد
                </button>
                <button className="btn-ghost btn-sm" onClick={() => toast('ویرایش سبد اشتراک در نسخه دمو فعال نیست', 'info')}>
                  <Icon name="edit" className="h-4 w-4" />
                  ویرایش اقلام
                </button>
                <button className="btn-ghost btn-sm" onClick={() => toast('زمان‌بندی جدید ثبت شد (نمایشی)')}>
                  <Icon name="calendar" className="h-4 w-4" />
                  تغییر زمان‌بندی
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <p className="mb-3 text-[13px] font-extrabold">پیشنهاد ساخت اشتراک جدید (بر پایه الگوی خرید شما)</p>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            ['سبد کافه و رستوران', 'سس، پنیر پیتزا، نوشیدنی، ماکارونی — هفتگی', 8_400_000],
            ['سبد صبحانه فروشگاه', 'شیر، پنیر، کره، چای، مربا — دوهفته‌ای', 6_200_000],
            ['سبد آجیل و شکلات', 'خرما، مغز گردو، شکلات، بیسکویت — ماهانه', 14_800_000],
          ].map(([title, desc, amount]) => (
            <div key={title as string} className="flex flex-col rounded-xl border border-dashed border-ink-300 p-3 dark:border-ink-600">
              <Icon name="sparkles" className="h-5 w-5 text-brand-600" />
              <p className="mt-2 text-[12.5px] font-extrabold">{title}</p>
              <p className="mt-1 flex-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{desc}</p>
              <p className="num mt-2 text-[12px] font-bold">{toman(amount as number, false)} تومان</p>
              <button className="btn-primary btn-sm mt-2" onClick={() => toast('اشتراک پیشنهادی ثبت شد (نمایشی)')}>
                فعال‌سازی
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Progress value={68} label="۶۸٪ از مشتریان مشابه شما از سفارش دوره‌ای استفاده می‌کنند" />
        </div>
      </Card>

      <DemoNote>
        سفارش دوره‌ای در این نسخه شبیه‌سازی‌شده است؛ در نسخه عملیاتی، فاکتور هر دوره به‌صورت خودکار صادر و برای تأیید
        نهایی به شما ارسال می‌شود.
      </DemoNote>
    </div>
  );
};

export default Subscriptions;
