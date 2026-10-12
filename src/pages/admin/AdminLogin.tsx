import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Card, DemoNote, Field } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { KarenSoftLogo } from '@/components/BrandLogo';
import { useStore } from '@/store/useStore';
import { permissionLabels, roles } from '@/data/crm';
import { faNum } from '@/lib/format';
import type { RoleId } from '@/lib/types';

const AdminLogin = () => {
  const loginAdmin = useStore((s) => s.loginAdmin);
  const admin = useStore((s) => s.admin);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<RoleId>('superadmin');
  const [twoFactor, setTwoFactor] = useState(true);

  const enter = () => {
    loginAdmin(selected);
    navigate('/admin');
  };

  return (
    <div className="min-h-dvh bg-ink-50 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="gradient-brand flex h-11 w-11 items-center justify-center rounded-2xl text-white">
              <Icon name="shield" className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="text-[15px] font-extrabold text-ink-900 dark:text-ink-50">پنل مدیریت بازارعمده</p>
              <p className="text-[11.5px] text-ink-500 dark:text-ink-400">ورود نمایشی با انتخاب نقش و دسترسی‌های RBAC</p>
            </div>
          </div>
          <Link to="/" className="btn-ghost btn-sm">
            <Icon name="home" className="h-4 w-4" />
            بازگشت به سایت مشتری
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <Card>
            <p className="mb-3 text-[13px] font-extrabold">ورود نمایشی</p>
            <div className="space-y-3">
              <Field label="نام کاربری / موبایل" hint="در این دمو نیازی به رمز عبور نیست.">
                <input value="09120000001" readOnly className="input num bg-ink-50 dark:bg-ink-800" />
              </Field>
              <Field label="کد تأیید دومرحله‌ای (نمایشی)">
                <input value="123456" readOnly className="input num bg-ink-50 tracking-widest dark:bg-ink-800" />
              </Field>
              <label className="flex items-center gap-2 text-[11.5px]">
                <input type="checkbox" checked={twoFactor} onChange={(e) => setTwoFactor(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-brand-600" />
                ورود دو مرحله‌ای (2FA) فعال باشد
              </label>
              <button className="btn-primary w-full" onClick={enter}>
                <Icon name="login" className="h-4 w-4" />
                ورود به پنل با نقش «{roles.find((r) => r.id === selected)?.name}»
              </button>
              {admin && (
                <p className="text-[11px] text-ink-500 dark:text-ink-400">
                  نشست فعلی: {admin.fullName} ({admin.roleId})
                </p>
              )}
            </div>
            <DemoNote>
              احراز هویت، 2FA و SSO در نسخه دمو کاملاً شبیه‌سازی‌شده‌اند و هیچ رمز یا پیامکی ارسال نمی‌شود.
            </DemoNote>
          </Card>

          <div className="space-y-3">
            <Card>
              <p className="mb-3 text-[13px] font-extrabold">انتخاب نقش کاربری (۷ نقش)</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={`rounded-xl border p-3 text-right transition ${
                      selected === r.id ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-900/20' : 'border-ink-200 hover:border-brand-300 dark:border-ink-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: r.color }} />
                        <span className="text-[12.5px] font-extrabold">{r.name}</span>
                      </span>
                      <Badge tone="neutral">{faNum(r.permissions.length)} مجوز</Badge>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-ink-500 dark:text-ink-400">{r.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.permissions.slice(0, 3).map((p) => (
                        <span key={p} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          {permissionLabels[p]}
                        </span>
                      ))}
                      {r.permissions.length > 3 && (
                        <span className="num chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                          +{faNum(r.permissions.length - 3)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
            <DemoNote icon="shield">
              در نسخه عملیاتی، ورود مدیران با SSO سازمانی (Microsoft Entra ID / Google Workspace) و احراز هویت دومرحله‌ای
              اجباری انجام می‌شود و تمام عملیات در Audit Trail ثبت می‌گردد.
            </DemoNote>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-[11px] text-ink-400">
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

export default AdminLogin;
