import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Modal, Stat, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime, timeAgo } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { adminUsers, permissionLabels, roleById, roles } from '@/data/crm';
import type { AdminUser, Permission, RoleId } from '@/lib/types';

const UsersAdmin = () => {
  const logAction = useStore((s) => s.logAction);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [tab, setTab] = useState('users');
  const [draft, setDraft] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim();
    return adminUsers.filter((u) => {
      if (role !== 'all' && u.roleId !== role) return false;
      if (term && !u.fullName.includes(term) && !u.email.includes(term) && !u.mobile.includes(term)) return false;
      return true;
    });
  }, [q, role]);

  return (
    <AdminPage
      title="کاربران، نقش‌ها و مجوزها"
      subtitle={`${faNum(adminUsers.length)} کاربر پنل • ${faNum(roles.length)} نقش با تفکیک مجوز (RBAC)`}
      icon="users"
      actions={
        <button
          className="btn-primary btn-sm"
          onClick={() =>
            setDraft({
              id: `u-${Date.now()}`,
              fullName: '',
              mobile: '09120000000',
              email: '',
              roleId: 'operator',
              avatarColor: '#0f684c',
              twoFactorEnabled: true,
              lastLogin: new Date().toISOString(),
              status: 'active',
              city: 'تهران',
            })
          }
        >
          <Icon name="plus" className="h-4 w-4" />
          کاربر جدید
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="کاربران فعال" value={faNum(adminUsers.filter((u) => u.status === 'active').length)} icon="users" />
        <Stat label="ورود دومرحله‌ای فعال" value={faNum(adminUsers.filter((u) => u.twoFactorEnabled).length)} icon="key" tone="accent" />
        <Stat label="اتصال SSO" value={faNum(adminUsers.filter((u) => u.ssoProvider).length)} icon="globe" tone="info" />
        <Stat label="کاربران غیرفعال" value={faNum(adminUsers.filter((u) => u.status === 'disabled').length)} icon="lock" tone="danger" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'users', label: 'کاربران پنل', icon: 'users', count: adminUsers.length },
          { id: 'roles', label: 'نقش‌ها و مجوزها', icon: 'shield', count: roles.length },
          { id: 'sessions', label: 'نشست‌ها و امنیت', icon: 'lock' },
        ]}
      />

      {tab === 'users' && (
        <>
          <AdminToolbar>
            <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی نام، ایمیل یا موبایل کاربر…" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="select w-auto py-2 text-[12px]">
              <option value="all">همه نقش‌ها</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </AdminToolbar>

          <TableWrap>
            <thead>
              <tr>
                <th>کاربر</th>
                <th>نقش</th>
                <th>موبایل / ایمیل</th>
                <th>شهر</th>
                <th>۲FA</th>
                <th>SSO</th>
                <th>آخرین ورود</th>
                <th>وضعیت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <EmptyRow colSpan={9} text="کاربری با این فیلترها یافت نشد" />
              ) : (
                filtered.map((u) => {
                  const r = roleById(u.roleId);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[11.5px] font-bold text-white"
                            style={{ background: u.avatarColor }}
                          >
                            {u.fullName
                              .split(' ')
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <div>
                            <p className="font-semibold">{u.fullName}</p>
                            <p className="num text-[10.5px] text-ink-400">{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                          {r.name}
                        </span>
                      </td>
                      <td className="num text-[11px]">
                        {u.mobile}
                        <span className="block text-[10.5px] text-ink-400" dir="ltr">
                          {u.email}
                        </span>
                      </td>
                      <td>{u.city}</td>
                      <td>
                        <Badge tone={u.twoFactorEnabled ? 'success' : 'danger'}>{u.twoFactorEnabled ? 'فعال' : 'غیرفعال'}</Badge>
                      </td>
                      <td className="text-[11px]">{u.ssoProvider ?? '—'}</td>
                      <td className="text-[11px] text-ink-400">{timeAgo(u.lastLogin)}</td>
                      <td>
                        <Badge tone={u.status === 'active' ? 'success' : 'danger'}>{u.status === 'active' ? 'فعال' : 'غیرفعال'}</Badge>
                      </td>
                      <td>
                        <button className="btn-ghost btn-sm" onClick={() => setDraft({ ...u })}>
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          ویرایش
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </TableWrap>
        </>
      )}

      {tab === 'roles' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: r.color }}>
                    <Icon name="shield" className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[13px] font-extrabold">{r.name}</p>
                    <p className="num text-[10.5px] text-ink-400">{faNum(r.permissions.length)} مجوز</p>
                  </div>
                </div>
                <Badge tone="neutral">{faNum(adminUsers.filter((u) => u.roleId === r.id).length)} کاربر</Badge>
              </div>
              <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions.map((p: Permission) => (
                  <span key={p} className="chip bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                    {permissionLabels[p]}
                  </span>
                ))}
              </div>
              <button className="btn-ghost btn-sm w-full" onClick={() => toast(`ویرایش مجوزهای نقش «${r.name}» (نمایشی)`)}>
                <Icon name="sliders" className="h-3.5 w-3.5" />
                ویرایش مجوزها
              </button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">نشست‌های فعال</p>
            <div className="space-y-2">
              {adminUsers.slice(0, 6).map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-[11.5px] dark:border-ink-700">
                  <div>
                    <p className="font-semibold">{u.fullName}</p>
                    <p className="num text-[10.5px] text-ink-400">آخرین ورود: {jalaliDateTime(u.lastLogin)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="success">فعال</Badge>
                    <button className="btn-ghost btn-sm" onClick={() => toast(`نشست ${u.fullName} پایان یافت (نمایشی)`, 'error')}>
                      پایان نشست
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">سیاست‌های امنیتی سازمانی</p>
            <div className="space-y-2 text-[11.5px]">
              {[
                ['ورود دومرحله‌ای اجباری برای نقش‌های مدیریتی', 'فعال'],
                ['انقضای نشست پس از ۳۰ دقیقه بی‌فعالیتی', 'فعال'],
                ['محدودسازی دسترسی بر پایه IP سازمانی', 'اختیاری'],
                ['ثبت کامل Audit Trail عملیات', 'فعال'],
                ['رمزنگاری داده‌های ذخیره‌شده در مرورگر', 'فعال'],
                ['سیاست رمز عبور پیچیده و چرخش ۹۰ روزه', 'فعال'],
              ].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span>{label}</span>
                  <Badge tone={state === 'فعال' ? 'success' : 'neutral'}>{state}</Badge>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10.5px] leading-5 text-ink-400">
              در نسخه دمو این سیاست‌ها فقط نمایش داده می‌شوند و روی محیط واقعی اعمال نمی‌گردند.
            </p>
          </Card>
        </div>
      )}

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.fullName ? `ویرایش کاربر — ${draft.fullName}` : 'افزودن کاربر پنل'}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDraft(null)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!draft) return;
                if (!draft.fullName.trim()) {
                  toast('نام کاربر الزامی است', 'error');
                  return;
                }
                logAction({
                  userId: draft.id,
                  userName: draft.fullName,
                  roleId: draft.roleId,
                  action: 'ایجاد/ویرایش کاربر پنل',
                  entity: 'AdminUser',
                  entityId: draft.id,
                  detail: `نقش: ${roleById(draft.roleId).name}`,
                  severity: 'warning',
                });
                toast(`کاربر «${draft.fullName}» ذخیره شد`);
                setDraft(null);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ذخیره کاربر
            </button>
          </div>
        }
      >
        {draft && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام و نام خانوادگی" required>
                <input value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} className="input" />
              </Field>
              <Field label="موبایل">
                <input value={draft.mobile} onChange={(e) => setDraft({ ...draft, mobile: e.target.value })} className="input num" />
              </Field>
              <Field label="ایمیل سازمانی">
                <input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="input" dir="ltr" />
              </Field>
              <Field label="نقش کاربری">
                <select value={draft.roleId} onChange={(e) => setDraft({ ...draft, roleId: e.target.value as RoleId })} className="select">
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="شهر">
                <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="input" />
              </Field>
              <Field label="وضعیت">
                <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as AdminUser['status'] })} className="select">
                  <option value="active">فعال</option>
                  <option value="disabled">غیرفعال</option>
                </select>
              </Field>
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-2 text-[12px] font-extrabold">مجوزهای نقش انتخاب‌شده</p>
              <div className="flex flex-wrap gap-1">
                {roleById(draft.roleId).permissions.map((p) => (
                  <span key={p} className="chip bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300">
                    {permissionLabels[p]}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default UsersAdmin;
