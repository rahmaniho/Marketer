import { useState } from 'react';
import { AdminPage } from '@/components/AdminUI';
import { Badge, Card, DemoNote, Field, Modal, SectionTitle, Stat, Switch, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { settings as defaultSettings } from '@/data/content';
import type { Settings } from '@/lib/types';

const SettingsAdmin = () => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemo = useStore((s) => s.resetDemo);
  const logAction = useStore((s) => s.logAction);
  const { toast } = useToast();
  const [tab, setTab] = useState('general');
  const [resetOpen, setResetOpen] = useState(false);
  const [draft, setDraft] = useState<Settings>(settings);

  const patch = (p: Partial<Settings>) => setDraft({ ...draft, ...p });

  const save = () => {
    updateSettings(draft);
    logAction({
      userId: 'u-001',
      userName: 'مدیر سیستم',
      roleId: 'superadmin',
      action: 'بروزرسانی تنظیمات پلتفرم',
      entity: 'Settings',
      entityId: 'global',
      detail: 'تغییر پارامترهای مالیاتی، ارسال و مدل‌های کسب‌وکار',
      severity: 'warning',
    });
    toast('تنظیمات پلتفرم ذخیره شد');
  };

  return (
    <AdminPage
      title="تنظیمات پلتفرم"
      subtitle="پارامترهای مالی، ارسال، امنیت، مدل‌های کسب‌وکار و مدیریت نسخه دمو"
      icon="settings"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => { setDraft(settings); toast('تغییرات ذخیره‌نشده بازگردانی شد'); }}>
            <Icon name="undo" className="h-4 w-4" />
            بازگردانی
          </button>
          <button className="btn-primary btn-sm" onClick={save}>
            <Icon name="check" className="h-4 w-4" />
            ذخیره تنظیمات
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="نرخ مالیات بر ارزش افزوده" value={`${faNum(draft.taxPercent)}٪`} icon="receipt" />
        <Stat label="آستانه ارسال رایگان" value={`${faNum(draft.freeShippingMin / 1_000_000)} میلیون تومان`} icon="truck" tone="info" />
        <Stat label="مهلت پیش‌فرض اعتبار" value={`${faNum(draft.creditDaysDefault)} روز`} icon="wallet" tone="accent" />
        <Stat label="نرخ ارز مرجع" value={`${faNum(draft.usdRate)} تومان`} icon="globe" tone="vip" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'general', label: 'عمومی و مالی', icon: 'settings' },
          { id: 'shipping', label: 'ارسال و انبار', icon: 'truck' },
          { id: 'commerce', label: 'فروش و تسویه', icon: 'wallet' },
          { id: 'models', label: 'مدل‌های کسب‌وکار', icon: 'layers' },
          { id: 'integrations', label: 'سرویس‌ها', icon: 'server' },
          { id: 'demo', label: 'نسخه دمو', icon: 'refresh' },
        ]}
      />

      {tab === 'general' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-3">
            <SectionTitle title="اطلاعات شرکت" icon="store" />
            <Field label="نام نمایشی پلتفرم">
              <input value={draft.companyName} onChange={(e) => patch({ companyName: e.target.value })} className="input" />
            </Field>
            <Field label="نرخ مالیات بر ارزش افزوده (٪)">
              <input type="number" value={draft.taxPercent} onChange={(e) => patch({ taxPercent: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="نرخ ارز مرجع (تومان)">
              <input type="number" value={draft.usdRate} onChange={(e) => patch({ usdRate: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="تعداد کارتن در هر پالت">
              <input type="number" value={draft.cartonsPerPallet} onChange={(e) => patch({ cartonsPerPallet: Number(e.target.value) })} className="input num" />
            </Field>
          </Card>

          <Card className="space-y-3">
            <SectionTitle title="امنیت و دسترسی" icon="lock" />
            <Switch checked={draft.enableTwoFactor} onChange={(v) => patch({ enableTwoFactor: v })} label="ورود دو مرحله‌ای (2FA)" description="اجباری برای نقش‌های مدیریتی" />
            <Switch checked={draft.enableSso} onChange={(v) => patch({ enableSso: v })} label="ورود یکپارچه (SSO)" description="اتصال به Microsoft Entra ID / Google Workspace" />
            <Switch checked={draft.enableAuditLog} onChange={(v) => patch({ enableAuditLog: v })} label="ثبت لاگ عملیات (Audit Trail)" description="ثبت تمام تغییرات کاربران پنل" />
            <Switch checked={draft.enableSmsMock} onChange={(v) => patch({ enableSmsMock: v })} label="پیامک نمایشی" description="ارسال پیامک شبیه‌سازی‌شده بدون اتصال به پنل پیامکی" />
            <Switch checked={draft.enableModian} onChange={(v) => patch({ enableModian: v })} label="اتصال به سامانه مودیان" description="ارسال صورتحساب الکترونیکی (شبیه‌سازی)" />
          </Card>
        </div>
      )}

      {tab === 'shipping' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-3">
            <SectionTitle title="سیاست ارسال" icon="truck" />
            <Field label="آستانه ارسال رایگان (تومان)">
              <input type="number" value={draft.freeShippingMin} onChange={(e) => patch({ freeShippingMin: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="هزینه ارسال تهران (تومان)">
              <input type="number" value={draft.shippingCost} onChange={(e) => patch({ shippingCost: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="حد هشدار کمبود موجودی (واحد)">
              <input type="number" value={draft.lowStockThreshold} onChange={(e) => patch({ lowStockThreshold: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="هشدار انقضا (روز قبل از انقضا)">
              <input type="number" value={draft.expiryWarnDays} onChange={(e) => patch({ expiryWarnDays: Number(e.target.value) })} className="input num" />
            </Field>
          </Card>
          <Card className="space-y-3">
            <SectionTitle title="مناطق و بازه‌های تحویل" icon="map" />
            {[
              ['تهران و حومه — ارسال یک‌روزه', 'فعال'],
              ['مراکز استان — ارسال دو تا سه روزه', 'فعال'],
              ['شهرهای کوچک — ارسال سه تا پنج روزه', 'فعال'],
              ['ارسال با خودروی یخچال‌دار (زنجیره سرد)', 'فعال'],
              ['ارسال شبانه (سفارش تا ساعت ۱۸)', 'غیرفعال'],
            ].map(([label, state]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-[11.5px] dark:border-ink-700">
                <span>{label}</span>
                <Badge tone={state === 'فعال' ? 'success' : 'neutral'}>{state}</Badge>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab === 'commerce' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-3">
            <SectionTitle title="تسویه و اعتبار" icon="wallet" />
            <Field label="مهلت پیش‌فرض اعتبار (روز)">
              <input type="number" value={draft.creditDaysDefault} onChange={(e) => patch({ creditDaysDefault: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="مهلت پیش‌فرض چک (روز)">
              <input type="number" value={draft.chequeDays} onChange={(e) => patch({ chequeDays: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="تخفیف پیش‌فرض پرداخت نقدی (٪)">
              <input type="number" value={draft.cashDiscountDefault} onChange={(e) => patch({ cashDiscountDefault: Number(e.target.value) })} className="input num" />
            </Field>
            <Field label="تخفیف پیش‌فرض قرارداد پیمانی (٪)">
              <input type="number" value={draft.contractDiscountDefault} onChange={(e) => patch({ contractDiscountDefault: Number(e.target.value) })} className="input num" />
            </Field>
          </Card>
          <Card className="space-y-3">
            <SectionTitle title="شرایط تسویه قابل انتخاب توسط مشتری" icon="receipt" />
            {draft.settlementTerms.map((t, i) => (
              <div key={t} className="flex items-center gap-2">
                <input
                  value={t}
                  onChange={(e) => {
                    const list = [...draft.settlementTerms];
                    list[i] = e.target.value;
                    patch({ settlementTerms: list });
                  }}
                  className="input flex-1 py-2 text-[12px]"
                />
                <button
                  className="btn-ghost btn-sm text-rose-600"
                  onClick={() => patch({ settlementTerms: draft.settlementTerms.filter((_, k) => k !== i) })}
                >
                  <Icon name="trash" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button className="btn-ghost btn-sm" onClick={() => patch({ settlementTerms: [...draft.settlementTerms, 'شرط تسویه جدید'] })}>
              <Icon name="plus" className="h-3.5 w-3.5" />
              افزودن شرط تسویه
            </button>
          </Card>
        </div>
      )}

      {tab === 'models' && (
        <Card className="space-y-3">
          <SectionTitle title="مدل‌های کسب‌وکار فعال" subtitle="فعال‌سازی مدل‌های درآمدی پلتفرم" icon="layers" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'مارکت‌پلیس چندفروشندگی',
              'Dropshipping',
              'فروش امانی',
              'White-label',
              'فرنچایز منطقه‌ای',
              'چندشعبه‌ای',
              'چندارزی (ریال/یورو/درهم)',
              'B2B2C',
            ].map((m) => {
              const on = draft.businessModels.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => patch({ businessModels: on ? draft.businessModels.filter((x) => x !== m) : [...draft.businessModels, m] })}
                  className={`rounded-xl border p-3 text-right text-[12px] font-semibold transition ${
                    on ? 'border-brand-600 bg-brand-50/60 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100' : 'border-ink-200 dark:border-ink-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {m}
                    {on ? <Icon name="check-circle" className="h-4 w-4 text-brand-600" /> : <Icon name="plus" className="h-4 w-4 text-ink-400" />}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'integrations' && (
        <Card className="space-y-3">
          <SectionTitle title="سرویس‌های بیرونی (نمایشی)" subtitle="در نسخه دمو هیچ اتصال واقعی برقرار نمی‌شود" icon="server" />
          {[
            ['پنل پیامکی (SMS)', 'enableSmsMock', 'ارسال کد ورود، اعلان سفارش و یادآوری تسویه'],
            ['سامانه مودیان', 'enableModian', 'ارسال صورتحساب الکترونیکی و دریافت شناسه یکتا'],
            ['درگاه پرداخت', 'enableSmsMock', 'پرداخت آنلاین سفارش‌ها (شبیه‌سازی‌شده)'],
            ['سرویس نقشه و مسیریابی', 'enableSmsMock', 'مسیریابی چندتوقفی و رهگیری خودرو'],
            ['واتس‌اپ بیزینس', 'enableSmsMock', 'ارسال کاتالوگ و تأیید سفارش'],
          ].map(([label, key, desc]) => (
            <Switch
              key={label}
              checked={Boolean(draft[key as keyof Settings])}
              onChange={(v) => patch({ [key]: v } as Partial<Settings>)}
              label={label}
              description={desc}
            />
          ))}
          <DemoNote>
            در نسخه عملیاتی، هر سرویس با کلید API اختصاصی، لاگ فراخوانی و مکانیزم تلاش مجدد (Retry) به پلتفرم متصل
            می‌شود.
          </DemoNote>
        </Card>
      )}

      {tab === 'demo' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-3">
            <SectionTitle title="مدیریت نسخه دمو" icon="refresh" />
            <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">
              تمام داده‌های این دمو (سبد خرید، سفارش‌ها، تغییرات کاتالوگ، تنظیمات و گفت‌وگوها) در حافظه محلی مرورگر
              شما ذخیره می‌شوند. با بازنشانی، پلتفرم به وضعیت اولیه بازمی‌گردد.
            </p>
            <div className="grid gap-2 text-[11.5px]">
              {[
                ['داده اولیه کاتالوگ', 'بدون تغییر'],
                ['سفارش‌های ثبت‌شده شما', 'ذخیره‌شده'],
                ['تغییرات مدیریتی', 'فقط در مرورگر شما'],
                ['ارسال داده به سرور', 'غیرفعال'],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 dark:border-ink-700">
                  <span>{l}</span>
                  <Badge tone="neutral">{v}</Badge>
                </div>
              ))}
            </div>
            <button className="btn-danger w-full" onClick={() => setResetOpen(true)}>
              <Icon name="refresh" className="h-4 w-4" />
              بازنشانی کامل دمو
            </button>
          </Card>

          <Card className="space-y-3">
            <SectionTitle title="تنظیمات پیش‌فرض کارخانه" icon="server" />
            <div className="overflow-hidden rounded-xl2 border border-ink-200 dark:border-ink-700">
              <div className="overflow-x-auto">
                <table className="table-basic min-w-[380px]">
                  <thead>
                    <tr>
                      <th>پارامتر</th>
                      <th>مقدار پیش‌فرض</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['نرخ مالیات', `${defaultSettings.taxPercent}٪`],
                      ['آستانه ارسال رایگان', `${defaultSettings.freeShippingMin.toLocaleString('en-US')} تومان`],
                      ['هزینه ارسال', `${defaultSettings.shippingCost.toLocaleString('en-US')} تومان`],
                      ['مهلت اعتبار', `${defaultSettings.creditDaysDefault} روز`],
                      ['تخفیف نقدی', `${defaultSettings.cashDiscountDefault}٪`],
                      ['تخفیف قرارداد', `${defaultSettings.contractDiscountDefault}٪`],
                    ].map(([l, v]) => (
                      <tr key={l}>
                        <td>{l}</td>
                        <td className="num">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="بازنشانی کامل نسخه دمو"
        size="sm"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setResetOpen(false)}>
              انصراف
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                resetDemo();
                setResetOpen(false);
                toast('دمو بازنشانی شد و به وضعیت اولیه بازگشت', 'error');
              }}
            >
              بازنشانی قطعی
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-6">
          با این کار تمام سبد خرید، سفارش‌ها، تغییرات کاتالوگ و تنظیمات ذخیره‌شده در مرورگر حذف و داده‌های اولیه
          بازگردانی می‌شود. حساب کاربری فعلی وارد‌شده باقی می‌ماند. این عملیات قابل بازگشت نیست.
        </p>
      </Modal>
    </AdminPage>
  );
};

export default SettingsAdmin;
