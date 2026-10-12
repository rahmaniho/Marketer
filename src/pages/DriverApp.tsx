import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, Progress, Stat, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KarenSoftLogo } from '@/components/BrandLogo';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { shipments, drivers, orders } from '@/data/ops';

/**
 * اپلیکیشن راننده و تحویل (Mock)
 */
const DriverApp = () => {
  const driver = drivers[0];
  const [tab, setTab] = useState('today');
  const [delivered, setDelivered] = useState<string[]>([]);
  const { toast } = useToast();
  const myShipments = shipments.filter((s) => s.driverId === driver.id);
  const todayList = myShipments.length ? myShipments : shipments.slice(0, 5);

  return (
    <div className="min-h-dvh bg-ink-100 dark:bg-ink-950">
      <div className="mx-auto max-w-md bg-white pb-24 shadow-pop dark:bg-ink-900">
        <header className="gradient-brand px-4 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                <Icon name="truck" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">اپ راننده بازارعمده</p>
                <p className="num text-[10.5px] opacity-90">
                  {driver.name} • {driver.vehicle} • {driver.plate}
                </p>
              </div>
            </div>
            <Link to="/" className="rounded-xl bg-white/20 px-2.5 py-1.5 text-[11px] font-bold">
              خروج
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [faNum(todayList.length), 'توقف امروز'],
              [faNum(delivered.length), 'تحویل‌شده'],
              [faNum(driver.todayKm), 'کیلومتر'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-white/12 px-2 py-2 backdrop-blur">
                <p className="num text-[15px] font-extrabold">{v}</p>
                <p className="text-[10px] opacity-90">{l}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="space-y-3 p-4">
          <Card className="p-3">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-bold">پیشرفت مسیر امروز</span>
              <span className="num">{faNum(Math.round((delivered.length / Math.max(1, todayList.length)) * 100))}٪</span>
            </div>
            <div className="mt-2">
              <Progress value={(delivered.length / Math.max(1, todayList.length)) * 100} />
            </div>
          </Card>

          <Tabs
            size="sm"
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'today', label: 'تحویل‌های امروز', icon: 'package' },
              { id: 'route', label: 'مسیر و بار', icon: 'route' },
              { id: 'pod', label: 'امضا و POD', icon: 'signature' },
              { id: 'expense', label: 'هزینه‌ها', icon: 'wallet' },
            ]}
          />

          {tab === 'today' && (
            <div className="space-y-2">
              {todayList.map((s, i) => {
                const order = orders.find((o) => o.id === s.orderId);
                const done = delivered.includes(s.id) || s.podSigned;
                return (
                  <Card key={s.id} className="p-3">
                    <div className="flex items-start gap-2.5">
                      <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl text-[12px] font-extrabold ${done ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600 dark:bg-ink-700 dark:text-ink-200'}`}>
                        {done ? <Icon name="check" className="h-4 w-4" /> : faNum(i + 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-extrabold">{s.customerName}</p>
                        <p className="num text-[10.5px] text-ink-500 dark:text-ink-400">
                          {s.code} • {s.city} • {faNum(s.weightKg)} کیلوگرم • {faNum(s.stops)} توقف
                        </p>
                        <p className="num mt-0.5 text-[10.5px] text-ink-500 dark:text-ink-400">
                          بازه: {order?.deliverySlot ?? '۹ تا ۱۲'} • مبلغ: {toman(order?.grandTotal ?? 0, false)} تومان
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone={done ? 'success' : 'warning'}>{done ? 'تحویل‌شده' : 'در انتظار'}</Badge>
                          {s.temperature && <Badge tone="info" icon="snow">{s.temperature}</Badge>}
                          {order?.paymentMethod === 'cash' && <Badge tone="accent">دریافت نقدی</Badge>}
                        </div>
                        {!done && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => {
                                setDelivered((d) => [...d, s.id]);
                                toast('تحویل ثبت شد و امضای گیرنده فعال شد');
                              }}
                            >
                              <Icon name="check" className="h-3.5 w-3.5" />
                              تأیید تحویل
                            </button>
                            <button className="btn-ghost btn-sm" onClick={() => toast('تماس با مشتری شبیه‌سازی شد', 'info')}>
                              <Icon name="phone" className="h-3.5 w-3.5" />
                              تماس
                            </button>
                            <button className="btn-ghost btn-sm" onClick={() => toast('درخواست لغو/تعویق ثبت شد (نمایشی)')}>
                              <Icon name="alert" className="h-3.5 w-3.5" />
                              عدم تحویل
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {tab === 'route' && (
            <div className="space-y-3">
              <Card className="p-3">
                <p className="text-[12.5px] font-extrabold">خلاصه بار و مسیر</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">ظرفیت خودرو</p>
                    <p className="num font-bold">{faNum(driver.capacityKg)} کیلوگرم</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">بارگیری‌شده</p>
                    <p className="num font-bold">{faNum(todayList.reduce((s, x) => s + x.weightKg, 0))} کیلوگرم</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">مسافت پیش‌بینی‌شده</p>
                    <p className="num font-bold">{faNum(driver.todayKm)} کیلومتر</p>
                  </div>
                  <div className="rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
                    <p className="text-ink-500 dark:text-ink-400">منطقه</p>
                    <p className="font-bold">{driver.zone}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-3">
                <p className="text-[12.5px] font-extrabold">نقشه مسیر (نمایشی)</p>
                <div className="relative mt-2 h-40 overflow-hidden rounded-xl border border-dashed border-ink-300 bg-ink-50 dark:border-ink-600 dark:bg-ink-800/60">
                  <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(90deg, #d9dee7 1px, transparent 1px), linear-gradient(#d9dee7 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                  <svg viewBox="0 0 320 160" className="absolute inset-0 h-full w-full">
                    <path d="M20 130 C80 120 90 60 150 70 C210 80 230 30 300 40" fill="none" stroke="#0f684c" strokeWidth="3" strokeDasharray="6 4" />
                    {[[20, 130], [150, 70], [300, 40]].map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="8" fill="#0f684c" />
                        <text x={x} y={y + 4} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">{i + 1}</text>
                      </g>
                    ))}
                  </svg>
                  <p className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-ink-600">
                    مسیریاب Mock — بدون اتصال به سرویس نقشه
                  </p>
                </div>
                <p className="mt-2 text-[10.5px] leading-5 text-ink-500 dark:text-ink-400">
                  در نسخه عملیاتی، مسیر بهینه بر اساس ترافیک، بازه زمانی مشتریان و ظرفیت خودرو محاسبه و روی نقشه
                  نمایش داده می‌شود.
                </p>
              </Card>
            </div>
          )}

          {tab === 'pod' && (
            <div className="space-y-3">
              <Card className="p-3">
                <p className="text-[12.5px] font-extrabold">امضای دیجیتال تحویل (POD)</p>
                <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                  در نسخه عملیاتی، مشتری روی صفحه راننده امضا می‌کند و تصویر بار و فاکتور امضاشده به پرونده سفارش
                  ضمیمه می‌شود.
                </p>
                <div className="mt-3 rounded-xl border-2 border-dashed border-ink-300 p-6 text-center dark:border-ink-600">
                  <Icon name="signature" className="mx-auto h-8 w-8 text-ink-400" />
                  <p className="mt-2 text-[11px] text-ink-400">محل امضای گیرنده (نمایشی)</p>
                </div>
                <button className="btn-primary mt-3 w-full" onClick={() => toast('امضا ثبت و به سفارش ضمیمه شد (نمایشی)')}>
                  <Icon name="check" className="h-4 w-4" />
                  ثبت امضا و پایان تحویل
                </button>
              </Card>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="تحویل موفق امروز" value={faNum(delivered.length || 3)} icon="check-circle" />
                <Stat label="رضایت مشتریان" value={`${faNum(driver.rating, 1)} از ۵`} icon="star" tone="accent" />
              </div>
            </div>
          )}

          {tab === 'expense' && (
            <div className="space-y-3">
              <Card className="p-3">
                <p className="text-[12.5px] font-extrabold">ثبت هزینه سفر (نمایشی)</p>
                <div className="mt-2 space-y-2">
                  {[
                    ['سوخت', '۱٫۸۵۰٫۰۰۰ تومان', 'تأییدشده'],
                    ['عوارض آزادراه', '۳۲۰٫۰۰۰ تومان', 'در انتظار تأیید'],
                    ['کرایه جرثقیل/تخلیه', '۹۵۰٫۰۰۰ تومان', 'تأییدشده'],
                  ].map(([t, a, s]) => (
                    <div key={t} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                      <span>{t}</span>
                      <span className="num font-bold">{a}</span>
                      <Badge tone={s === 'تأییدشده' ? 'success' : 'warning'}>{s}</Badge>
                    </div>
                  ))}
                </div>
                <button className="btn-soft mt-3 w-full" onClick={() => toast('فرم ثبت هزینه ارسال شد (نمایشی)')}>
                  <Icon name="plus" className="h-4 w-4" />
                  افزودن هزینه جدید
                </button>
              </Card>
              <Card className="p-3">
                <p className="text-[12.5px] font-extrabold">تسویه و کارانه</p>
                <p className="num mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                  کارانه امروز: {toman(4_250_000, false)} تومان • مجموع هفته: {toman(24_600_000, false)} تومان
                </p>
                <p className="num mt-1 text-[10.5px] text-ink-400">تاریخ: {jalaliDate(new Date())}</p>
              </Card>
            </div>
          )}

          <Card className="p-3">
            <p className="text-[11px] leading-6 text-ink-500 dark:text-ink-400">
              اپ راننده در این دمو کاملاً شبیه‌سازی‌شده است: لیست تحویل، مسیر، تأیید تحویل، امضای دیجیتال و ثبت هزینه
              سفر.
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

export default DriverApp;
