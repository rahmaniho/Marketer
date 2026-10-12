import { Link } from 'react-router-dom';
import { Card } from '@/components/ui';
import { Icon } from '@/components/Icon';

const NotFound = () => (
  <Card className="mx-auto max-w-lg text-center">
    <span className="gradient-brand mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-white">
      <Icon name="search" className="h-8 w-8" />
    </span>
    <p className="num mt-4 text-3xl font-extrabold text-ink-900 dark:text-ink-50">۴۰۴</p>
    <h1 className="mt-2 text-base font-extrabold">صفحه مورد نظر پیدا نشد</h1>
    <p className="mt-1.5 text-[12px] leading-6 text-ink-500 dark:text-ink-400">
      ممکن است آدرس تغییر کرده باشد یا مسیر در این دمو موجود نباشد. از لینک‌های زیر ادامه دهید.
    </p>
    <div className="mt-5 grid gap-2 sm:grid-cols-2">
      <Link to="/" className="btn-primary">
        <Icon name="home" className="h-4 w-4" />
        صفحه اصلی
      </Link>
      <Link to="/catalog" className="btn-ghost">
        <Icon name="grid" className="h-4 w-4" />
        کاتالوگ عمده کالا
      </Link>
      <Link to="/brands" className="btn-ghost">
        <Icon name="badge" className="h-4 w-4" />
        فهرست برندها
      </Link>
      <Link to="/admin" className="btn-ghost">
        <Icon name="shield" className="h-4 w-4" />
        پنل مدیریت
      </Link>
    </div>
  </Card>
);

export default NotFound;
