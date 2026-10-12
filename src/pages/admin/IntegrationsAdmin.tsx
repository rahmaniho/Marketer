import { useState } from 'react';
import { AdminPage, AdminToolbar, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, CopyButton, Field, Modal, Stat, Switch, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime } from '@/lib/format';
import { integrations, settings } from '@/data/content';

/** رویدادهای قابل اشتراک در وب‌هوک */
const WEBHOOK_EVENTS = [
  'order.created',
  'order.confirmed',
  'order.status_changed',
  'invoice.issued',
  'payment.received',
  'stock.changed',
  'customer.approved',
  'rfq.quoted',
];

/** شرح مدل‌های کسب‌وکار پشتیبانی‌شده */
const MODEL_DETAILS = [
  { name: 'مارکت‌پلیس چندفروشندگی', icon: 'store', description: 'چند تأمین‌کننده و فروشنده در یک پلتفرم با تسویه تفکیک‌شده.', features: ['پنل جداگانه هر فروشنده', 'تسویه و کمیسیون خودکار', 'کنترل کیفیت و امتیازدهی'], available: true },
  { name: 'Dropshipping (ارسال مستقیم)', icon: 'route', description: 'ارسال مستقیم کالا از انبار تأمین‌کننده به مشتری بدون ورود به انبار مرکزی.', features: ['اتصال موجودی تأمین‌کننده', 'برچسب ارسال تولید خودکار', 'حذف هزینه انبارداری'], available: true },
  { name: 'فروش امانی (Consignment)', icon: 'layers', description: 'قرار گرفتن کالا در فروشگاه و تسویه پس از فروش.', features: ['کنترل موجودی امانی', 'تسویه دوره‌ای', 'فراخوان کالای فروش‌نرفته'], available: false },
  { name: 'White-label (برند اختصاصی)', icon: 'award', description: 'اجرای پلتفرم با برند و رنگ‌بندی اختصاصی هر مجموعه پخش.', features: ['دامنه و برند اختصاصی', 'قالب اختصاصی فاکتور', 'تفکیک کامل داده‌ها'], available: true },
  { name: 'فرنچایز منطقه‌ای', icon: 'map', description: 'واگذاری محدوده جغرافیایی به پخش‌کننده با قیمت و کاتالوگ اختصاصی.', features: ['کاتالوگ و قیمت منطقه‌ای', 'کنترل محدوده فروش', 'پورسانت منطقه‌ای'], available: false },
  { name: 'چندشعبه‌ای و B2B2C', icon: 'grid', description: 'مدیریت شعبه‌ها، سبد خرید سازمانی و پورتال کارکنان.', features: ['سفارش‌گیر شعبه‌ای', 'پورتال رفاه کارکنان', 'گزارش تفکیکی شعبه'], available: true },
  { name: 'چندارزی', icon: 'globe', description: 'قیمت‌گذاری و تسویه به ریال، یورو و درهم برای کالاهای وارداتی.', features: ['نرخ ارز روز', 'فاکتور چندارزی', 'تسویه ارزی'], available: false },
  { name: 'فروش قراردادی/پیمانی', icon: 'signature', description: 'قرارداد قیمت سالانه با حجم تعهدی و تخفیف پله‌ای تجمیعی.', features: ['قیمت تضمین‌شده دوره‌ای', 'پایش تحقق تعهد حجمی', 'امضای دیجیتال قرارداد'], available: true },
];

const IntegrationsAdmin = () => {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('connected');
  const [detail, setDetail] = useState<(typeof integrations)[number] | null>(null);
  const [keys, setKeys] = useState([
    { id: 'k-1', label: 'کلید API محیط تست (Sandbox)', value: 'mk_test_9f8c2b7a1e4d6f3a', createdAt: '۱۴۰۴/۰۵/۱۲', scope: 'خواندن کاتالوگ + ثبت سفارش' },
    { id: 'k-2', label: 'کلید API محیط عملیاتی (Production)', value: 'mk_live_2a7f4c9b1d5e8a3c', createdAt: '۱۴۰۴/۰۶/۰۳', scope: 'دسترسی کامل با تأیید مدیریت' },
  ]);

  const filtered = integrations.filter((i) => {
    const term = q.trim();
    if (tab === 'connected' && i.status !== 'connected') return false;
    if (tab === 'available' && i.status === 'connected') return false;
    if (tab === 'models' || tab === 'api') return false;
    if (term && !i.name.includes(term) && !i.description.includes(term) && !i.category.includes(term)) return false;
    return true;
  });

  const apiSample = `POST https://api.bazaromdeh.example/v1/orders
Authorization: Bearer mk_test_9f8c2b7a1e4d6f3a
Content-Type: application/json

{
  "customerId": "c-004",
  "paymentMethod": "credit",
  "items": [
    { "productId": "p-014", "qty": 8 },
    { "productId": "p-032", "qty": 12 }
  ],
  "deliverySlot": "۹ تا ۱۲"
}`;

  const webhookSample = `POST https://your-erp.example/webhooks/bazaromdeh
X-Signature: sha256=<hash>
X-Event: order.confirmed

{
  "event": "order.confirmed",
  "at": "1404-07-20T10:12:00+03:30",
  "data": { "orderCode": "MKT-141902", "grandTotal": 184500000 }
}`;

  return (
    <AdminPage
      title="یکپارچه‌سازی و API"
      subtitle={`${faNum(integrations.filter((i) => i.status === 'connected').length)} سرویس متصل • ${faNum(integrations.length)} یکپارچه‌سازی آماده`}
      icon="server"
      actions={
        <button className="btn-primary btn-sm" onClick={() => toast('درخواست افزودن یکپارچه‌سازی جدید ثبت شد (نمایشی)')}>
          <Icon name="plus" className="h-4 w-4" />
          یکپارچه‌سازی جدید
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="سرویس‌های متصل" value={faNum(integrations.filter((i) => i.status === 'connected').length)} icon="server" />
        <Stat label="فراخوانی API امروز" value={faNum(12_480)} icon="activity" tone="info" />
        <Stat label="نرخ موفقیت فراخوانی‌ها" value="۹۹٫۲٪" icon="check-circle" tone="accent" />
        <Stat label="رویداد وب‌هوک" value={faNum(WEBHOOK_EVENTS.length)} icon="send" tone="vip" />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'connected', label: 'سرویس‌های متصل', icon: 'check-circle' },
          { id: 'available', label: 'آماده اتصال', icon: 'plus' },
          { id: 'models', label: 'مدل‌های کسب‌وکار', icon: 'layers' },
          { id: 'api', label: 'مستندات API و وب‌هوک', icon: 'key' },
        ]}
      />

      {(tab === 'connected' || tab === 'available') && (
        <>
          <AdminToolbar>
            <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی نام سرویس یا دسته…" />
          </AdminToolbar>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((i) => (
              <Card key={i.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      <Icon name={i.icon} className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[13px] font-extrabold">{i.name}</p>
                      <p className="text-[10.5px] text-ink-400">{i.category}</p>
                    </div>
                  </div>
                  <Badge tone={i.status === 'connected' ? 'success' : i.status === 'beta' ? 'warning' : 'neutral'}>
                    {i.status === 'connected' ? 'متصل' : i.status === 'beta' ? 'آزمایشی (Beta)' : 'متصل نشده'}
                  </Badge>
                </div>
                <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{i.description}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">{i.category}</span>
                  <span className="num chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300" dir="ltr">
                    {i.docs}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                  <Switch
                    checked={i.status === 'connected'}
                    onChange={(v) => toast(v ? `اتصال ${i.name} فعال شد (نمایشی)` : `اتصال ${i.name} غیرفعال شد (نمایشی)`)}
                    label="وضعیت اتصال"
                  />
                  <button className="btn-ghost btn-sm" onClick={() => setDetail(i)}>
                    <Icon name="settings" className="h-3.5 w-3.5" />
                    تنظیمات
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'models' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {MODEL_DETAILS.map((m) => (
            <Card key={m.name} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300">
                  <Icon name={m.icon} className="h-5 w-5" />
                </span>
                <p className="text-[12.5px] font-extrabold">{m.name}</p>
              </div>
              <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{m.description}</p>
              <div className="space-y-1.5">
                {m.features.map((f) => (
                  <p key={f} className="flex items-start gap-1.5 text-[11px]">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
                    {f}
                  </p>
                ))}
              </div>
              <Badge tone={m.available ? 'success' : 'neutral'}>{m.available ? 'فعال در دمو' : 'آماده راه‌اندازی'}</Badge>
            </Card>
          ))}
          <Card className="bg-ink-50/70 dark:bg-ink-800/40 md:col-span-2 xl:col-span-4">
            <p className="mb-2 text-[11.5px] font-bold">مدل‌های کسب‌وکار قابل فعال‌سازی در تنظیمات سیستم</p>
            <div className="flex flex-wrap gap-1.5">
              {settings.businessModels.map((m) => (
                <span key={m} className="chip bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300">
                  {m}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'api' && (
        <div className="space-y-3">
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">کلیدهای API</p>
            <TableWrap>
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>کلید</th>
                  <th>دسترسی</th>
                  <th>تاریخ ایجاد</th>
                  <th>اقدام</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="font-semibold">{k.label}</td>
                    <td className="num text-[11px]" dir="ltr">
                      {k.value.slice(0, 12)}…
                    </td>
                    <td className="text-[11px]">{k.scope}</td>
                    <td className="num">{k.createdAt}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <CopyButton text={k.value} label="کپی" />
                        <button
                          className="btn-ghost btn-sm text-rose-600"
                          onClick={() => {
                            setKeys(keys.filter((x) => x.id !== k.id));
                            toast('کلید API باطل شد', 'error');
                          }}
                        >
                          باطل‌کردن
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <button
              className="btn-ghost btn-sm mt-3"
              onClick={() => {
                setKeys([
                  ...keys,
                  {
                    id: `k-${Date.now()}`,
                    label: 'کلید جدید محیط تست',
                    value: `mk_test_${Math.random().toString(16).slice(2, 18)}`,
                    createdAt: jalaliDateTime(new Date()).slice(0, 10),
                    scope: 'خواندن کاتالوگ',
                  },
                ]);
                toast('کلید API جدید ساخته شد');
              }}
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              ساخت کلید جدید
            </button>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-extrabold">نمونه فراخوانی REST API</p>
                <CopyButton text={apiSample} label="کپی نمونه" />
              </div>
              <pre className="num max-h-72 overflow-auto rounded-xl bg-ink-950 p-3 text-[10.5px] leading-6 text-ink-100" dir="ltr">
                {apiSample}
              </pre>
              <p className="mt-2 text-[11px] leading-6 text-ink-500 dark:text-ink-400">
                احراز هویت با Bearer Token، محدودیت نرخ ۶۰۰ درخواست در دقیقه، نسخه‌بندی مسیر (v1)، صفحه‌بندی
                مبتنی بر Cursor و پاسخ استاندارد JSON.
              </p>
            </Card>
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12.5px] font-extrabold">نمونه وب‌هوک</p>
                <CopyButton text={webhookSample} label="کپی نمونه" />
              </div>
              <pre className="num max-h-72 overflow-auto rounded-xl bg-ink-950 p-3 text-[10.5px] leading-6 text-ink-100" dir="ltr">
                {webhookSample}
              </pre>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {WEBHOOK_EVENTS.map((e) => (
                  <span key={e} className="chip bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                    {e}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-ink-50/70 dark:bg-ink-800/40">
            <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
              <span className="font-bold">نکته دمو: </span>
              در نسخه استاتیک، این بخش صرفاً مستندات و کلیدهای نمایشی است و هیچ درخواستی به سرور ارسال نمی‌شود.
              در نسخه عملیاتی، همین قرارداد API برای اتصال به ERP، WMS، TMS، سامانه مودیان و درگاه پرداخت استفاده
              می‌شود.
            </p>
          </Card>
        </div>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`تنظیمات یکپارچه‌سازی — ${detail?.name ?? ''}`}
        size="md"
        footer={
          <div className="flex w-full justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDetail(null)}>
              انصراف
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                toast(`تنظیمات ${detail?.name} ذخیره شد (نمایشی)`);
                setDetail(null);
              }}
            >
              <Icon name="check" className="h-4 w-4" />
              ذخیره تنظیمات
            </button>
          </div>
        }
      >
        {detail && (
          <div className="space-y-3">
            <p className="text-[11.5px] leading-6 text-ink-500 dark:text-ink-400">{detail.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="آدرس سرویس (Endpoint)">
                <input className="input num" dir="ltr" defaultValue={`https://${detail.id}.example/api/v1`} />
              </Field>
              <Field label="کلید احراز هویت">
                <input className="input num" dir="ltr" defaultValue="••••••••••••" type="password" />
              </Field>
              <Field label="دوره همگام‌سازی">
                <select className="select">
                  <option>لحظه‌ای (Real-time)</option>
                  <option>هر ۱۵ دقیقه</option>
                  <option>هر ساعت</option>
                  <option>روزانه</option>
                </select>
              </Field>
              <Field label="جهت همگام‌سازی">
                <select className="select">
                  <option>دو‌طرفه</option>
                  <option>فقط دریافت (Import)</option>
                  <option>فقط ارسال (Export)</option>
                </select>
              </Field>
            </div>
            <Card className="bg-ink-50/70 dark:bg-ink-800/40">
              <p className="mb-2 text-[11.5px] font-bold">قابلیت‌های این یکپارچه‌سازی</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="chip bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300">{detail.category}</span>
                <span className="num chip bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300" dir="ltr">
                  {detail.docs}
                </span>
                {detail.webhookUrl && (
                  <span className="num chip bg-white text-ink-600 dark:bg-ink-900 dark:text-ink-300" dir="ltr">
                    {detail.webhookUrl}
                  </span>
                )}
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </AdminPage>
  );
};

export default IntegrationsAdmin;
