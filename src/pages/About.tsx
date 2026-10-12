import { Badge, Card, DemoNote, SectionTitle } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KarenSoftLogo } from '@/components/BrandLogo';
import { settings, securityFeatures, complianceItems } from '@/data/content';
import { faNum } from '@/lib/format';
import { useBrands, useProducts } from '@/store/useStore';

const About = () => {
  const brands = useBrands();
  const products = useProducts();

  return (
    <div className="space-y-6">
      <Card className="gradient-brand text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold sm:text-2xl">درباره بازارعمده</h1>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-white/85">
              بازارعمده یک پلتفرم B2B عمده‌فروشی مواد غذایی است که تأمین‌کننده و پخش‌کننده را مستقیم به فروشگاه‌ها،
              سوپرمارکت‌ها، رستوران‌ها، کافه‌ها، قنادی‌ها و عمده‌فروشان متصل می‌کند. با حذف بازاریاب فیزیکی و واسطه‌های
              غیرضروری، قیمت تأمین کاهش و شفافیت قیمت‌گذاری افزایش می‌یابد.
            </p>
          </div>
          <KarenSoftLogo size={44} light />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle title="توسعه‌دهنده این پروژه" subtitle="طراحی، پیاده‌سازی و توسعه رابط کاربری" icon="sparkles" />
          <div className="flex flex-wrap items-center gap-4 rounded-xl2 border border-ink-200 p-4 dark:border-ink-700">
            <KarenSoftLogo size={40} />
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-ink-900 dark:text-ink-50">شرکت کارن سافت</p>
              <p className="mt-0.5 text-[12px] text-ink-500 dark:text-ink-400">Karen Soft — توسعه نرم‌افزار و راهکارهای سازمانی</p>
              <a
                href="http://Karen-soft.ir"
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-700 hover:underline dark:text-brand-300"
              >
                <Icon name="globe" className="h-4 w-4" />
                Karen-soft.ir
                <Icon name="external" className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-6 text-ink-600 dark:text-ink-300">
            این نسخه دموی نمایشی، نمونه‌ای از توانمندی کارن سافت در پیاده‌سازی سامانه‌های B2B مبتنی بر وب است: رابط
            کاربری کاملاً راست‌به‌چپ، فارسی و موبایل‌محور، معماری ماژولار، ماندگاری داده در مرورگر و انتشار استاتیک روی
            GitHub Pages.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="brand" icon="check">React + TypeScript</Badge>
            <Badge tone="brand" icon="check">TailwindCSS</Badge>
            <Badge tone="brand" icon="check">Zustand + localStorage</Badge>
            <Badge tone="brand" icon="check">PWA + Static Export</Badge>
            <Badge tone="brand" icon="check">RTL و فونت وزیرمتن</Badge>
          </div>
        </Card>

        <div className="space-y-3">
          <Card>
            <p className="mb-2 text-[13px] font-extrabold">آمار پلتفرم در این دمو</p>
            <div className="space-y-2 text-[12px]">
              {[
                ['تعداد برندها', `${faNum(brands.length)} برند`],
                ['تعداد کد کالا', `${faNum(products.length)} قلم`],
                ['انبارها', '۳ انبار (تهران، مشهد، شیراز)'],
                ['نقش‌های کاربری', '۷ نقش با ۱۵ مجوز'],
                ['مدل‌های کسب‌وکار مستندشده', `${faNum(settings.businessModels.length)} مدل`],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between border-b border-dashed border-ink-200 py-1.5 dark:border-ink-700">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className="num font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-2 text-[13px] font-extrabold">مدل‌های کسب‌وکار قابل پشتیبانی</p>
            <div className="flex flex-wrap gap-1.5">
              {settings.businessModels.map((m) => (
                <Badge key={m} tone="neutral">{m}</Badge>
              ))}
            </div>
            <p className="mt-2.5 text-[11.5px] leading-5 text-ink-500 dark:text-ink-400">
              هر یک از این مدل‌ها در بخش «تنظیمات پلتفرم» و مستندات پروژه تشریح شده است.
            </p>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="انطباق، مجوز و کیفیت" subtitle="کنترل‌های نمایشی در این دمو" icon="shield" />
          <div className="space-y-2">
            {complianceItems.map((c) => (
              <div key={c.id} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] font-bold">{c.title}</p>
                  <Badge tone={c.status === 'valid' ? 'success' : 'warning'}>{c.status === 'valid' ? 'منطبق' : 'نیازمند پیگیری'}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{c.description}</p>
                <p className="mt-1 text-[10.5px] text-ink-400">{c.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="امنیت اطلاعات" subtitle="مستندسازی امنیتی نسخه عملیاتی" icon="lock" />
          <div className="space-y-2">
            {securityFeatures.map((s) => (
              <div key={s.id} className="flex items-start gap-2.5 rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800">
                  <Icon name={s.icon} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12.5px] font-bold">{s.title}</p>
                    <Badge tone={s.enabled ? 'success' : 'neutral'}>{s.enabled ? 'فعال' : 'غیرفعال در دمو'}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="فازبندی توسعه دمو" subtitle="این نسخه شامل هر چهار فاز است" icon="rocket" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['فاز ۱ — MVP', ['کاتالوگ و برند', 'محصول و پله قیمتی', 'ورود دمو', 'سبد خرید', 'پیش‌فاکتور PDF', 'پنل ادمین پایه', 'PWA']],
            ['فاز ۲ — فروش پیشرفته', ['آفر پیشرفته', 'RFQ', 'گزارش‌گیری CSV', 'چک و اعتبار', 'قرارداد پیمانی', 'باشگاه مشتریان']],
            ['فاز ۳ — هوش و پنل‌ها', ['داشبورد BI', 'چت‌بات', 'اپ فروشنده', 'پورتال تأمین‌کننده', 'پیشنهاد هوشمند', 'تحلیل ریزش']],
            ['فاز ۴ — محتوا و پایداری', ['آکادمی و بلاگ', 'انجمن گفت‌وگو', 'دستور پخت', 'پایداری', 'اپ راننده', 'یکپارچه‌سازی']],
          ].map(([title, items]) => (
            <div key={title as string} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
              <p className="text-[12.5px] font-extrabold">{title}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-ink-600 dark:text-ink-300">
                {(items as string[]).map((i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <Icon name="check" className="h-3 w-3 text-brand-600" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <DemoNote>
        توجه: این نسخه صرفاً یک دموی نمایشی است. تمام داده‌ها نمونه (Mock) هستند، هیچ تراکنش مالی واقعی انجام نمی‌شود و
        ارتباطی با سرویس‌های بیرونی (پیامک، درگاه پرداخت، نقشه، سامانه مودیان) وجود ندارد. طراحی و توسعه توسط{' '}
        <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold underline">
          کارن سافت — Karen-soft.ir
        </a>
        .
      </DemoNote>
    </div>
  );
};

export default About;
