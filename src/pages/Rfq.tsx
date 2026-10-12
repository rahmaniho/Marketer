import { useState } from 'react';
import { Badge, Card, DemoNote, EmptyState, Field, SectionTitle, useToast } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { faNum, jalaliDate, toman } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { rfqs as mockRfqs } from '@/data/crm';
import type { RFQ } from '@/lib/types';

interface ItemDraft {
  title: string;
  brandHint: string;
  qty: number;
  unit: 'کارتن' | 'شرینک' | 'پالت' | 'بسته' | 'کیسه' | 'حلقه';
  targetPrice: number;
  note: string;
}

const emptyItem: ItemDraft = { title: '', brandHint: '', qty: 50, unit: 'کارتن', targetPrice: 0, note: '' };

const Rfq = () => {
  const customer = useStore((s) => s.customer);
  const myRfqs = useStore((s) => s.rfqs);
  const addRfq = useStore((s) => s.addRfq);
  const { toast } = useToast();
  const [items, setItems] = useState<ItemDraft[]>([{ ...emptyItem }]);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [note, setNote] = useState('');

  const all: RFQ[] = [...myRfqs, ...mockRfqs.slice(0, 6)];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    const valid = items.filter((i) => i.title.trim().length > 2);
    if (valid.length === 0) {
      toast('حداقل یک ردیف کالا با عنوان مشخص وارد کنید', 'error');
      return;
    }
    const rfq: RFQ = {
      id: `rfq-new-${Date.now()}`,
      code: `RFQ-${9000 + myRfqs.length * 7}`,
      customerId: customer.id,
      customerName: customer.storeName,
      items: valid.map((v) => ({ ...v, targetPrice: v.targetPrice || undefined })),
      status: 'new',
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      note,
      priority,
    };
    addRfq(rfq);
    setItems([{ ...emptyItem }]);
    setNote('');
    toast(`درخواست استعلام ${rfq.code} ثبت شد؛ کارشناس فروش حداکثر ۲ ساعت کاری پاسخ می‌دهد`);
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        title="درخواست استعلام قیمت (RFQ)"
        subtitle="برای تیراژ بالا، قرارداد فصلی یا کالای سفارشی — قیمت اختصاصی دریافت کنید"
        icon="clipboard"
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl2 border border-ink-200 p-3 dark:border-ink-700">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[12px] font-extrabold">ردیف {faNum(idx + 1)}</p>
                    {items.length > 1 && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        onClick={() => setItems((s) => s.filter((_, i) => i !== idx))}
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Field label="عنوان کالا / شرح درخواست" required>
                      <input
                        value={item.title}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))}
                        placeholder="مثال: سس مایونز ۵۰۰ گرمی"
                        className="input"
                      />
                    </Field>
                    <Field label="برند پیشنهادی (اختیاری)">
                      <input
                        value={item.brandHint}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, brandHint: e.target.value } : x)))}
                        placeholder="مثال: مهرام یا معادل"
                        className="input"
                      />
                    </Field>
                    <Field label="تعداد درخواستی">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))}
                        className="input num"
                      />
                    </Field>
                    <Field label="واحد">
                      <select
                        value={item.unit}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, unit: e.target.value as ItemDraft['unit'] } : x)))}
                        className="select"
                      >
                        {['کارتن', 'شرینک', 'پالت', 'بسته', 'کیسه', 'حلقه'].map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="قیمت هدف شما (اختیاری)" hint="اگر قیمت مشخصی مدنظر دارید وارد کنید تا پیشنهاد متناسب ارائه شود.">
                      <input
                        type="number"
                        value={item.targetPrice || ''}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, targetPrice: Number(e.target.value) } : x)))}
                        className="input num"
                      />
                    </Field>
                    <Field label="توضیح تکمیلی">
                      <input
                        value={item.note}
                        onChange={(e) => setItems((s) => s.map((x, i) => (i === idx ? { ...x, note: e.target.value } : x)))}
                        placeholder="مثال: تحویل مرحله‌ای ماهانه"
                        className="input"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn-ghost w-full" onClick={() => setItems((s) => [...s, { ...emptyItem }])}>
              <Icon name="plus" className="h-4 w-4" />
              افزودن ردیف کالا
            </button>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="اولویت درخواست">
                <select value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')} className="select">
                  <option value="low">عادی — تا ۲ روز کاری</option>
                  <option value="normal">معمول — تا ۲ ساعت کاری</option>
                  <option value="high">فوری — تماس در کمتر از ۳۰ دقیقه</option>
                </select>
              </Field>
              <Field label="توضیح کلی درخواست">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: قرارداد فصلی با تسویه ۴۵ روزه" className="input" />
              </Field>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1">
                <Icon name="send" className="h-4 w-4" />
                ثبت درخواست استعلام
              </button>
              <button type="button" className="btn-ghost" onClick={() => setItems([{ ...emptyItem }])}>
                پاک کردن فرم
              </button>
            </div>
          </form>

          <DemoNote>
            در نسخه دمو، استعلام‌ها فقط در مرورگر شما ثبت می‌شوند و به تیمی ارسال نمی‌شوند. در نسخه عملیاتی، درخواست
            به‌صورت خودکار به کارشناس فروش منطقه و پورتال تأمین‌کننده ارجاع داده می‌شود.
          </DemoNote>
        </Card>

        <div className="space-y-3">
          <Card>
            <p className="mb-2.5 text-[13px] font-extrabold">درخواست‌های استعلام شما</p>
            {all.length === 0 ? (
              <EmptyState icon="clipboard" title="استعلامی ثبت نشده" description="با فرم روبه‌رو اولین درخواست را ثبت کنید." />
            ) : (
              <div className="space-y-2.5">
                {all.slice(0, 8).map((r) => (
                  <div key={r.id} className="rounded-xl border border-ink-200 p-3 dark:border-ink-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="num text-[12px] font-extrabold">{r.code}</span>
                      <Badge
                        tone={r.status === 'new' ? 'warning' : r.status === 'quoted' ? 'info' : r.status === 'accepted' ? 'success' : 'neutral'}
                      >
                        {r.status === 'new' ? 'در انتظار پاسخ' : r.status === 'quoted' ? 'پیشنهاد ارسال شد' : r.status === 'accepted' ? 'پذیرفته‌شده' : r.status === 'rejected' ? 'رد شده' : 'منقضی'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11.5px] text-ink-600 dark:text-ink-300">{r.items.length} ردیف کالا — {r.customerName}</p>
                    <p className="num mt-1 text-[10.5px] text-ink-400">
                      ثبت: {jalaliDate(r.createdAt)} • اعتبار تا {jalaliDate(r.validUntil)}
                      {r.quotedTotal ? ` • پیشنهاد: ${toman(r.quotedTotal, false)} تومان` : ''}
                    </p>
                    {r.quotedBy && <p className="text-[10.5px] text-ink-400">کارشناس: {r.quotedBy}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-2 text-[13px] font-extrabold">مزایای خرید با استعلام</p>
            <ul className="space-y-1.5 text-[11.5px] text-ink-600 dark:text-ink-300">
              {[
                'قیمت اختصاصی برای تیراژ بالا و قرارداد فصلی',
                'امکان تعیین شرایط تسویه (نقدی/اعتباری/چک)',
                'اولویت در تخصیص موجودی انبار',
                'ارائه پیشنهاد جایگزین در صورت کمبود کالا',
                'قابلیت تبدیل به قرارداد قیمت پیمانی',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Icon name="check-circle" className="mt-0.5 h-3.5 w-3.5 flex-none text-brand-600" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rfq;
