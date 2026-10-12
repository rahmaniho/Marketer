import { Card, DemoNote, Progress, SectionTitle, Stat } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { sustainability } from '@/data/content';
import { faNum, toman } from '@/lib/format';
import { useProducts } from '@/store/useStore';
import { daysUntil } from '@/lib/format';

const Sustainability = () => {
  const products = useProducts();
  const nearExpiry = products.filter((p) => daysUntil(p.expiryDate) < 200);

  return (
    <div className="space-y-5">
      <SectionTitle
        title="پایداری و مسئولیت اجتماعی"
        subtitle="کاهش ضایعات، اهدای غذای سالم، بهینه‌سازی حمل و کمپین‌های خیریه"
        icon="leaf"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="کالای نجات‌یافته از امحا" value="۲۱۸ تن" icon="leaf" tone="brand" hint="در ۱۲ ماه گذشته" />
        <Stat label="وعده غذایی اهداشده" value={faNum(124000)} icon="heart" tone="accent" />
        <Stat label="کاهش مصرف سوخت" value="۲۳٪" icon="truck" tone="info" hint="در هر تن کیلومتر" />
        <Stat label="اقلام نزدیک انقضا" value={faNum(nearExpiry.length)} icon="clock" tone="danger" hint="قابل عرضه در فرصت ویژه" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sustainability.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl2" style={{ background: `${s.color}1f`, color: s.color }}>
                <Icon name={s.kind === 'کربن' ? 'truck' : s.kind === 'بازیافت' ? 'repeat' : s.kind === 'خیریه' ? 'heart' : s.kind === 'اهدای غذا' ? 'gift' : 'leaf'} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[13.5px] font-extrabold leading-6 text-ink-900 dark:text-ink-50">{s.title}</p>
                  <span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{s.kind}</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{s.description}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">اثر تا امروز</p>
                    <p className="font-bold">{s.impact}</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">همکار</p>
                    <p className="font-bold">{s.partner}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={s.progress} color={s.color} label={`${faNum(s.progress)}٪ — هدف: ${s.goal}`} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle title="فرصت ویژه — کالاهای نزدیک انقضا" subtitle="با تخفیف پلکانی تا ۱۵٪ و کمک به کاهش ضایعات" icon="clock" />
        <div className="overflow-x-auto">
          <table className="table-basic min-w-[620px]">
            <thead>
              <tr>
                <th>کالا</th>
                <th>تاریخ انقضا</th>
                <th>مانده</th>
                <th>موجودی</th>
                <th>تخفیف پیشنهادی</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {nearExpiry.slice(0, 8).map((p) => {
                const days = daysUntil(p.expiryDate);
                const discount = days < 120 ? 15 : days < 150 ? 10 : 7;
                return (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td className="num">{new Date(p.expiryDate).toLocaleDateString('fa-IR')}</td>
                    <td className="num">{faNum(days)} روز</td>
                    <td className="num">{faNum(p.stock)} {p.unit}</td>
                    <td>
                      <span className="chip bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">{faNum(discount)}٪</span>
                    </td>
                    <td>
                      <a href={`#/product/${p.id}`} className="btn-soft btn-sm">
                        مشاهده و خرید
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="num mt-3 text-[11px] text-ink-400">
          ارزش تقریبی کالای نجات‌یافته در سال گذشته: {toman(18_400_000_000, false)} تومان
        </p>
      </Card>

      <DemoNote icon="leaf">
        این بخش نمایشی است و اعداد آن نمونه هستند. در نسخه عملیاتی، گزارش اثر اجتماعی به‌صورت ماهانه از داده واقعی
        سفارش‌ها و مرجوعی‌ها محاسبه و منتشر می‌شود.
      </DemoNote>
    </div>
  );
};

export default Sustainability;
