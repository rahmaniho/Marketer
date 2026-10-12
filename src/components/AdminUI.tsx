import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Badge } from './ui';

/** سربرگ مشترک صفحات پنل مدیریت */
export const AdminPage = ({
  title,
  subtitle,
  icon = 'chart',
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl2 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-base font-extrabold text-ink-900 dark:text-ink-50 sm:text-lg">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-ink-500 dark:text-ink-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

/** نوار ابزار جست‌وجو و فیلتر */
export const AdminToolbar = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2 rounded-xl2 border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
    {children}
  </div>
);

/** جست‌وجوی سریع */
export const QuickSearch = ({
  value,
  onChange,
  placeholder = 'جست‌وجو…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="relative min-w-[200px] flex-1">
    <Icon name="search" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input py-2 pr-9 text-[12.5px]" />
  </div>
);

/** نوار توزیع ساده برای گزارش‌های جدولی */
export const MiniBar = ({ value, max, color = '#0f684c' }: { value: number; max: number; color?: string }) => (
  <div className="flex items-center gap-2">
    <div className="h-2 w-24 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%`, background: color }} />
    </div>
    <span className="num text-[11px] text-ink-500 dark:text-ink-400">{Math.round((value / Math.max(1, max)) * 100)}٪</span>
  </div>
);

export const Tag = ({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' }) => (
  <Badge tone={tone}>{children}</Badge>
);

export const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <tr>
    <td colSpan={colSpan} className="py-10 text-center text-[12.5px] text-ink-400">
      {text}
    </td>
  </tr>
);
