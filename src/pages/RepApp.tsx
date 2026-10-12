import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, Progress, SectionTitle, Stat, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KarenSoftLogo } from '@/components/BrandLogo';
import { faNum, jalaliDate, timeAgo, toman, tomanShort } from '@/lib/format';
import { leads, visits } from '@/data/crm';
import { customers, orders } from '@/data/ops';
import { adminUsers } from '@/data/crm';

/**
 * اپلیکیشن فروشنده / ویزیتور (Mock)
 * صفحه مستقل با چیدمان موبایل‌محور برای نمایش در دمو
 */
const RepApp = () => {
  const rep = adminUsers.find((u) => u.roleId === 'rep')!;
  const [tab, setTab] = useState('route');
  const { toast } = useToast();
  const myLeads = leads.filter((l) => l.assignedRepId === rep.id);
  const myVisits = visits.filter((v) => v.repId === rep.id);
  const myCustomers = customers.filter((c) => c.assignedRepId === rep.id);
  const todayVisits = myVisits.slice(0, 5);
  const todayOrders = orders.filter((o) => o.repId === rep.id).slice(0, 4);
  const target = 400_000_000;
  const achieved = todayOrders.reduce((s, o) => s + o.grandTotal, 0) + 168_000_000;

  return (
    <div className="min-h-dvh bg-ink-100 dark:bg-ink-950">
      <div className="mx-auto max-w-md bg-white pb-24 shadow-pop dark:bg-ink-900">
        <header className="gradient-brand px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Icon name="userCheck" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">اپ فروشنده بازارعمده</p>
                <p className="text-[10.5px] opacity-90">{rep.fullName} • {rep.city} • نسخه دمو</p>
              </div>
            </div>
            <Link to="/" className="rounded-xl bg-white/20 px-2.5 py-1.5 text-[11px] font-bold">
              خروج
            </Link>
          </div>

          <div className="mt-4 rounded-xl2 bg-white/12 p-3 backdrop-blur">
            <div className="flex items-center justify-between text-[11.5px]">
              <span>هدف فروش امروز</span>
              <span className="num font-extrabold">{tomanShort(achieved)} از {tomanShort(target)}</span>
            </div>
            <div className="mt-2">
              <Progress value={(achieved / target) * 100} color="#ffffff" />
            </div>
            <p className="num mt-2 text-[10.5px] opacity-90">
              {faNum(todayVisits.length)} ویزیت برنامه‌ریزی‌شده • {faNum(todayOrders.length)} سفارش ثبت‌شده امروز
            </p>
          </div>
        </header>

        <div className="space-y-3 p-4">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="سرنخ‌های من" value={faNum(myLeads.length)} icon="rocket" />
            <Stat label="مشتریان فعال" value={faNum(myCustomers.length)} icon="users" tone="info" />
          </div>

          <Tabs
            size="sm"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'route', label: 'مسیر امروز', icon: 'route' },
              { id: 'leads', label: 'سرنخ‌ها', icon: 'rocket', count: myLeads.length },
              { id: 'orders', label: 'سفارش‌ها', icon: 'package' },
              { id: 'targets', label: 'عملکرد', icon: 'chart' },
            ]}
          />

          {tab === 'route' && (
            <div className="space-y-2">
              {todayVisits.map((v, i) => (
                <Card key={v.id} className="p-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-brand-600 text-[12px] font-extrabold text-white">
                      {faNum(i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-extrabold">{v.customerName}</p>
                      <p className="num text-[10.5px] text-ink-500 dark:text-ink-400">
                        {v.purpose} • {v.distanceKm} کیلومتر • وضعیت: {v.status === 'done' ? 'انجام‌شده' : v.status === 'planned' ? 'برنامه‌ریزی‌شده' : 'لغو/جامانده'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge tone={v.status === 'done' ? 'success' : 'warning'}>{v.status === 'done' ? 'انجام‌شده' : 'در انتظار'}</Badge>
                        {v.orderPlaced && <Badge tone="brand" icon="package">{toman(v.orderAmount, false)} تومان</Badge>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          className="btn-soft btn-sm"
                          onClick={() => toast('مسیریابی در نسخه دمو غیرفعال است (نمایشی)', 'info')}
                        >
                          <Icon name="route" className="h-3.5 w-3.5" />
                          مسیریابی
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => toast('ویزیت ثبت شد (نمایشی)')}>
                          <Icon name="check" className="h-3.5 w-3.5" />
                          ثبت ویزیت
                        </button>
                        <button className="btn-ghost btn-sm" onClick={() => toast('فرم ثبت سفارش در نسخه دمو نمایشی است', 'info')}>
                          <Icon name="cart" className="h-3.5 w-3.5" />
                          ثبت سفارش
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Card className="p-3">
                <p className="text-[12px] font-extrabold">خلاصه مسیر</p>
                <p className="num mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                  {faNum(todayVisits.reduce((s, v) => s + v.distanceKm, 0))} کیلومتر • بازه زمانی ۸:۰۰ تا ۱۷:۳۰ • منطقه {rep.city}
                </p>
                <div className="mt-2 rounded-xl bg-ink-50 p-2.5 text-[10.5px] text-ink-500 dark:bg-ink-800/60 dark:text-ink-400">
                  مسیریاب در این دمو به‌صورت Mock نمایش داده می‌شود؛ در نسخه عملیاتی مسیر بهینه بر اساس ترافیک و بازه
                  زمانی مشتریان محاسبه می‌شود.
                </div>
              </Card>
            </div>
          )}

          {tab === 'leads' && (
            <div className="space-y-2">
              {myLeads.slice(0, 8).map((l) => (
                <Card key={l.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-extrabold">{l.storeName}</p>
                      <p className="text-[10.5px] text-ink-500 dark:text-ink-400">
                        {l.kind} • {l.city} • منبع: {l.source}
                      </p>
                    </div>
                    <Badge tone={l.score > 70 ? 'success' : l.score > 45 ? 'warning' : 'neutral'}>
                      امتیاز {faNum(l.score)}
                    </Badge>
                  </div>
                  <p className="num mt-2 text-[11px] text-ink-600 dark:text-ink-300">
                    ارزش تخمینی: {toman(l.estimatedValue, false)} تومان • آخرین فعالیت: {timeAgo(l.lastActivity)}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button className="btn-soft btn-sm" onClick={() => toast('تماس در نسخه دمو شبیه‌سازی شده است', 'info')}>
                      <Icon name="phone" className="h-3.5 w-3.5" />
                      تماس
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => toast('سرنخ به مرحله مذاکره منتقل شد (نمایشی)')}>
                      انتقال به مذاکره
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-2">
              {orders.slice(0, 8).map((o) => (
                <Card key={o.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="num text-[12px] font-extrabold">{o.code}</span>
                    <Badge tone={o.status === 'delivered' ? 'success' : 'info'}>
                      {o.status === 'delivered' ? 'تحویل‌شده' : o.status === 'canceled' ? 'لغوشده' : 'در جریان'}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-[11.5px]">{o.customerName}</p>
                  <p className="num mt-0.5 text-[10.5px] text-ink-500 dark:text-ink-400">
                    {jalaliDate(o.createdAt)} • {faNum(o.items.length)} قلم • {toman(o.grandTotal, false)} تومان
                  </p>
                </Card>
              ))}
            </div>
          )}

          {tab === 'targets' && (
            <div className="space-y-3">
              <Card className="p-3">
                <p className="mb-2 text-[12.5px] font-extrabold">عملکرد ماه جاری (نمایشی)</p>
                <div className="space-y-3">
                  <Progress value={78} label="۷۸٪ تحقق هدف فروش ماه" />
                  <Progress value={92} color="#1d4ed8" label="۹۲٪ تحقق تعداد ویزیت" />
                  <Progress value={64} color="#f9a307" label="۶۴٪ تبدیل سرنخ به مشتری" />
                  <Progress value={88} color="#6d28d9" label="۸۸٪ رضایت مشتریان منطقه" />
                </div>
              </Card>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="فروش ماه" value={tomanShort(2_840_000_000)} icon="chart" tone="brand" />
                <Stat label="کمیسیون تخمینی" value={tomanShort(56_800_000)} icon="wallet" tone="accent" />
              </div>
              <Card className="p-3">
                <p className="text-[12px] font-extrabold">یادآوری‌ها</p>
                <ul className="mt-2 space-y-1.5 text-[11px] text-ink-600 dark:text-ink-300">
                  <li className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5 text-accent-500" /> پیگیری وصول چک «پخش کاسپین» تا فردا</li>
                  <li className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5 text-accent-500" /> ارسال لیست قیمت جدید به ۵ مشتری</li>
                  <li className="flex items-center gap-1.5"><Icon name="clock" className="h-3.5 w-3.5 text-accent-500" /> معرفی کمپین رمضان به رستوران‌ها</li>
                </ul>
              </Card>
            </div>
          )}

          <SectionTitle title="درباره این اپ" subtitle="اپلیکیشن همراه فروشنده — نسخه نمایشی" icon="info" />
          <Card className="p-3">
            <p className="text-[11px] leading-6 text-ink-500 dark:text-ink-400">
              این صفحه، شبیه‌سازی اپلیکیشن موبایل ویزیتور است: مسیر روز، ثبت ویزیت، مدیریت سرنخ، ثبت سفارش برای مشتری و
              پایش هدف فروش. در نسخه عملیاتی این قابلیت‌ها روی اپلیکیشن نیتیو/وب‌اپ با کارکرد آفلاین ارائه می‌شود.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <KarenSoftLogo size={26} />
              <span className="text-[10.5px] text-ink-400">
                طراحی و توسعه: کارن سافت —{' '}
                <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold text-brand-700 dark:text-brand-300">
                  Karen-soft.ir
                </a>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RepApp;
