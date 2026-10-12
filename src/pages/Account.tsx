import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, DemoNote, Field, Progress, SectionTitle, Stat, Switch, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { useOrders, useStore } from '@/store/useStore';
import { securityFeatures } from '@/data/content';

const Account = () => {
  const customer = useStore((s) => s.customer);
  const orders = useOrders();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const logout = useStore((s) => s.logout);
  const { toast } = useToast();
  const [tab, setTab] = useState('profile');
  const [smsNotif, setSmsNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  if (!customer) return null;
  const myOrders = orders.filter((o) => o.customerId === customer.id);
  const spent = myOrders.reduce((s, o) => s + o.grandTotal, 0);

  return (
    <div className="space-y-4">
      <SectionTitle title="حساب کاربری فروشگاه" subtitle={customer.storeName} icon="user" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="سطح مشتری" value={customer.tier} icon="crown" tone="vip" hint={customer.kind} />
        <Stat label="سفارش‌های ثبت‌شده" value={faNum(myOrders.length)} icon="package" />
        <Stat label="مجموع خرید" value={toman(spent, false)} unit="تومان" icon="wallet" tone="info" />
        <Stat label="امتیاز باشگاه" value={faNum(useStore.getState().loyaltyPoints)} icon="star" tone="accent" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'profile', label: 'پروفایل فروشگاه', icon: 'store' },
          { id: 'docs', label: 'مدارک و احراز هویت', icon: 'clipboard' },
          { id: 'finance', label: 'کیف پول و اعتبار', icon: 'wallet' },
          { id: 'security', label: 'امنیت و اعلان‌ها', icon: 'shield' },
        ]}
      />

      {tab === 'profile' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام فروشگاه">
                <input defaultValue={customer.storeName} className="input" />
              </Field>
              <Field label="نام مالک / مدیر">
                <input defaultValue={customer.ownerName} className="input" />
              </Field>
              <Field label="شماره موبایل">
                <input defaultValue={customer.mobile} className="input num" readOnly />
              </Field>
              <Field label="نوع فروشگاه">
                <input defaultValue={customer.kind} className="input" readOnly />
              </Field>
              <Field label="شهر">
                <input defaultValue={customer.city} className="input" />
              </Field>
              <Field label="استان">
                <input defaultValue={customer.province} className="input" readOnly />
              </Field>
              <Field label="کد اقتصادی / شناسه مالیاتی">
                <input defaultValue={customer.taxId} className="input num" />
              </Field>
              <Field label="کارشناس فروش اختصاصی">
                <input defaultValue={`${customer.assignedRepId} — سارا حسینی`} className="input" readOnly />
              </Field>
            </div>
            <Field label="آدرس انبار/فروشگاه برای تحویل">
              <textarea defaultValue={customer.address} rows={2} className="input" />
            </Field>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => toast('اطلاعات پروفایل ذخیره شد (نمایشی)')}>
                <Icon name="check" className="h-4 w-4" />
                ذخیره تغییرات
              </button>
              <Link to="/rfq" className="btn-ghost">
                <Icon name="clipboard" className="h-4 w-4" />
                ثبت درخواست استعلام
              </Link>
            </div>
          </Card>

          <div className="space-y-3">
            <Card>
              <p className="mb-2 text-[13px] font-extrabold">خلاصه اعتبار و امتیاز</p>
              <div className="space-y-2 text-[12px]">
                <Row label="کیف پول" value={toman(customer.walletBalance, false)} />
                <Row label="سقف اعتبار" value={toman(customer.creditLimit, false)} />
                <Row label="اعتبار مصرف‌شده" value={toman(customer.creditUsed, false)} />
                <Row label="ریسک ریزش (تحلیل نمایشی)" value={`${faNum(customer.churnRisk)}٪`} />
              </div>
              <div className="mt-3 space-y-3">
                <Progress value={(customer.creditUsed / customer.creditLimit) * 100} color="#f9a307" label="میزان مصرف اعتبار" />
                <Progress value={100 - customer.churnRisk} label="سلامت رابطه همکاری" />
              </div>
            </Card>
            <Card>
              <p className="mb-2 text-[13px] font-extrabold">وضعیت حساب</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge tone={customer.status === 'active' ? 'success' : 'warning'}>
                  {customer.status === 'active' ? 'فعال' : customer.status === 'pending' ? 'در انتظار تأیید' : 'معلق'}
                </Badge>
                <Badge tone={customer.docsStatus === 'verified' ? 'success' : customer.docsStatus === 'pending' ? 'warning' : 'danger'}>
                  مدارک: {customer.docsStatus === 'verified' ? 'تأییدشده' : customer.docsStatus === 'pending' ? 'در حال بررسی' : 'رد شده'}
                </Badge>
                <Badge tone="neutral">عضویت از {jalaliDate(customer.createdAt)}</Badge>
              </div>
              <button
                className="btn-ghost btn-sm mt-3 w-full"
                onClick={() => {
                  logout();
                  toast('از حساب خارج شدید', 'info');
                }}
              >
                <Icon name="logout" className="h-4 w-4" />
                خروج از حساب
              </button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <Card>
          <p className="mb-3 text-[13px] font-extrabold">مدارک صنفی و احراز هویت</p>
          <div className="space-y-2">
            {customer.docs.map((d) => (
              <div key={d.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-200 px-3 py-2.5 dark:border-ink-700">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-500 dark:bg-ink-800">
                    <Icon name="fileText" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold">{d.name}</p>
                    <p className="num text-[10.5px] text-ink-500 dark:text-ink-400">بارگذاری: {jalaliDate(d.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={d.status === 'verified' ? 'success' : d.status === 'pending' ? 'warning' : 'danger'}>
                    {d.status === 'verified' ? 'تأییدشده' : d.status === 'pending' ? 'در انتظار بررسی' : 'رد شده'}
                  </Badge>
                  <button className="btn-ghost btn-sm" onClick={() => toast('آپلود فایل در نسخه دمو غیرفعال است', 'info')}>
                    بارگذاری مجدد
                  </button>
                </div>
              </div>
            ))}
          </div>
          <DemoNote>
            در نسخه عملیاتی، مدارک پس از بارگذاری توسط کارشناس اعتبارسنجی بررسی و نتیجه به‌صورت پیامک اطلاع داده می‌شود.
          </DemoNote>
        </Card>
      )}

      {tab === 'finance' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="mb-3 text-[13px] font-extrabold">کیف پول</p>
            <p className="num text-2xl font-extrabold text-brand-800 dark:text-brand-200">{toman(customer.walletBalance)}</p>
            <p className="mt-1 text-[11.5px] text-ink-500 dark:text-ink-400">
              موجودی کیف پول برای پرداخت سفارش‌ها، تسویه مرجوعی‌ها و اعتبار معرفی مشتریان استفاده می‌شود.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary btn-sm" onClick={() => toast('درگاه افزایش موجودی در دمو غیرفعال است', 'info')}>
                افزایش موجودی
              </button>
              <button className="btn-ghost btn-sm" onClick={() => toast('صورت‌حساب کیف پول در گزارش‌ها قابل دریافت است', 'info')}>
                صورت‌حساب کیف پول
              </button>
            </div>
            <div className="mt-3 space-y-2 text-[11.5px]">
              {[
                ['تخفیف نقدی سفارش‌های اخیر', '+ ۱٫۲۴۰٫۰۰۰'],
                ['تسویه مرجوعی', '+ ۳۸۰٫۰۰۰'],
                ['اعتبار معرفی مشتری', '+ ۴۰۰٫۰۰۰'],
                ['پرداخت سفارش', '− ۲٫۱۰۰٫۰۰۰'],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between border-b border-dashed border-ink-200 py-1.5 dark:border-ink-700">
                  <span className="text-ink-500 dark:text-ink-400">{l}</span>
                  <span className="num font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-[13px] font-extrabold">تسهیلات و تسویه</p>
            <div className="space-y-2 text-[12px]">
              <Row label="روش تسویه پیش‌فرض" value={settings.settlementTerms[1]} />
              <Row label="سقف اعتبار تأییدشده" value={toman(customer.creditLimit, false)} />
              <Row label="مانده قابل استفاده" value={toman(Math.max(0, customer.creditLimit - customer.creditUsed), false)} />
              <Row label="مهلت تسویه پیش‌فرض" value={`${faNum(settings.creditDaysDefault)} روز`} />
              <Row label="مهلت چک" value={`${faNum(settings.chequeDays)} روز`} />
            </div>
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-[11.5px] leading-5 text-ink-600 dark:bg-ink-800/60 dark:text-ink-300">
              برای افزایش سقف اعتبار، مدارک مالی سال گذشته و چک تضمین را بارگذاری کنید. بررسی درخواست تا ۲ روز کاری
              انجام می‌شود.
            </div>
            <button className="btn-soft btn-sm mt-3" onClick={() => toast('درخواست افزایش اعتبار ثبت شد (نمایشی)')}>
              <Icon name="plus" className="h-4 w-4" />
              درخواست افزایش سقف اعتبار
            </button>
          </Card>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <p className="mb-2 text-[13px] font-extrabold">امنیت حساب</p>
            <Switch checked={twoFactor} onChange={setTwoFactor} label="ورود دو مرحله‌ای (2FA)" description="ارسال کد یکبارمصرف به موبایل در هر ورود" />
            <Switch checked={smsNotif} onChange={setSmsNotif} label="اعلان پیامکی" description="اطلاع‌رسانی وضعیت سفارش، سررسید چک و آفرها" />
            <Switch checked={emailNotif} onChange={setEmailNotif} label="اعلان ایمیلی" description="ارسال فاکتور و گزارش دوره‌ای خرید" />
            <Switch checked={theme === 'dark'} onChange={toggleTheme} label="حالت تاریک" description="نمایش رابط کاربری با تم تیره" />
            <Switch
              checked={settings.enableAuditLog}
              onChange={(v) => updateSettings({ enableAuditLog: v })}
              label="ثبت لاگ عملیات حساب"
              description="ثبت تمام تغییرات حساب برای پیگیری امنیتی"
            />
            <button className="btn-ghost btn-sm mt-3" onClick={() => toast('لینک تغییر رمز به موبایل ارسال شد (نمایشی)')}>
              <Icon name="key" className="h-4 w-4" />
              تغییر رمز عبور
            </button>
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">ویژگی‌های امنیتی پلتفرم</p>
            <div className="space-y-2">
              {securityFeatures.map((s) => (
                <div key={s.id} className="rounded-xl border border-ink-200 p-2.5 dark:border-ink-700">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold">{s.title}</p>
                    <Badge tone={s.enabled ? 'success' : 'neutral'}>{s.enabled ? 'فعال' : 'غیرفعال'}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{s.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-0.5">
    <span className="text-ink-500 dark:text-ink-400">{label}</span>
    <span className="num font-semibold">{value}</span>
  </div>
);

export default Account;
