import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Stat, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { exportCsv, faNum, jalaliDateTime, timeAgo } from '@/lib/format';
import { useAuditLogs } from '@/store/useStore';
import { roleById } from '@/data/crm';
import type { AuditLog } from '@/lib/types';

const SEVERITY_META: Record<AuditLog['severity'], { label: string; tone: 'info' | 'warning' | 'danger'; icon: string }> = {
  info: { label: 'اطلاع', tone: 'info', icon: 'info' },
  warning: { label: 'هشدار', tone: 'warning', icon: 'alert' },
  critical: { label: 'حساس', tone: 'danger', icon: 'shield' },
};

const AuditAdmin = () => {
  const logs = useAuditLogs();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [severity, setSeverity] = useState('all');
  const [tab, setTab] = useState('all');
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim();
    return logs.filter((l) => {
      if (severity !== 'all' && l.severity !== severity) return false;
      if (tab === 'mine' && l.roleId !== 'superadmin') return false;
      if (tab === 'critical' && l.severity === 'info') return false;
      if (term && !l.action.includes(term) && !l.userName.includes(term) && !l.detail.includes(term) && !l.entity.includes(term)) return false;
      return true;
    });
  }, [logs, q, severity, tab]);

  return (
    <AdminPage
      title="لاگ عملیات (Audit Trail)"
      subtitle={`${faNum(logs.length)} رکورد ثبت‌شده • ثبت تمام تغییرات کاتالوگ، قیمت، سفارش و کاربران`}
      icon="activity"
      actions={
        <>
          <button
            className="btn-ghost btn-sm"
            onClick={() =>
              exportCsv(
                [['زمان', 'کاربر', 'نقش', 'عملیات', 'موجودیت', 'شناسه', 'شرح', 'IP', 'سطح'],
                  ...filtered.map((l) => [l.at, l.userName, roleById(l.roleId).name, l.action, l.entity, l.entityId, l.detail, l.ip, SEVERITY_META[l.severity].label])],
                'audit-log.csv',
              )
            }
          >
            <Icon name="sheet" className="h-4 w-4" />
            خروجی CSV
          </button>
          <button className="btn-ghost btn-sm" onClick={() => toast('بایگانی لاگ‌های قدیمی‌تر از ۶ ماه انجام شد (نمایشی)')}>
            <Icon name="server" className="h-4 w-4" />
            بایگانی
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کل رکوردهای لاگ" value={faNum(logs.length)} icon="activity" />
        <Stat label="رخدادهای حساس" value={faNum(logs.filter((l) => l.severity === 'critical').length)} icon="shield" tone="danger" />
        <Stat label="هشدارها" value={faNum(logs.filter((l) => l.severity === 'warning').length)} icon="alert" tone="accent" />
        <Stat label="کاربران یکتای فعال" value={faNum(new Set(logs.map((l) => l.userId)).size)} icon="users" tone="info" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی عملیات، کاربر، موجودیت یا شرح…" />
        <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="select w-auto py-2 text-[12px]">
          <option value="all">همه سطوح</option>
          {(Object.keys(SEVERITY_META) as AuditLog['severity'][]).map((s) => (
            <option key={s} value={s}>
              {SEVERITY_META[s].label}
            </option>
          ))}
        </select>
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'all', label: 'همه رکوردها' },
            { id: 'critical', label: 'حساس و هشدار' },
            { id: 'mine', label: 'سوپرادمین' },
          ]}
        />
      </AdminToolbar>

      <TableWrap>
        <thead>
          <tr>
            <th>زمان</th>
            <th>کاربر</th>
            <th>نقش</th>
            <th>عملیات</th>
            <th>موجودیت</th>
            <th>شرح</th>
            <th>IP</th>
            <th>سطح</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <EmptyRow colSpan={9} text="رکوردی با این فیلترها یافت نشد" />
          ) : (
            filtered.slice(0, 50).map((l) => (
              <tr key={l.id}>
                <td className="text-[11px] text-ink-400">{timeAgo(l.at)}</td>
                <td className="font-semibold">{l.userName}</td>
                <td className="text-[11.5px]">{roleById(l.roleId).name}</td>
                <td>{l.action}</td>
                <td className="text-[11px]">
                  {l.entity}
                  <span className="num block text-[10.5px] text-ink-400">{l.entityId}</span>
                </td>
                <td className="max-w-[320px] truncate text-[11px] text-ink-500 dark:text-ink-400">{l.detail}</td>
                <td className="num text-[10.5px] text-ink-400" dir="ltr">
                  {l.ip}
                </td>
                <td>
                  <Badge tone={SEVERITY_META[l.severity].tone} icon={SEVERITY_META[l.severity].icon}>
                    {SEVERITY_META[l.severity].label}
                  </Badge>
                </td>
                <td>
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(l)}>
                    <Icon name="eye" className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">پرتراکنش‌ترین کاربران</p>
          <div className="space-y-2">
            {[...new Set(logs.map((l) => l.userName))].slice(0, 8).map((name) => {
              const count = logs.filter((l) => l.userName === name).length;
              return (
                <div key={name} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-[11.5px] dark:border-ink-700">
                  <span className="font-semibold">{name}</span>
                  <span className="num text-ink-500 dark:text-ink-400">{faNum(count)} عملیات</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <p className="mb-3 text-[12.5px] font-extrabold">تنظیمات ثبت لاگ</p>
          <div className="space-y-2 text-[11.5px]">
            {[
              ['ثبت تغییر قیمت کالا و پله‌های قیمت', 'فعال'],
              ['ثبت تغییر سطح و سقف اعتبار مشتری', 'فعال'],
              ['ثبت ورود و خروج کاربران پنل', 'فعال'],
              ['ثبت حذف رکوردها (Soft Delete)', 'فعال'],
              ['غیرقابل ویرایش بودن رکوردها (Immutable)', 'فعال'],
              ['نگهداری لاگ برای مدت ۲۴ ماه', 'فعال'],
            ].map(([label, state]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                <span>{label}</span>
                <Badge tone="success">{state}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {detail && (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-extrabold">جزئیات رکورد {detail.id}</p>
            <button className="btn-ghost btn-sm" onClick={() => setDetail(null)}>
              بستن
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-3 text-[11.5px]">
            <Field label="زمان دقیق">
              <p className="num">{jalaliDateTime(detail.at)}</p>
            </Field>
            <Field label="کاربر / نقش">
              <p>
                {detail.userName} — {roleById(detail.roleId).name} ({detail.userId})
              </p>
            </Field>
            <Field label="نشانی IP">
              <p className="num" dir="ltr">
                {detail.ip}
              </p>
            </Field>
            <Field label="موجودیت">
              <p className="num">
                {detail.entity} / {detail.entityId}
              </p>
            </Field>
            <Field label="سطح">
              <Badge tone={SEVERITY_META[detail.severity].tone}>{SEVERITY_META[detail.severity].label}</Badge>
            </Field>
            <Field label="شناسه رکورد">
              <p className="num">{detail.id}</p>
            </Field>
          </div>
          <Field label="شرح کامل عملیات">
            <p className="leading-6 text-ink-600 dark:text-ink-300">{detail.detail}</p>
          </Field>
          <Field label="ادعای رکورد (نمایشی)">
            <p className="num break-all text-[10.5px] text-ink-400" dir="ltr">
              sha256:{detail.id}-{detail.userId}-{detail.entityId}-{String(detail.at).slice(0, 10)}
            </p>
          </Field>
        </Card>
      )}
    </AdminPage>
  );
};

export default AuditAdmin;
