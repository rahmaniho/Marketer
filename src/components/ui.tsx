import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { faNum } from '@/lib/format';

// ─────────────────────────────────────────────────────────── Badge
export const Badge = ({
  children,
  tone = 'neutral',
  className = '',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'vip' | 'accent';
  className?: string;
  icon?: string;
}) => {
  const tones: Record<string, string> = {
    neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    vip: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };
  return (
    <span className={`badge ${tones[tone]} ${className}`}>
      {icon && <Icon name={icon} className="h-3 w-3" />}
      {children}
    </span>
  );
};

export const StatusPill = ({ label, tone }: { label: string; tone: string }) => (
  <span className={`badge ${tone}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
    {label}
  </span>
);

// ─────────────────────────────────────────────────────────── Card
export const Card = ({
  children,
  className = '',
  padded = true,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  hover?: boolean;
}) => (
  <div className={`card ${padded ? 'p-4 sm:p-5' : ''} ${hover ? 'transition hover:shadow-pop' : ''} ${className}`}>
    {children}
  </div>
);

export const SectionTitle = ({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: string;
}) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <div className="flex items-center gap-2.5">
      {icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
      <div>
        <h2 className="text-base font-extrabold text-ink-900 sm:text-lg dark:text-ink-50">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// ─────────────────────────────────────────────────────────── Stat
export const Stat = ({
  label,
  value,
  unit,
  delta,
  positive,
  icon,
  hint,
  tone = 'brand',
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  positive?: boolean;
  icon?: string;
  hint?: string;
  tone?: 'brand' | 'info' | 'accent' | 'danger' | 'vip';
}) => {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    accent: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    vip: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };
  return (
    <Card className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <p className="num mt-1.5 text-xl font-extrabold text-ink-900 sm:text-2xl dark:text-ink-50">
          {value}
          {unit && <span className="mr-1 text-xs font-medium text-ink-500 dark:text-ink-400">{unit}</span>}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {delta && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              <Icon name={positive ? 'trend' : 'trendingDown'} className="h-3.5 w-3.5" />
              {delta}
            </span>
          )}
          {hint && <span className="truncate text-[11px] text-ink-400">{hint}</span>}
        </div>
      </div>
      {icon && (
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon name={icon} className="h-5 w-5" />
        </span>
      )}
    </Card>
  );
};

// ─────────────────────────────────────────────────────────── Progress
export const Progress = ({ value, color = '#0f684c', label }: { value: number; color?: string; label?: string }) => (
  <div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
    {label && <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">{label}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────── Modal
export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-ink-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-fade-up w-full ${widths} rounded-t-3xl border border-ink-200 bg-white shadow-pop sm:rounded-2xl dark:border-ink-700 dark:bg-ink-900`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h3 className="text-sm font-extrabold text-ink-900 dark:text-ink-50">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="بستن">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 px-5 py-3.5 dark:border-ink-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

// ─────────────────────────────────────────────────────────── Tabs
export const Tabs = ({
  tabs,
  active,
  onChange,
  size = 'md',
}: {
  tabs: { id: string; label: string; icon?: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
}) => (
  <div role="tablist" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
    {tabs.map((t) => (
      <button
        key={t.id}
        role="tab"
        aria-selected={active === t.id}
        onClick={() => onChange(t.id)}
        className={`flex flex-none items-center gap-1.5 rounded-xl border px-3.5 font-semibold transition ${
          size === 'sm' ? 'py-1.5 text-xs' : 'py-2 text-[13px]'
        } ${
          active === t.id
            ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
            : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
        }`}
      >
        {t.icon && <Icon name={t.icon} className="h-4 w-4" />}
        {t.label}
        {t.count !== undefined && (
          <span className={`num rounded-md px-1.5 text-[10px] ${active === t.id ? 'bg-white/25' : 'bg-ink-100 dark:bg-ink-800'}`}>
            {faNum(t.count)}
          </span>
        )}
      </button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────── Form fields
export const Field = ({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) => (
  <label className="block">
    <span className="label">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
  </label>
);

export const Switch = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) => (
  <div className="flex items-start justify-between gap-4 py-2">
    <div className="min-w-0">
      <p className="text-[13px] font-semibold text-ink-800 dark:text-ink-200">{label}</p>
      {description && <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">{description}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-none rounded-full transition ${checked ? 'bg-brand-600' : 'bg-ink-300 dark:bg-ink-700'}`}
    >
      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ right: checked ? 2 : 22 }} />
    </button>
  </div>
);

// ─────────────────────────────────────────────────────────── Empty & Skeleton
export const EmptyState = ({ icon = 'package', title, description, action }: { icon?: string; title: string; description?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink-200 px-6 py-12 text-center dark:border-ink-700">
    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
      <Icon name={icon} className="h-7 w-7" />
    </span>
    <p className="mt-3 text-sm font-bold text-ink-800 dark:text-ink-200">{title}</p>
    {description && <p className="mt-1 max-w-sm text-xs text-ink-500 dark:text-ink-400">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Skeleton = ({ className = 'h-4 w-full' }: { className?: string }) => <div className={`skeleton ${className}`} />;

// ─────────────────────────────────────────────────────────── Star rating
export const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`امتیاز ${faNum(value, 1)} از ۵`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i <= Math.round(value) ? 'text-amber-400' : 'text-ink-300 dark:text-ink-600'} fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ))}
    <span className="num mr-1 text-[11px] text-ink-500 dark:text-ink-400">{faNum(value, 1)}</span>
  </span>
);

// ─────────────────────────────────────────────────────────── Toast
type ToastItem = { id: number; text: string; tone: 'success' | 'error' | 'info' };
const ToastCtx = createContext<{ toast: (text: string, tone?: ToastItem['tone']) => void }>({ toast: () => {} });

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((text: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text, tone }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3600);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[80] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
        {items.map((i) => (
          <div
            key={i.id}
            className={`animate-fade-up pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold text-white shadow-pop ${
              i.tone === 'success' ? 'bg-brand-600' : i.tone === 'error' ? 'bg-rose-600' : 'bg-ink-800'
            }`}
          >
            <Icon name={i.tone === 'success' ? 'check-circle' : i.tone === 'error' ? 'alert' : 'info'} className="h-4 w-4" />
            <span className="flex-1">{i.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

export const useToast = () => useContext(ToastCtx);

// ─────────────────────────────────────────────────────────── Table wrapper
export const TableWrap = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`overflow-x-auto rounded-xl2 border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900 ${className}`}>
    <table className="table-basic">{children}</table>
  </div>
);

export const Pagination = ({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) => {
  if (pages <= 1) return null;
  const list = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 1,
  );
  return (
    <nav className="mt-4 flex items-center justify-center gap-1.5" aria-label="صفحه‌بندی">
      <button className="btn-ghost btn-sm" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="صفحه قبل">
        <Icon name="chevron-right" className="h-4 w-4" />
      </button>
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 && <span className="text-ink-400">…</span>}
          <button
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`num h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition ${
              p === page
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
            }`}
          >
            {faNum(p)}
          </button>
        </span>
      ))}
      <button className="btn-ghost btn-sm" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="صفحه بعد">
        <Icon name="chevron-left" className="h-4 w-4" />
      </button>
    </nav>
  );
};

// ─────────────────────────────────────────────────────────── Copy button
export const CopyButton = ({ text, label = 'کپی' }: { text: string; label?: string }) => {
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  return (
    <button
      className="btn-ghost btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard ممکن است در iframe در دسترس نباشد */
        }
        setDone(true);
        toast('در حافظه کپی شد');
        setTimeout(() => setDone(false), 1500);
      }}
    >
      <Icon name={done ? 'check' : 'clipboard'} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
};

/** نوار اطلاعات دمو */
export const DemoNote = ({ children, icon = 'info' }: { children: ReactNode; icon?: string }) => (
  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
    <Icon name={icon} className="mt-0.5 h-4 w-4 flex-none" />
    <p className="leading-relaxed">{children}</p>
  </div>
);
