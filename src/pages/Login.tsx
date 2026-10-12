import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Card, DemoNote, Field, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { BrandMark, KarenSoftLogo } from '@/components/BrandLogo';
import { useStore, useBrands, useCustomers } from '@/store/useStore';
import { faNum, tomanShort, toFa } from '@/lib/format';

const Login = () => {
  const loginCustomer = useStore((s) => s.loginCustomer);
  const loginAsCustomer = useStore((s) => s.loginAsCustomer);
  const demoLoginCustomer = useStore((s) => s.demoLoginCustomer);
  const customer = useStore((s) => s.customer);
  const brands = useBrands();
  const customers = useCustomers();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [error, setError] = useState('');

  const sendCode = () => {
    const digits = toFa(mobile.replace(/\D/g, ''));
    if (digits.length !== 11 || !digits.startsWith('09')) {
      setError('شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۰۰۰۰۰۰۱');
      return;
    }
    setError('');
    setStep('code');
    toast('کد تأیید نمایشی: ۱۲۳۴۵۶');
  };

  const submit = () => {
    const res = loginCustomer(mobile, code);
    if (res.ok) {
      toast(res.message);
      navigate('/account');
    } else {
      setError(res.message);
    }
  };

  const quickLogin = (index: number) => {
    loginAsCustomer(customers[index].id);
    toast(`ورود نمایشی به حساب «${customers[index].storeName}»`);
    navigate('/account');
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 lg:grid-cols-[1fr_1.1fr]">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="gradient-brand flex h-12 w-12 items-center justify-center rounded-2xl text-white">
            <Icon name="login" className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-base font-extrabold">ورود به حساب فروشگاهی</h1>
            <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
              حساب عمده‌فروشی برای مشاهده قیمت‌های عمده، سقف اعتبار و ثبت سفارش لازم است.
            </p>
          </div>
        </div>

        {customer ? (
          <div className="rounded-xl2 border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-900/20">
            <p className="text-[12.5px] font-extrabold text-brand-900 dark:text-brand-100">
              شما وارد حساب «{customer.storeName}» شده‌اید
            </p>
            <p className="num mt-1 text-[11.5px] text-brand-800 dark:text-brand-200">
              سطح {customer.tier} • سقف اعتبار {tomanShort(customer.creditLimit)} • امتیاز باشگاه {faNum(customer.loyaltyPoints)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/catalog" className="btn-primary btn-sm">
                <Icon name="grid" className="h-4 w-4" />
                رفتن به کاتالوگ عمده
              </Link>
              <Link to="/account" className="btn-ghost btn-sm">
                حساب کاربری من
              </Link>
            </div>
          </div>
        ) : (
          <>
            {step === 'mobile' ? (
              <div className="space-y-3">
                <Field label="شماره موبایل مدیر خرید" required hint="در این دمو هر شماره معتبر پذیرفته می‌شود.">
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="input num text-center text-[15px] tracking-widest"
                    placeholder="۰۹۱۲۰۰۰۰۰۰۱"
                    inputMode="numeric"
                    dir="ltr"
                  />
                </Field>
                <button className="btn-primary w-full" onClick={sendCode}>
                  <Icon name="message" className="h-4 w-4" />
                  دریافت کد تأیید
                </button>
                <button className="btn-soft w-full" onClick={() => { demoLoginCustomer(); toast('ورود سریع دمو انجام شد'); navigate('/account'); }}>
                  <Icon name="rocket" className="h-4 w-4" />
                  ورود سریع دمو (بدون شماره)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="num text-[12px] text-ink-500 dark:text-ink-400">
                  کد ۶ رقمی ارسال‌شده به {toFa(mobile)} را وارد کنید. (کد دمو: <span className="font-extrabold">۱۲۳۴۵۶</span>)
                </p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input num text-center text-[18px] tracking-[0.5em]"
                  placeholder="------"
                  inputMode="numeric"
                  maxLength={6}
                  dir="ltr"
                />
                <button className="btn-primary w-full" onClick={submit}>
                  <Icon name="check" className="h-4 w-4" />
                  ورود به حساب
                </button>
                <div className="flex items-center justify-between">
                  <button className="btn-ghost btn-sm" onClick={() => setStep('mobile')}>
                    <Icon name="undo" className="h-3.5 w-3.5" />
                    تغییر شماره
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => toast('کد تأیید دوباره ارسال شد (نمایشی)')}>
                    ارسال مجدد کد
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11.5px] font-semibold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                {error}
              </p>
            )}

            <DemoNote>
              در این نسخه دمو، احراز هویت کاملاً سمت مرورگر شبیه‌سازی می‌شود؛ پیامکی ارسال نمی‌گردد و اطلاعات
              مشتریان نمونه از داده Mock خوانده می‌شود.
            </DemoNote>
          </>
        )}

        <div className="border-t border-ink-100 pt-3 dark:border-ink-800">
          <p className="mb-2 text-[12px] font-extrabold">ورود با حساب‌های نمایشی</p>
          <div className="space-y-2">
            {customers.slice(0, 3).map((c, i) => (
              <button
                key={c.id}
                onClick={() => quickLogin(i)}
                className="flex w-full items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-right transition hover:border-brand-400 dark:border-ink-700"
              >
                <span className="min-w-0">
                  <span className="block text-[12px] font-bold">{c.storeName}</span>
                  <span className="num block text-[10.5px] text-ink-400">
                    {c.city} • {c.kind} • سطح {c.tier}
                  </span>
                </span>
                <Badge tone={c.tier === 'VIP' ? 'vip' : c.tier === 'A' ? 'brand' : 'neutral'}>سقف {tomanShort(c.creditLimit)}</Badge>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
            <Link to="/admin/login" className="btn-ghost btn-sm">
              <Icon name="shield" className="h-4 w-4" />
              ورود مدیران و تیم فروش
            </Link>
            <Link to="/rep" className="btn-ghost btn-sm">
              <Icon name="map" className="h-4 w-4" />
              اپلیکیشن ویزیتور
            </Link>
            <Link to="/driver" className="btn-ghost btn-sm">
              <Icon name="truck" className="h-4 w-4" />
              اپلیکیشن راننده
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="gradient-brand text-white">
          <p className="text-[13px] font-extrabold">چرا حساب عمده؟</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {[
              ['نرخ‌نامه پله‌ای عمده', 'قیمت هر کارتن با افزایش حجم خرید کاهش می‌یابد.', 'tag'],
              ['خرید اعتباری و چکی', 'تا ۴۵ روز مهلت تسویه با سقف اختصاصی هر فروشگاه.', 'wallet'],
              ['سفارش دوره‌ای خودکار', 'سبد همیشگی فروشگاه در بازه مشخص تکرار می‌شود.', 'repeat'],
              ['پشتیبانی و فاکتور رسمی', 'فاکتور رسمی، سامانه مودیان و تسویه شفاف.', 'receipt'],
            ].map(([t, d, icon]) => (
              <div key={t} className="rounded-xl2 bg-white/10 p-3">
                <span className="flex items-center gap-2 text-[12px] font-bold">
                  <Icon name={icon} className="h-4 w-4" />
                  {t}
                </span>
                <p className="mt-1 text-[11px] leading-5 text-white/80">{d}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">برندهای موجود در پلتفرم</p>
          <div className="flex flex-wrap gap-2">
            {brands.slice(0, 24).map((b) => (
              <BrandMark key={b.id} brand={b} size={38} rounded />
            ))}
          </div>
          <p className="num mt-3 text-[11px] text-ink-400">
            {faNum(brands.length)} برند ایرانی و بین‌المللی دارای مجوز — دسترسی پس از ورود به حساب
          </p>
        </Card>

        <div className="flex items-center justify-center gap-3 text-[11px] text-ink-400">
          <KarenSoftLogo size={26} />
          <span>
            طراحی و توسعه توسط{' '}
            <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold text-brand-700 dark:text-brand-300">
              کارن سافت
            </a>{' '}
            — Karen-soft.ir
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
