import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { Badge, useToast } from './ui';
import { KarenSoftLogo } from './BrandLogo';
import { useBrands, useOffers, useOrders, useProducts, useStore } from '@/store/useStore';
import { faNum, toman } from '@/lib/format';
import { searchSuggestions } from '@/lib/search';

const BRAND_NAME = 'بازارعمده';
const BRAND_TAGLINE = 'پلتفرم B2B عمده‌فروشی هوشمند صنایع غذایی';

// ─────────────────────────────────────────────────────────── Selected demo notice
export const DemoBar = () => (
  <div className="gradient-brand no-print text-white">
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-1.5 text-[11px] font-medium sm:text-xs">
      <span className="inline-flex items-center gap-1.5">
        <Icon name="sparkles" className="h-3.5 w-3.5" />
        نسخه دمو — تمام داده‌ها نمونه (Mock) و در مرورگر شما ذخیره می‌شود
      </span>
      <span className="hidden items-center gap-1.5 sm:inline-flex">
        <Icon name="key" className="h-3.5 w-3.5" />
        ورود دمو: هر شماره موبایل + کد ثابت ۱۲۳۴۵۶
      </span>
    </div>
  </div>
);

const NavItem = ({ to, label, icon }: { to: string; label: string; icon?: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
        isActive
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
          : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
      }`
    }
  >
    {icon && <Icon name={icon} className="h-4 w-4" />}
    {label}
  </NavLink>
);

// ─────────────────────────────────────────────────────────── Header search
const HeaderSearch = () => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const products = useProducts();
  const brands = useBrands();
  const addSearch = useStore((s) => s.addSearch);
  const suggestions = useMemo(() => searchSuggestions(q, products, brands), [q, products, brands]);

  const submit = (value: string) => {
    const term = value.trim();
    if (!term) return;
    addSearch(term);
    navigate(`/catalog?q=${encodeURIComponent(term)}`);
    setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        role="search"
        className="relative"
      >
        <Icon name="search" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="جست‌وجوی کالا، برند یا بارکد… (مثلاً: رب مهرام یا ۶۲۱۰۰۰۰۰۰۰۰۰)"
          aria-label="جست‌وجوی محصولات"
          className="input pr-10"
        />
      </form>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 rounded-xl border border-ink-200 bg-white p-2 shadow-pop dark:border-ink-700 dark:bg-ink-900">
          <p className="px-2 py-1 text-[11px] font-bold text-ink-400">پیشنهاد جست‌وجو</p>
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={() => submit(s)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-right text-[13px] text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              <Icon name="search" className="h-3.5 w-3.5 text-ink-400" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────── Customer layout
export const CustomerLayout = () => {
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationsRead);
  const [menu, setMenu] = useState(false);
  const [notif, setNotif] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const offers = useOffers();
  const orders = useOrders();

  const cartCount = cart.reduce((s, l) => s + l.qty, 0);
  const unread = notifications.filter((n) => !n.read && (n.audience === 'customer' || n.audience === 'both')).length;
  const myOrders = orders.filter((o) => customer && o.customerId === customer.id).length;
  const wallet = toman(customer?.walletBalance ?? 0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${BRAND_NAME} | ${BRAND_TAGLINE}`;
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBar />
      <header className="no-print sticky top-0 z-50 border-b border-ink-200/80 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5">
          <Link to="/" className="flex flex-none items-center gap-2">
            <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm">
              <Icon name="cart" className="h-5 w-5" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[15px] font-extrabold text-ink-900 dark:text-ink-50">{BRAND_NAME}</span>
              <span className="block text-[10px] text-ink-500 dark:text-ink-400">عمده‌فروشی هوشمند مواد غذایی</span>
            </span>
          </Link>

          <div className="hidden flex-1 lg:flex">
            <HeaderSearch />
          </div>
          <div className="flex-1 lg:hidden" />

          <div className="flex flex-none items-center gap-1.5">
            <Link to="/catalog" className="btn-ghost btn-sm hidden xl:inline-flex">
              <Icon name="grid" className="h-4 w-4" />
              کاتالوگ
            </Link>
            <Link to="/catalog?offers=1" className="btn-ghost btn-sm hidden xl:inline-flex">
              <Icon name="tag" className="h-4 w-4" />
              آفرها
              <Badge tone="danger" className="mr-0.5">{faNum(offers.filter((o) => o.isActive).length)}</Badge>
            </Link>

            <button onClick={toggleTheme} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800" aria-label="تغییر تم روشن/تاریک">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setNotif((v) => !v);
                  if (!notif) setTimeout(markRead, 1200);
                }}
                className="relative rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" className="h-5 w-5" />
                {unread > 0 && (
                  <span className="num absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {faNum(unread)}
                  </span>
                )}
              </button>
              {notif && (
                <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-ink-200 bg-white p-2 shadow-pop dark:border-ink-700 dark:bg-ink-900">
                  <p className="px-2 py-1 text-[11px] font-bold text-ink-400">اعلان‌های اخیر</p>
                  {notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-ink-50 dark:hover:bg-ink-800">
                      <p className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">{n.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link to="/cart" className="btn-primary btn-sm relative">
              <Icon name="cart" className="h-4 w-4" />
              <span className="hidden sm:inline">سبد خرید</span>
              {cartCount > 0 && (
                <span className="num rounded-md bg-white/25 px-1.5 text-[11px] font-bold">{faNum(cartCount)}</span>
              )}
            </Link>

            <button onClick={() => setMenu((v) => !v)} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-ink-800" aria-label="منو">
              <Icon name={menu ? 'x' : 'menu'} className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-auto hidden max-w-[1400px] px-4 pb-2 lg:block">
          <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            <NavItem to="/" label="خانه" icon="home" />
            <NavItem to="/catalog" label="کاتالوگ کالا" icon="grid" />
            <NavItem to="/brands" label="برندها" icon="badge" />
            <NavItem to="/categories" label="دسته‌بندی‌ها" icon="layers" />
            <NavItem to="/offers" label="آفرها و کمپین‌ها" icon="tag" />
            <NavItem to="/rfq" label="استعلام قیمت (RFQ)" icon="clipboard" />
            <NavItem to="/academy" label="آکادمی" icon="award" />
            <NavItem to="/forum" label="انجمن" icon="users" />
            <NavItem to="/sustainability" label="پایداری" icon="leaf" />
            <NavItem to="/about" label="درباره ما" icon="info" />
          </nav>
        </div>
      </header>

      {menu && (
        <div className="no-print border-b border-ink-200 bg-white px-4 py-3 lg:hidden dark:border-ink-800 dark:bg-ink-950">
          <div className="mb-2 lg:hidden">
            <HeaderSearch />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['/', 'خانه', 'home'],
              ['/catalog', 'کاتالوگ کالا', 'grid'],
              ['/brands', 'برندها', 'badge'],
              ['/categories', 'دسته‌بندی‌ها', 'layers'],
              ['/offers', 'آفرها', 'tag'],
              ['/orders', 'سفارش‌های من', 'package'],
              ['/rfq', 'استعلام قیمت', 'clipboard'],
              ['/loyalty', 'باشگاه مشتریان', 'crown'],
              ['/subscriptions', 'سفارش دوره‌ای', 'repeat'],
              ['/compare', 'مقایسه کالا', 'sliders'],
              ['/favorites', 'علاقه‌مندی‌ها', 'heart'],
              ['/chat', 'پشتیبانی آنلاین', 'message'],
              ['/academy', 'آکادمی و بلاگ', 'award'],
              ['/forum', 'انجمن گفت‌وگو', 'users'],
              ['/sustainability', 'پایداری', 'leaf'],
              ['/about', 'درباره ما', 'info'],
            ].map(([to, label, icon]) => (
              <NavItem key={to} to={to} label={label} icon={icon} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Link to="/admin" className="btn-ghost btn-sm">
              <Icon name="shield" className="h-4 w-4" />
              پنل ادمین
            </Link>
            <Link to="/driver" className="btn-ghost btn-sm">
              <Icon name="truck" className="h-4 w-4" />
              اپ راننده
            </Link>
            <Link to="/rep" className="btn-ghost btn-sm">
              <Icon name="userCheck" className="h-4 w-4" />
              اپ فروشنده
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-24 pt-5 lg:pb-10">
        <Outlet />
      </main>

      <Footer cartCount={cartCount} myOrders={myOrders} wallet={wallet} />

      {/* نوار پایین موبایل */}
      <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden dark:border-ink-800 dark:bg-ink-950/95">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 py-1.5">
          {[
            ['/', 'خانه', 'home'],
            ['/catalog', 'کاتالوگ', 'grid'],
            ['/compare', 'مقایسه', 'sliders'],
            ['/orders', 'سفارش‌ها', 'package'],
            ['/account', 'حساب من', 'user'],
          ].map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold ${
                  isActive ? 'text-brand-700 dark:text-brand-300' : 'text-ink-500 dark:text-ink-400'
                }`
              }
            >
              <Icon name={icon} className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

// ─────────────────────────────────────────────────────────── Footer
const Footer = ({ cartCount, myOrders, wallet }: { cartCount: number; myOrders: number; wallet: string }) => {
  const resetDemo = useStore((s) => s.resetDemo);
  const { toast } = useToast();
  return (
    <footer className="no-print mt-8 border-t border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="gradient-brand flex h-10 w-10 items-center justify-center rounded-2xl text-white">
                <Icon name="cart" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink-900 dark:text-ink-50">{BRAND_NAME}</p>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">{BRAND_TAGLINE}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">
              اتصال مستقیم تأمین‌کننده و پخش‌کننده به سوپرمارکت، رستوران، کافه، قنادی و عمده‌فروش؛ با حذف واسطه‌های
              غیرضروری و بازاریاب فیزیکی، قیمت تمام‌شده تأمین را کاهش می‌دهد.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="brand" icon="shield">IRC / وزارت بهداشت</Badge>
              <Badge tone="success" icon="leaf">گواهی حلال و ارگانیک</Badge>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-extrabold text-ink-900 dark:text-ink-100">دسترسی سریع</p>
            <ul className="space-y-1.5 text-[12px] text-ink-600 dark:text-ink-300">
              {[
                ['/catalog', 'کاتالوگ عمده کالا'],
                ['/brands', 'برندهای ایرانی و وارداتی'],
                ['/offers', 'آفرها و کمپین‌ها'],
                ['/rfq', 'درخواست استعلام قیمت'],
                ['/subscriptions', 'سفارش دوره‌ای و امانی'],
                ['/group-buy', 'خرید گروهی فروشگاه‌ها'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-brand-700 dark:hover:text-brand-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-extrabold text-ink-900 dark:text-ink-100">پنل‌های نمایشی</p>
            <ul className="space-y-1.5 text-[12px] text-ink-600 dark:text-ink-300">
              {[
                ['/admin', 'پنل مدیریت و BI'],
                ['/admin/supplier-portal', 'پورتال تأمین‌کننده'],
                ['/rep', 'اپ فروشنده / ویزیتور'],
                ['/driver', 'اپ راننده و تحویل'],
                ['/admin/integrations', 'یکپارچه‌سازی و API'],
                ['/admin/compliance', 'انطباق و مجوزها'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-brand-700 dark:hover:text-brand-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-extrabold text-ink-900 dark:text-ink-100">وضعیت دمو</p>
            <div className="space-y-2 text-[12px] text-ink-600 dark:text-ink-300">
              <p className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-900">
                <span>اقلام سبد خرید</span>
                <span className="num font-bold">{faNum(cartCount)}</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-900">
                <span>سفارش‌های شما</span>
                <span className="num font-bold">{faNum(myOrders)}</span>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-ink-900">
                <span>موجودی کیف پول</span>
                <span className="num font-bold">{wallet}</span>
              </p>
              <button
                className="btn-ghost btn-sm w-full"
                onClick={() => {
                  resetDemo();
                  toast('داده‌های نمایشی بازنشانی شد');
                }}
              >
                <Icon name="refresh" className="h-3.5 w-3.5" />
                بازنشانی داده‌های دمو
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-ink-200 pt-6 dark:border-ink-800 sm:flex-row">
          <div className="flex items-center gap-3">
            <KarenSoftLogo size={30} />
            <div className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
              <p>
                طراحی و توسعه توسط{' '}
                <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold text-brand-700 hover:underline dark:text-brand-300">
                  کارن سافت
                </a>{' '}
                — Karen-soft.ir
              </p>
              <p className="mt-0.5">© ۱۴۰۴ کارن سافت — نسخه دموی نمایشی، تمامی حقوق محفوظ است.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-ink-500 dark:text-ink-400">
            <Badge tone="neutral" icon="check">PWA آماده نصب</Badge>
            <Badge tone="neutral" icon="globe">GitHub Pages</Badge>
            <Badge tone="neutral" icon="shield">Static Export</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ─────────────────────────────────────────────────────────── Admin layout
const ADMIN_NAV: { group: string; items: [string, string, string][] }[] = [
  {
    group: 'فروش و بازاریابی',
    items: [
      ['/admin', 'داشبورد تحلیلی', 'chart'],
      ['/admin/orders', 'مدیریت سفارش‌ها', 'package'],
      ['/admin/customers', 'مشتریان و مدارک', 'users'],
      ['/admin/offers', 'کمپین و آفرها', 'tag'],
      ['/admin/rfq', 'استعلام قیمت', 'clipboard'],
      ['/admin/leads', 'سرنخ‌های فروش', 'rocket'],
      ['/admin/visits', 'ویزیت میدانی', 'location'],
      ['/admin/contracts', 'قرارداد قیمت پیمانی', 'signature'],
    ],
  },
  {
    group: 'کاتالوگ و انبار',
    items: [
      ['/admin/products', 'مدیریت محصولات', 'grid'],
      ['/admin/brands', 'مدیریت برندها', 'badge'],
      ['/admin/warehouse', 'انبار، بچ و موجودی', 'warehouse'],
      ['/admin/suppliers', 'تأمین‌کنندگان', 'truck'],
      ['/admin/logistics', 'حمل، مسیر و POD', 'route'],
    ],
  },
  {
    group: 'هوش و گزارش',
    items: [
      ['/admin/bi', 'داشبورد هوشمند (BI)', 'sparkles'],
      ['/admin/reports', 'گزارش‌گیری و خروجی', 'sheet'],
      ['/admin/tickets', 'تیکت و بازخورد', 'message'],
      ['/admin/notifications', 'اطلاع‌رسانی', 'bell'],
    ],
  },
  {
    group: 'سیستم',
    items: [
      ['/admin/users', 'کاربران و نقش‌ها (RBAC)', 'shield'],
      ['/admin/audit', 'لاگ عملیات', 'list'],
      ['/admin/integrations', 'یکپارچه‌سازی و API', 'globe'],
      ['/admin/compliance', 'انطباق و مجوزها', 'check-circle'],
      ['/admin/settings', 'تنظیمات پلتفرم', 'settings'],
      ['/admin/supplier-portal', 'پورتال تأمین‌کننده', 'server'],
    ],
  },
];

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const admin = useStore((s) => s.admin);
  const logout = useStore((s) => s.logout);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const orders = useOrders();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    document.title = `پنل مدیریت | ${BRAND_NAME}`;
  }, []);

  if (!admin) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="card w-full max-w-md p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <Icon name="shield" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold">ورود به پنل مدیریت</h1>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
            این دمو دارای احراز هویت شبیه‌سازی‌شده با ۷ نقش و دسترسی‌های RBAC است.
          </p>
          <Link to="/admin/login" className="btn-primary mt-5 w-full">
            <Icon name="login" className="h-4 w-4" />
            ورود به پنل مدیریت
          </Link>
          <Link to="/" className="btn-ghost mt-2 w-full">
            بازگشت به سایت مشتری
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-ink-50 dark:bg-ink-950">
      {/* سایدبار */}
      <aside
        className={`no-print fixed inset-y-0 right-0 z-[70] w-72 overflow-y-auto border-l border-ink-200 bg-white transition-transform dark:border-ink-800 dark:bg-ink-900 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="gradient-brand flex items-center gap-2.5 px-4 py-4 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold">پنل مدیریت {BRAND_NAME}</p>
            <p className="truncate text-[10px] opacity-90">
              {admin.fullName} • {admin.roleId}
            </p>
          </div>
          <button onClick={() => setOpen(false)} className="mr-auto rounded-lg p-1.5 hover:bg-white/20 lg:hidden" aria-label="بستن منو">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3">
          {ADMIN_NAV.map((group) => (
            <div key={group.group} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wide text-ink-400">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map(([to, label, icon]) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/admin'}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] font-semibold transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                          : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                      }`
                    }
                  >
                    <Icon name={icon} className="h-4 w-4" />
                    <span className="flex-1">{label}</span>
                    {to === '/admin/orders' && (
                      <span className="num rounded-md bg-ink-100 px-1.5 text-[10px] dark:bg-ink-800">{faNum(orders.length)}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-xl bg-ink-50 p-3 dark:bg-ink-800/60">
            <p className="text-[11px] font-bold text-ink-600 dark:text-ink-300">اپلیکیشن‌های همراه</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/rep" className="btn-ghost btn-sm justify-start">
                <Icon name="userCheck" className="h-3.5 w-3.5" />
                اپ فروشنده (Mock)
              </Link>
              <Link to="/driver" className="btn-ghost btn-sm justify-start">
                <Icon name="truck" className="h-3.5 w-3.5" />
                اپ راننده (Mock)
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-40 flex items-center gap-2 border-b border-ink-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
          <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-ink-800" aria-label="منو">
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <Badge tone="brand" icon="sparkles">
            نقش فعال: {admin.fullName}
          </Badge>
          <Badge tone="neutral" icon="check">
            دسترسی‌های RBAC فعال
          </Badge>
          <div className="mr-auto flex items-center gap-1.5">
            <Link to="/" className="btn-ghost btn-sm">
              <Icon name="home" className="h-4 w-4" />
              <span className="hidden sm:inline">مشاهده سایت مشتری</span>
            </Link>
            <button onClick={toggleTheme} className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800" aria-label="تغییر تم">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn-ghost btn-sm"
            >
              <Icon name="logout" className="h-4 w-4" />
              خروج
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        <footer className="no-print border-t border-ink-200 px-4 py-4 text-center text-[11px] text-ink-500 dark:border-ink-800 dark:text-ink-400">
          <span className="flex flex-wrap items-center justify-center gap-2">
            <KarenSoftLogo size={26} />
            <span>
              طراحی و توسعه توسط{' '}
              <a href="http://Karen-soft.ir" target="_blank" rel="noreferrer" className="font-bold text-brand-700 hover:underline dark:text-brand-300">
                کارن سافت
              </a>{' '}
              — Karen-soft.ir
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
};

export { BRAND_NAME, BRAND_TAGLINE };
