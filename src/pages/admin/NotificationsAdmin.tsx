import { useMemo, useState } from 'react';
import { AdminPage, AdminToolbar, EmptyRow, QuickSearch } from '@/components/AdminUI';
import { Badge, Card, Field, Stat, Switch, TableWrap, Tabs, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDateTime, timeAgo } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { notifications as seedNotifications } from '@/data/crm';
import type { Notification } from '@/lib/types';

const KIND_META: Record<Notification['kind'], { label: string; tone: 'brand' | 'accent' | 'info' | 'warning' | 'vip' | 'success'; icon: string }> = {
  order: { label: 'سفارش', tone: 'brand', icon: 'package' },
  offer: { label: 'کمپین', tone: 'accent', icon: 'tag' },
  system: { label: 'سیستمی', tone: 'info', icon: 'settings' },
  finance: { label: 'مالی', tone: 'warning', icon: 'wallet' },
  logistics: { label: 'لجستیک', tone: 'vip', icon: 'truck' },
  loyalty: { label: 'باشگاه مشتریان', tone: 'success', icon: 'crown' },
};

type Channel = { id: string; label: string; icon: string; description: string; enabled: boolean };

const NotificationsAdmin = () => {
  const notifications = useStore((s) => s.notifications);
  const markAllRead = useStore((s) => s.markNotificationsRead);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('inbox');
  const [channels, setChannels] = useState<Channel[]>([
    { id: 'sms', label: 'پیامک (SMS)', icon: 'message', description: 'ارسال کد ورود، تغییر وضعیت سفارش و یادآوری تسویه', enabled: true },
    { id: 'email', label: 'ایمیل سازمانی', icon: 'mail', description: 'ارسال فاکتور، پیش‌فاکتور و گزارش‌های دوره‌ای', enabled: true },
    { id: 'whatsapp', label: 'واتس‌اپ', icon: 'whatsapp', description: 'ارسال کاتالوگ، پیشنهاد قیمت و تأیید سفارش', enabled: true },
    { id: 'telegram', label: 'تلگرام', icon: 'send', description: 'اطلاع‌رسانی لحظه‌ای به مدیران و تیم فروش', enabled: false },
    { id: 'push', label: 'اعلان مرورگر (PWA)', icon: 'bell', description: 'اعلان‌های مرورگری روی دستگاه کاربر', enabled: true },
    { id: 'inapp', label: 'اعلان درون‌برنامه‌ای', icon: 'alert', description: 'نمایش زنگ اعلان در بالای سایت و پنل', enabled: true },
  ]);

  const all = useMemo(() => [...notifications, ...seedNotifications], [notifications]);

  const filtered = useMemo(() => {
    const term = q.trim();
    return all.filter((n) => {
      if (tab === 'unread' && n.read) return false;
      if (tab === 'admin' && n.audience === 'customer') return false;
      if (tab === 'customer' && n.audience === 'admin') return false;
      if (term && !n.title.includes(term) && !n.body.includes(term)) return false;
      return true;
    });
  }, [all, q, tab]);

  return (
    <AdminPage
      title="اطلاع‌رسانی و کانال‌ها"
      subtitle={`${faNum(all.filter((n) => !n.read).length)} اعلان خوانده‌نشده • ${faNum(channels.filter((c) => c.enabled).length)} کانال فعال`}
      icon="bell"
      actions={
        <>
          <button className="btn-ghost btn-sm" onClick={() => { markAllRead(); toast('همه اعلان‌ها خوانده‌شده شدند'); }}>
            <Icon name="check" className="h-4 w-4" />
            خواندن همه
          </button>
          <button className="btn-primary btn-sm" onClick={() => toast('کمپین اطلاع‌رسانی برای مشتریان منتخب ارسال شد (نمایشی)')}>
            <Icon name="send" className="h-4 w-4" />
            ارسال اطلاع‌رسانی
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="اعلان‌های خوانده‌نشده" value={faNum(all.filter((n) => !n.read).length)} icon="bell" tone="accent" />
        <Stat label="ارسال موفق امروز" value={faNum(184)} icon="send" tone="info" hint="پیامک، ایمیل و پیام‌رسان" />
        <Stat label="کانال‌های فعال" value={faNum(channels.filter((c) => c.enabled).length)} icon="globe" />
        <Stat label="نرخ بازکردن پیام" value="۴۱٪" icon="trend" tone="vip" />
      </div>

      <AdminToolbar>
        <QuickSearch value={q} onChange={setQ} placeholder="جست‌وجوی عنوان یا متن اعلان…" />
        <Tabs
          size="sm"
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'inbox', label: 'همه اعلان‌ها', count: all.length },
            { id: 'unread', label: 'خوانده‌نشده', count: all.filter((n) => !n.read).length },
            { id: 'admin', label: 'پنل مدیریت' },
            { id: 'customer', label: 'مشتریان' },
          ]}
        />
      </AdminToolbar>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <TableWrap>
          <thead>
            <tr>
              <th>عنوان</th>
              <th>نوع</th>
              <th>مخاطب</th>
              <th>زمان</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <EmptyRow colSpan={5} text="اعلانی با این فیلترها یافت نشد" />
            ) : (
              filtered.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
                        <Icon name={KIND_META[n.kind].icon} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-[11px] leading-5 text-ink-500 dark:text-ink-400">{n.body}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={KIND_META[n.kind].tone}>{KIND_META[n.kind].label}</Badge>
                  </td>
                  <td className="text-[11px]">{n.audience === 'admin' ? 'پنل مدیریت' : n.audience === 'customer' ? 'مشتری' : 'هر دو'}</td>
                  <td className="text-[11px] text-ink-400">{timeAgo(n.at)}</td>
                  <td>
                    <Badge tone={n.read ? 'neutral' : 'accent'}>{n.read ? 'خوانده‌شده' : 'جدید'}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>

        <div className="space-y-3">
          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">کانال‌های ارتباطی</p>
            <div className="space-y-1">
              {channels.map((c) => (
                <Switch
                  key={c.id}
                  checked={c.enabled}
                  onChange={(v) => {
                    setChannels(channels.map((x) => (x.id === c.id ? { ...x, enabled: v } : x)));
                    toast(v ? `کانال ${c.label} فعال شد` : `کانال ${c.label} غیرفعال شد`);
                  }}
                  label={c.label}
                  description={c.description}
                />
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-3 text-[12.5px] font-extrabold">ارسال اعلان دستی</p>
            <div className="space-y-3">
              <Field label="مخاطب">
                <select className="select">
                  <option>همه مشتریان</option>
                  <option>مشتریان VIP</option>
                  <option>مشتریان با خرید بیش از ۵۰ میلیون</option>
                  <option>مشتریان غیرفعال بیش از ۶۰ روز</option>
                  <option>تیم فروش داخلی</option>
                </select>
              </Field>
              <Field label="کانال ارسال">
                <select className="select">
                  <option>پیامک</option>
                  <option>ایمیل</option>
                  <option>واتس‌اپ</option>
                  <option>اعلان درون‌برنامه‌ای</option>
                </select>
              </Field>
              <Field label="متن پیام" hint="متغیرها: {نام‌فروشگاه}، {مبلغ}، {کدسفارش}">
                <textarea rows={3} className="input" defaultValue="سلام {نام‌فروشگاه} عزیز، کمپین ویژه لبنیات تا پایان هفته با ۱۲٪ تخفیف عمده فعال است." />
              </Field>
              <button className="btn-primary w-full" onClick={() => toast('اعلان برای مخاطبان انتخاب‌شده صف‌بندی شد (نمایشی)')}>
                <Icon name="send" className="h-4 w-4" />
                ارسال اعلان
              </button>
            </div>
          </Card>

          <Card className="bg-ink-50/70 dark:bg-ink-800/40">
            <p className="mb-2 text-[12px] font-extrabold">آخرین گزارش‌های ارسال</p>
            <TableWrap>
              <thead>
                <tr>
                  <th>کانال</th>
                  <th>ارسال</th>
                  <th>تحویل</th>
                  <th>خطا</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['پیامک', 120, 117, 3],
                  ['ایمیل', 84, 80, 4],
                  ['واتس‌اپ', 46, 44, 2],
                  ['اعلان مرورگر', 210, 186, 24],
                ].map(([ch, sent, delivered, failed]) => (
                  <tr key={ch as string}>
                    <td>{ch}</td>
                    <td className="num">{faNum(sent as number)}</td>
                    <td className="num text-emerald-600 dark:text-emerald-400">{faNum(delivered as number)}</td>
                    <td className="num text-rose-600 dark:text-rose-400">{faNum(failed as number)}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="num mt-2 text-[10.5px] text-ink-400">آخرین ارسال: {jalaliDateTime(new Date(Date.now() - 3600_000))}</p>
          </Card>
        </div>
      </div>

      <Card className="bg-ink-50/70 dark:bg-ink-800/40">
        <p className="text-[11.5px] leading-6 text-ink-600 dark:text-ink-300">
          <span className="font-bold">توجه: </span>
          ارسال واقعی پیامک، ایمیل و پیام‌رسان در این دمو غیرفعال است؛ تمام کانال‌ها شبیه‌سازی شده‌اند و هیچ داده‌ای
          از مرورگر خارج نمی‌شود.
        </p>
      </Card>
    </AdminPage>
  );
};

export default NotificationsAdmin;
