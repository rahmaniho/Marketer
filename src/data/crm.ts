import type {
  AdminUser,
  AuditLog,
  Contract,
  Lead,
  LoyaltyAccount,
  Notification,
  Permission,
  RFQ,
  Role,
  RoleId,
  Ticket,
  Visit,
} from '@/lib/types';
import { mulberry32 } from '@/lib/random';
import { customers } from './ops';
import { products, productById } from './products';
import { brandName } from './brands';

const rand = mulberry32(99123);
const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const iso = (daysAgo: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, ri(0, 59), 0, 0);
  return d.toISOString();
};

// ───────────────────────────────────────────────────────────── نقش‌ها و دسترسی‌ها (RBAC)
export const roles: Role[] = [
  {
    id: 'superadmin',
    name: 'سوپرادمین',
    description: 'دسترسی کامل به تمام بخش‌های پلتفرم شامل تنظیمات، کاربران و لاگ‌ها',
    color: '#0f684c',
    permissions: [
      'dashboard.view',
      'brand.manage',
      'product.manage',
      'offer.manage',
      'customer.manage',
      'customer.approve',
      'order.manage',
      'order.status',
      'warehouse.manage',
      'supplier.manage',
      'report.export',
      'user.manage',
      'audit.view',
      'settings.manage',
      'content.manage',
    ],
  },
  {
    id: 'sales-manager',
    name: 'مدیر فروش',
    description: 'مدیریت کاتالوگ، آفرها، مشتریان، سفارش‌ها و گزارش‌های فروش',
    color: '#1d4ed8',
    permissions: [
      'dashboard.view',
      'brand.manage',
      'product.manage',
      'offer.manage',
      'customer.manage',
      'customer.approve',
      'order.manage',
      'order.status',
      'report.export',
      'content.manage',
    ],
  },
  {
    id: 'operator',
    name: 'اپراتور سفارش',
    description: 'ثبت و پردازش سفارش‌ها، پاسخ به تیکت‌ها و استعلام قیمت',
    color: '#b45309',
    permissions: ['dashboard.view', 'order.manage', 'order.status', 'customer.manage'],
  },
  {
    id: 'warehouse',
    name: 'انباردار',
    description: 'مدیریت موجودی، بچ‌ها، پالت‌بندی و ارسال',
    color: '#0e7490',
    permissions: ['dashboard.view', 'warehouse.manage', 'order.status', 'report.export'],
  },
  {
    id: 'finance',
    name: 'کارشناس مالی',
    description: 'کنترل اعتبار، تسویه، چک، فاکتور و گزارش‌های مالی',
    color: '#6d28d9',
    permissions: ['dashboard.view', 'order.manage', 'report.export', 'customer.manage'],
  },
  {
    id: 'rep',
    name: 'ویزیتور / بازاریاب',
    description: 'مدیریت سرنخ‌ها، ویزیت میدانی و ثبت سفارش برای مشتریان',
    color: '#be185d',
    permissions: ['dashboard.view', 'customer.manage', 'order.manage'],
  },
  {
    id: 'supplier',
    name: 'پورتال تأمین‌کننده',
    description: 'مشاهده سفارش‌های مرتبط، موجودی و به‌روزرسانی قیمت پیشنهادی',
    color: '#334155',
    permissions: ['dashboard.view', 'product.manage'],
  },
];

export const roleById = (id: RoleId) => roles.find((r) => r.id === id) ?? roles[0];

export const permissionLabels: Record<Permission, string> = {
  'dashboard.view': 'مشاهده داشبورد',
  'brand.manage': 'مدیریت برندها',
  'product.manage': 'مدیریت محصولات',
  'offer.manage': 'مدیریت آفرها',
  'customer.manage': 'مدیریت مشتریان',
  'customer.approve': 'تأیید مدارک مشتری',
  'order.manage': 'مدیریت سفارش‌ها',
  'order.status': 'تغییر وضعیت سفارش',
  'warehouse.manage': 'مدیریت انبار',
  'supplier.manage': 'مدیریت تأمین‌کنندگان',
  'report.export': 'خروجی گزارش',
  'user.manage': 'مدیریت کاربران',
  'audit.view': 'مشاهده لاگ عملیات',
  'settings.manage': 'تنظیمات سیستم',
  'content.manage': 'مدیریت محتوا',
};

export const adminUsers: AdminUser[] = [
  ['مدیر ارشد سیستم', '09120000001', 'admin@marketer.demo', 'superadmin', 'تهران'],
  ['لیلا فراهانی', '09120000002', 'sales@marketer.demo', 'sales-manager', 'تهران'],
  ['سارا حسینی', '09120000003', 'sara@marketer.demo', 'rep', 'تهران'],
  ['کامران راد', '09120000004', 'kamran@marketer.demo', 'rep', 'اصفهان'],
  ['الهام قاسمی', '09120000005', 'elham@marketer.demo', 'rep', 'شیراز'],
  ['نیما برزگر', '09120000006', 'ops@marketer.demo', 'operator', 'تهران'],
  ['حسین داودی', '09120000007', 'warehouse@marketer.demo', 'warehouse', 'تهران'],
  ['مریم کیانی', '09120000008', 'finance@marketer.demo', 'finance', 'تهران'],
  ['آرش ولایتی', '09120000009', 'supplier@marketer.demo', 'supplier', 'مشهد'],
].map((u, i) => ({
  id: `u-${String(i + 1).padStart(3, '0')}`,
  fullName: u[0] as string,
  mobile: u[1] as string,
  email: u[2] as string,
  roleId: u[3] as RoleId,
  avatarColor: ['#0f684c', '#1d4ed8', '#be185d', '#b45309', '#0e7490', '#6d28d9'][i % 6],
  twoFactorEnabled: i % 3 !== 2,
  ssoProvider: i % 4 === 0 ? 'Microsoft Entra ID (Mock)' : undefined,
  lastLogin: iso(ri(0, 6), ri(8, 20)),
  status: i === 8 ? 'disabled' : 'active',
  city: u[4] as string,
}));

export const adminUserById = (id: string) => adminUsers.find((u) => u.id === id);

// ───────────────────────────────────────────────────────────── لاگ عملیات
const AUDIT_ACTIONS: [string, string, AuditLog['severity']][] = [
  ['ویرایش قیمت پایه', 'Product', 'warning'],
  ['ایجاد محصول جدید', 'Product', 'info'],
  ['غیرفعال‌سازی برند', 'Brand', 'critical'],
  ['تأیید مدارک مشتری', 'Customer', 'info'],
  ['تغییر سقف اعتبار', 'Customer', 'warning'],
  ['تغییر وضعیت سفارش', 'Order', 'info'],
  ['لغو سفارش', 'Order', 'critical'],
  ['ثبت تخفیف دستی', 'Order', 'warning'],
  ['ورود به سیستم', 'Auth', 'info'],
  ['تلاش ناموفق ورود', 'Auth', 'critical'],
  ['ایجاد کمپین', 'Offer', 'info'],
  ['اصلاح موجودی انبار', 'Inventory', 'warning'],
  ['پذیرش مرجوعی', 'Return', 'warning'],
  ['خروجی گزارش فروش', 'Report', 'info'],
  ['ویرایش تنظیمات مالیات', 'Settings', 'critical'],
];

export const auditLogs: AuditLog[] = Array.from({ length: 64 }, (_, i) => {
  const [action, entity, severity] = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const user = adminUsers[i % adminUsers.length];
  const product = products[(i * 7) % products.length];
  const customer = customers[(i * 5) % customers.length];
  return {
    id: `log-${String(i + 1).padStart(4, '0')}`,
    at: iso(i % 14, 8 + (i % 12)),
    userId: user.id,
    userName: user.fullName,
    roleId: user.roleId,
    action,
    entity,
    entityId: entity === 'Product' ? product.id : entity === 'Customer' ? customer.id : `o-${100 + i}`,
    detail:
      entity === 'Product'
        ? `محصول «${product.name}» — مقدار جدید: ${(product.basePrice / 1000).toFixed(0)} هزار تومان`
        : entity === 'Customer'
          ? `مشتری «${customer.storeName}» توسط ${user.fullName}`
          : `${action} روی ${entity} شماره ${100 + i}`,
    ip: `10.20.${ri(1, 40)}.${ri(2, 250)}`,
    severity,
  };
});

// ───────────────────────────────────────────────────────────── استعلام قیمت (RFQ)
const RFQ_ITEMS = [
  'سس مایونز ۵۰۰ گرمی — ماهانه ۱۲۰ کارتن',
  'برنج ایرانی درجه یک — ۲ تن',
  'روغن سرخ‌کردنی ۱۶ کیلویی — ۶۰ حلب',
  'کنسرو تن ماهی — تیراژ بالا جهت رستوران',
  'شکلات تلخ ۱۰۰ گرمی — ۲۰۰ کارتن',
  'پنیر پیتزا ورقه‌ای — ۱۵۰ بسته',
  'چای کیسه‌ای ۱۰۰ عددی — ۸۰ کارتن',
  'دستمال کاغذی جعبه‌ای — ۳۰۰ کارتن',
  'ماکارونی ۷۰۰ گرمی — ۲۴۰ کارتن',
  'قند حبه‌ای ۱۰ کیلویی — ۱۲۰ کیسه',
];

export const rfqs: RFQ[] = Array.from({ length: 22 }, (_, i) => {
  const customer = customers[(i * 3) % customers.length];
  const status = (['new', 'quoted', 'accepted', 'rejected', 'expired'] as const)[i % 5];
  const itemCount = ri(1, 3);
  return {
    id: `rfq-${String(i + 1).padStart(3, '0')}`,
    code: `RFQ-${2400 + i * 5}`,
    customerId: customer.id,
    customerName: customer.storeName,
    branchName: i % 3 === 0 ? `شعبه ${['مرکزی', 'شمال', 'غرب', 'شرق'][i % 4]}` : undefined,
    items: Array.from({ length: itemCount }, (_, k) => ({
      title: RFQ_ITEMS[(i + k) % RFQ_ITEMS.length],
      brandHint: ['مینو', 'کاله', 'مهرام', 'گلستان', 'یک و یک', 'نستله'][(i + k) % 6],
      qty: ri(20, 400),
      unit: (['کارتن', 'شرینک', 'پالت'] as const)[(i + k) % 3],
      targetPrice: ri(400, 4000) * 1000,
      note: k === 0 ? 'امکان تحویل مرحله‌ای وجود دارد.' : undefined,
    })),
    status,
    createdAt: iso(ri(1, 45)),
    validUntil: iso(-ri(1, 14)),
    quotedTotal: status === 'new' ? undefined : ri(60, 900) * 1_000_000,
    quotedBy: status === 'new' ? undefined : adminUsers[i % adminUsers.length].fullName,
    note: 'درخواست برآورد قیمت برای قرارداد فصلی؛ نیاز به تسویه ۴۵ روزه.',
    priority: (['low', 'normal', 'high'] as const)[i % 3],
  };
});

// ───────────────────────────────────────────────────────────── سرنخ‌های فروش
export const leads: Lead[] = Array.from({ length: 34 }, (_, i) => {
  const storeNames = [
    'سوپرمارکت پارسیان',
    'رستوران کباب سنتی',
    'هایپرمارکت آفتاب شرق',
    'کافه نخل',
    'قنادی قند و عسل',
    'بازار روز شهریار',
    'پخش عمده آریا',
    'سوپرمارکت نگین',
    'هتل درویشی',
    'فست‌فود پیتزا ۲۴',
  ];
  const reps = adminUsers.filter((u) => u.roleId === 'rep');
  const rep = reps[i % reps.length];
  return {
    id: `ld-${String(i + 1).padStart(3, '0')}`,
    storeName: `${storeNames[i % storeNames.length]} ${['شمال', 'جنوب', 'مرکزی', 'غرب'][i % 4]}`,
    ownerName: ['رضا', 'مهدی', 'سعید', 'نگار', 'الهام', 'حمید', 'پویا'][i % 7] + ' ' + ['کریمی', 'موسوی', 'صادقی', 'رستمی', 'اکبری'][i % 5],
    mobile: `0912${String(3450000 + i * 137).slice(0, 7)}`,
    city: ['تهران', 'کرج', 'اصفهان', 'مشهد', 'شیراز', 'رشت'][i % 6],
    kind: (['سوپرمارکت', 'رستوران', 'عمده‌فروش', 'کافه', 'قنادی', 'هایپرمارکت'] as const)[i % 6],
    source: (['وب‌سایت', 'تماس ورودی', 'ویزیت میدانی', 'معرفی مشتری', 'نمایشگاه', 'اینستاگرام'] as const)[i % 6],
    score: ri(28, 96),
    stage: (['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'] as const)[i % 6],
    estimatedValue: ri(60, 1200) * 1_000_000,
    assignedRepId: rep.id,
    createdAt: iso(ri(1, 90)),
    lastActivity: iso(ri(0, 12)),
    note: 'علاقه‌مند به قرارداد تأمین ماهانه لبنیات و نوشیدنی با تسویه ۳۰ روزه.',
  };
});

// ───────────────────────────────────────────────────────────── ویزیت میدانی
export const visits: Visit[] = Array.from({ length: 40 }, (_, i) => {
  const reps = adminUsers.filter((u) => u.roleId === 'rep');
  const rep = reps[i % reps.length];
  const lead = leads[i % leads.length];
  const customer = customers[i % customers.length];
  const status = (['planned', 'done', 'done', 'canceled', 'missed'] as const)[i % 5];
  return {
    id: `vs-${String(i + 1).padStart(3, '0')}`,
    leadId: status === 'done' && i % 2 === 0 ? lead.id : undefined,
    customerId: i % 2 === 1 ? customer.id : undefined,
    customerName: i % 2 === 1 ? customer.storeName : lead.storeName,
    repId: rep.id,
    repName: rep.fullName,
    plannedAt: iso(ri(-5, 12), ri(8, 17)),
    doneAt: status === 'done' ? iso(ri(0, 10), ri(9, 17)) : undefined,
    status,
    purpose: ['معرفی پلتفرم و ثبت‌نام', 'پیگیری سفارش', 'ارائه تخفیف فصلی', 'وصول چک', 'بررسی مرجوعی'][i % 5],
    outcome: status === 'done' ? ['سفارش ثبت شد', 'مشتری درخواست پیش‌فاکتور کرد', 'قرارداد امضا شد', 'نیاز به پیگیری مجدد'][i % 4] : '—',
    nextAction: status === 'done' ? ['تماس هفته آینده', 'ارسال لیست قیمت جدید', 'هماهنگی تحویل'][i % 3] : 'پیگیری تلفنی',
    geo: { lat: 35.6 + rand() * 0.9, lng: 51.2 + rand() * 1.1 },
    distanceKm: ri(3, 42),
    photoSeeds: status === 'done' ? ['store-front', 'shelf', 'invoice'] : [],
    orderPlaced: status === 'done' && i % 3 === 0,
    orderAmount: status === 'done' && i % 3 === 0 ? ri(8, 120) * 1_000_000 : 0,
  };
});

// ───────────────────────────────────────────────────────────── قراردادهای قیمت پیمانی
export const contracts: Contract[] = Array.from({ length: 16 }, (_, i) => {
  const customer = customers[(i * 5) % customers.length];
  const chosen = [products[(i * 3) % products.length], products[(i * 7 + 11) % products.length]];
  return {
    id: `ct-${String(i + 1).padStart(3, '0')}`,
    code: `CT-${1400 + i * 3}`,
    customerId: customer.id,
    customerName: customer.storeName,
    title: `قرارداد تأمین ${['لبنیات', 'نوشیدنی', 'خشکبار و چای', 'کنسرو و رب', 'تنقلات', 'روغن و سس'][i % 6]} — سال ${['۱۴۰۴', '۱۴۰۵'][i % 2]}`,
    productIds: chosen.map((p) => p.id),
    discountPercent: [4, 5, 6, 7, 8][i % 5],
    minMonthlyQty: [40, 80, 120, 200][i % 4],
    startsAt: iso(ri(90, 300)),
    endsAt: iso(-ri(10, 240)),
    status: (['active', 'active', 'expiring', 'expired', 'draft'] as const)[i % 5],
    signedBy: customer.ownerName,
    signedAt: iso(ri(80, 280)),
    signatureHash: `SHA256-${(i * 98765).toString(16)}${(i * 4321).toString(16)}`,
    attachment: `contract-${1400 + i * 3}.pdf`,
    settlement: ['۳۰ روزه', '۴۵ روزه', 'نقدی', 'چک ۶۰ روزه'][i % 4],
    note: 'قیمت پیمانی روی اقلام منتخب اعمال و مازاد بر آفرهای عمومی محاسبه می‌شود.',
  };
});

// ───────────────────────────────────────────────────────────── تیکت و پشتیبانی
const TICKET_SUBJECTS: [string, Ticket['category']][] = [
  ['مغایرت در تعداد کارتن ارسالی', 'لجستیک'],
  ['درخواست فاکتور رسمی و مهر و امضا', 'مالی'],
  ['کیفیت نامناسب یک بچ از محصول', 'کیفیت'],
  ['خطا در اعمال تخفیف پله‌ای', 'سفارش'],
  ['درخواست افزایش سقف اعتبار', 'مالی'],
  ['راهنمایی برای ثبت سفارش دوره‌ای', 'فنی'],
  ['پیشنهاد افزودن کالای جدید به کاتالوگ', 'پیشنهاد'],
  ['تأخیر در تحویل سفارش', 'لجستیک'],
];

export const tickets: Ticket[] = Array.from({ length: 26 }, (_, i) => {
  const customer = customers[(i * 2) % customers.length];
  const [subject, category] = TICKET_SUBJECTS[i % TICKET_SUBJECTS.length];
  const status = (['open', 'pending', 'closed', 'closed'] as const)[i % 4];
  const createdAt = iso(ri(1, 30), ri(8, 18));
  return {
    id: `tk-${String(i + 1).padStart(3, '0')}`,
    code: `TK-${5100 + i * 3}`,
    customerId: customer.id,
    customerName: customer.storeName,
    subject,
    category,
    priority: (['low', 'normal', 'high'] as const)[i % 3],
    status,
    createdAt,
    updatedAt: iso(ri(0, 4), ri(9, 19)),
    channel: (['چت', 'تلفن', 'ایمیل', 'فرم سایت'] as const)[i % 4],
    messages: [
      { from: 'customer', name: customer.ownerName, text: subject, at: createdAt },
      {
        from: 'agent',
        name: 'پشتیبانی بازارعمده',
        text: 'سلام، درخواست شما ثبت شد. بررسی توسط کارشناس مربوطه در حال انجام است و نتیجه تا ۲۴ ساعت آینده اعلام می‌شود.',
        at: iso(ri(1, 20), ri(9, 18)),
      },
      ...(status === 'closed'
        ? [{ from: 'agent' as const, name: 'پشتیبانی بازارعمده', text: 'موضوع بررسی و اصلاح شد. فاکتور اصلاحی صادر و برای شما ارسال گردید. از همراهی شما سپاسگزاریم.', at: iso(ri(0, 3), ri(10, 18)) }]
        : []),
    ],
    npsScore: status === 'closed' ? ri(6, 10) : undefined,
  };
});

// ───────────────────────────────────────────────────────────── اطلاع‌رسانی
export const notifications: Notification[] = [
  ['سفارش جدید ثبت شد', 'سفارش MKT-141200 از سوپرمارکت آفتاب به ارزش ۱۸.۴ میلیون تومان ثبت شد.', 'order', 'admin', false],
  ['موجودی روغن لادن بحرانی شد', 'موجودی روغن سرخ‌کردنی به زیر نقطه سفارش رسید؛ نسبت به ثبت سفارش خرید اقدام کنید.', 'system', 'admin', false],
  ['چک سررسید نزدیک است', 'چک مشتری «پخش کاسپین» تا ۵ روز دیگر سررسید می‌شود.', 'finance', 'admin', false],
  ['مدارک مشتری در انتظار تأیید', 'مدارک «سوپرمارکت هفت‌خوان» ارسال شده و در انتظار بررسی است.', 'system', 'admin', false],
  ['آفر جدید رمضان فعال شد', 'کمپین ۱۰٪ رمضان روی سبد افطاری فعال شد.', 'offer', 'both', true],
  ['سفارش شما ارسال شد', 'سفارش MKT-141900 با راننده کاظم رحیمی به مقصد تهران ارسال شد.', 'logistics', 'customer', false],
  ['امتیاز باشگاه مشتریان', 'با خرید اخیر ۱۲۰۰ امتیاز به حساب شما اضافه شد.', 'loyalty', 'customer', false],
  ['پیش‌فاکتور آماده دریافت است', 'پیش‌فاکتور سفارش دوره‌ای شما صادر شد.', 'order', 'customer', true],
].map((n, i) => ({
  id: `nt-${String(i + 1).padStart(3, '0')}`,
  title: n[0] as string,
  body: n[1] as string,
  kind: n[2] as Notification['kind'],
  audience: n[3] as Notification['audience'],
  read: n[4] as boolean,
  at: iso(ri(0, 6), ri(8, 19)),
}));

// ───────────────────────────────────────────────────────────── باشگاه مشتریان
export const loyalty: LoyaltyAccount = {
  customerId: 'c-001',
  points: 18420,
  tier: 'VIP طلایی',
  nextTierPoints: 25000,
  referralCode: 'MARKETER-AFTAB',
  referralCount: 12,
  referralEarnings: 4_800_000,
  history: Array.from({ length: 14 }, (_, i) => ({
    at: iso(i * 6 + 1),
    title: ['خرید سبد لبنیات', 'خرید نوشیدنی', 'معرفی مشتری جدید', 'خرید خشکبار', 'تسویه نقدی'][i % 5],
    points: (i % 5 === 2 ? 1 : -1) * ri(120, 2400),
    kind: i % 5 === 2 ? ('earn' as const) : (['earn', 'spend'] as const)[i % 2],
  })),
  rewards: [
    { id: 'rw-1', title: 'تخفیف ۵٪ مازاد', points: 5000, description: 'تخفیف مازاد ۵٪ روی یک سفارش تا سقف ۲۰ میلیون تومان', image: 'discount' },
    { id: 'rw-2', title: 'ارسال رایگان یک ماهه', points: 8000, description: 'ارسال رایگان تمام سفارش‌های یک ماه در محدوده تهران', image: 'truck' },
    { id: 'rw-3', title: 'بازدید نمایشگاه صنعت غذا', points: 12000, description: 'دعوت‌نامه دو نفره نمایشگاه بین‌المللی صنایع غذایی', image: 'ticket' },
    { id: 'rw-4', title: 'مشاوره اختصاصی چیدمان قفسه', points: 15000, description: 'یک جلسه مشاوره حضوری کارشناس فروش و چیدمان قفسه', image: 'advisor' },
  ],
};

export const crmStats = {
  totalPointsIssued: 1_240_000,
  pointsRedeemed: 512_000,
  referredCustomers: 268,
  avgPointsPerOrder: 640,
};

export const contractProductNames = (ids: string[]) =>
  ids.map((id) => `${productById(id)?.name ?? ''} (${brandName(productById(id)?.brandId ?? '')})`).join(' ، ');
