import { Badge, Card, CopyButton, EmptyState, Progress, SectionTitle, Stat, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { useOrders, useStore } from '@/store/useStore';
import { loyalty as mockLoyalty } from '@/data/crm';

const Loyalty = () => {
  const customer = useStore((s) => s.customer);
  const points = useStore((s) => s.loyaltyPoints);
  const addPoints = useStore((s) => s.addPoints);
  const orders = useOrders();
  const { toast } = useToast();

  const myOrders = orders.filter((o) => o.customerId === customer?.id);
  const history = mockLoyalty.history;
  const nextTier = 25000;
  const progress = Math.min(100, (points / nextTier) * 100);

  return (
    <div className="space-y-4">
      <SectionTitle
        title="باشگاه مشتریان و امتیاز وفاداری"
        subtitle="امتیاز خرید، معرفی مشتری جدید و جوایز اختصاصی فروشگاه‌ها"
        icon="crown"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="امتیاز فعلی شما" value={faNum(points)} icon="star" tone="accent" />
        <Stat label="سطح باشگاه" value={mockLoyalty.tier} icon="crown" tone="vip" />
        <Stat label="مشتریان معرفی‌شده" value={faNum(mockLoyalty.referralCount)} icon="users" tone="info" />
        <Stat label="درآمد از معرفی" value={toman(mockLoyalty.referralEarnings, false)} icon="wallet" tone="brand" hint="تومان" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-extrabold">مسیر ارتقای سطح</p>
                <p className="num mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
                  {faNum(Math.max(0, nextTier - points))} امتیاز تا سطح «الماس» و دریافت تخفیف دائمی ۷٪
                </p>
              </div>
              <Badge tone="vip" icon="crown">{mockLoyalty.tier}</Badge>
            </div>
            <div className="mt-3">
              <Progress value={progress} label={`${faNum(progress, 1)}٪ از مسیر تکمیل شده`} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
              {[
                ['نقره‌ای', '۰ تا ۵٫۰۰۰'],
                ['طلایی', '۵٫۰۰۰ تا ۱۵٫۰۰۰'],
                ['VIP طلایی', '۱۵٫۰۰۰ تا ۲۵٫۰۰۰'],
                ['الماس', 'بالای ۲۵٫۰۰۰'],
              ].map(([t, r]) => (
                <div key={t} className="rounded-xl border border-ink-200 px-2.5 py-2 dark:border-ink-700">
                  <p className="font-bold">{t}</p>
                  <p className="num text-ink-500 dark:text-ink-400">{r} امتیاز</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-extrabold">جوایز قابل دریافت با امتیاز</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {mockLoyalty.rewards.map((r) => {
                const affordable = points >= r.points;
                return (
                  <div key={r.id} className="flex flex-col rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                        <Icon name={r.image === 'truck' ? 'truck' : r.image === 'ticket' ? 'ticket' : r.image === 'advisor' ? 'advisor' : 'discount'} className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[12.5px] font-extrabold">{r.title}</p>
                        <p className="num text-[11px] text-ink-500 dark:text-ink-400">{faNum(r.points)} امتیاز</p>
                      </div>
                    </div>
                    <p className="mt-2 flex-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{r.description}</p>
                    <button
                      className={`${affordable ? 'btn-primary' : 'btn-ghost'} btn-sm mt-2.5`}
                      disabled={!affordable}
                      onClick={() => {
                        addPoints(-r.points);
                        toast(`جایزه «${r.title}» فعال شد — کد رزرو به کیف پول اضافه شد`);
                      }}
                    >
                      {affordable ? 'دریافت جایزه' : 'امتیاز کافی نیست'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-extrabold">تاریخچه امتیاز</p>
            <div className="overflow-x-auto">
              <table className="table-basic min-w-[480px]">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>شرح</th>
                    <th>نوع</th>
                    <th>امتیاز</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td className="num">{jalaliDate(h.at)}</td>
                      <td>{h.title}</td>
                      <td>
                        <Badge tone={h.kind === 'earn' ? 'success' : 'warning'}>{h.kind === 'earn' ? 'کسب' : 'مصرف'}</Badge>
                      </td>
                      <td className={`num font-bold ${h.points > 0 ? 'text-brand-700 dark:text-brand-300' : 'text-rose-600'}`}>
                        {h.points > 0 ? '+' : '−'}
                        {faNum(Math.abs(h.points))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="mb-2 text-[13px] font-extrabold">کد معرف اختصاصی شما</p>
            <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-2.5 dark:bg-ink-800/60">
              <span className="num flex-1 font-extrabold" dir="ltr">{mockLoyalty.referralCode}</span>
              <CopyButton text={mockLoyalty.referralCode} label="کپی" />
            </div>
            <p className="mt-2 text-[11.5px] leading-5 text-ink-500 dark:text-ink-400">
              با هر معرفی موفق، ۲٫۵۰۰ امتیاز و ۴۰۰ هزار تومان اعتبار خرید دریافت می‌کنید و مشتری معرفی‌شده هم ۸٪ تخفیف
              اولین سفارش می‌گیرد.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="brand" icon="users">{faNum(mockLoyalty.referralCount)} معرفی موفق</Badge>
              <Badge tone="success" icon="wallet">{toman(mockLoyalty.referralEarnings, false)} تومان اعتبار</Badge>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">کیف پول و اعتبار خرید</p>
            <div className="space-y-2 text-[12px]">
              <Row label="موجودی کیف پول" value={toman(customer?.walletBalance ?? 0, false)} />
              <Row label="سقف اعتبار" value={toman(customer?.creditLimit ?? 0, false)} />
              <Row label="اعتبار مصرف‌شده" value={toman(customer?.creditUsed ?? 0, false)} />
              <Row label="مانده قابل استفاده" value={toman(Math.max(0, (customer?.creditLimit ?? 0) - (customer?.creditUsed ?? 0)), false)} />
            </div>
            <div className="mt-3">
              <Progress
                value={((customer?.creditUsed ?? 0) / Math.max(1, customer?.creditLimit ?? 1)) * 100}
                color="#f9a307"
                label="میزان مصرف سقف اعتبار"
              />
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">آمار وفاداری شما</p>
            <div className="space-y-2 text-[12px]">
              <Row label="تعداد سفارش" value={faNum(myOrders.length)} />
              <Row label="میانگین ارزش سفارش" value={toman(customer?.avgOrderValue ?? 0, false)} />
              <Row label="ارزش طول عمر خرید" value={toman(customer?.ltv ?? 0, false)} />
              <Row label="خرید ماهانه" value={`${faNum(customer?.monthlyOrders ?? 0)} بار`} />
            </div>
          </Card>

          {myOrders.length === 0 && <EmptyState icon="package" title="هنوز سفارشی ثبت نکرده‌اید" description="با اولین سفارش، امتیاز باشگاه فعال می‌شود." />}
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-ink-500 dark:text-ink-400">{label}</span>
    <span className="num font-semibold">{value}</span>
  </div>
);

export default Loyalty;
