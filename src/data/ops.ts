import type {
  Batch,
  Customer,
  Driver,
  InventoryRecord,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Shipment,
  Supplier,
  Warehouse,
} from '@/lib/types';
import { mulberry32 } from '@/lib/random';
import { products } from './products';
import { brandName } from './brands';

const rand = mulberry32(775511);
const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const iso = (daysAgo: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, ri(0, 59), 0, 0);
  return d.toISOString();
};

// ───────────────────────────────────────────────────────────── رانندگان (پیش از سفارش‌ها استفاده می‌شود)
const DRIVER_SEEDS = [
  ['کاظم رحیمی', '09121234501', 'کامیونت ایویکو', 'ایران ۴۲ - ۵۵۳ ع ۲۱', 6000, 'تهران و حومه', 4.8, 'on-route'],
  ['مهدی نجفی', '09121234502', 'خاور مسقف', 'ایران ۴۲ - ۸۱۲ ع ۲۱', 4500, 'تهران/کرج', 4.6, 'available'],
  ['یوسف کریمی', '09121234503', 'کامیون یخچال‌دار', 'ایران ۳۶ - ۱۱۴ ب ۹۹', 9000, 'خراسان رضوی', 4.9, 'on-route'],
  ['اسماعیل پورمحمدی', '09121234504', 'کامیونت ایسوزو', 'ایران ۷۳ - ۴۵۵ ع ۸۵', 5500, 'فارس', 4.5, 'available'],
  ['جواد شعبانی', '09121234505', 'خاور مسقف', 'ایران ۴۲ - ۲۲۱ ع ۲۱', 4000, 'تهران', 4.3, 'off'],
  ['رامین دهقانی', '09121234506', 'وانت مزدا', 'ایران ۴۲ - ۶۶۸ ع ۲۱', 1500, 'تهران - ارسال فوری', 4.7, 'on-route'],
] as const;

export const drivers: Driver[] = DRIVER_SEEDS.map((d, i) => ({
  id: `dr-${String(i + 1).padStart(3, '0')}`,
  name: d[0],
  phone: d[1],
  vehicle: d[2],
  plate: d[3],
  capacityKg: d[4],
  zone: d[5],
  rating: d[6],
  status: d[7] as Driver['status'],
  todayStops: ri(2, 11),
  todayKm: ri(35, 260),
}));

const DRIVERS = drivers;

// ───────────────────────────────────────────────────────────── مشتریان
type CustomerSeed = [
  string, // نام فروشگاه
  string, // مالک
  string, // موبایل
  Customer['kind'],
  Customer['tier'],
  string, // شهر
  string, // استان
  string, // آدرس
  number, // سقف اعتبار
];

const CUSTOMER_SEEDS: CustomerSeed[] = [
  ['سوپرمارکت زنجیره‌ای آفتاب', 'مهدی رضایی', '09121110001', 'سوپرمارکت', 'VIP', 'تهران', 'تهران', 'خیابان ولیعصر، نبش کوچه بهار، پلاک ۱۲', 500_000_000],
  ['هایپرمارکت شهروند شعبه صادقیه', 'سعید کریمی', '09121110002', 'هایپرمارکت', 'VIP', 'تهران', 'تهران', 'بلوار فردوس شرق، مجتمع تجاری ستاره', 800_000_000],
  ['فروشگاه تعاونی مصرف کارکنان', 'حسین نوری', '09121110003', 'سوپرمارکت', 'A', 'تهران', 'تهران', 'میدان صنعت، خیابان گلستان، پلاک ۸', 250_000_000],
  ['رستوران سنتی گلستان', 'رضا محمدی', '09121110004', 'رستوران', 'A', 'تهران', 'تهران', 'خیابان شریعتی، بالاتر از حسینیه ارشاد', 180_000_000],
  ['کافه‌رستوران بلوط', 'نگار احمدی', '09121110005', 'کافه', 'B', 'تهران', 'تهران', 'سعادت‌آباد، میدان کاج', 90_000_000],
  ['سوپرمارکت محله ما', 'علی اسدی', '09121110006', 'سوپرمارکت', 'B', 'کرج', 'البرز', 'مهرشهر، بلوار ارم، پلاک ۴۵', 70_000_000],
  ['عمده‌فروشی میوه و تره‌بار پارس', 'اکبر صادقی', '09121110007', 'عمده‌فروش', 'A', 'تهران', 'تهران', 'میدان میوه و تره‌بار، غرفه ۲۲۰', 300_000_000],
  ['قنادی شیرین‌کام', 'فرشته یوسفی', '09121110008', 'قنادی', 'C', 'اصفهان', 'اصفهان', 'خیابان چهارباغ بالا، پلاک ۹۰', 45_000_000],
  ['بازار روز آفتاب مشهد', 'محمد قاسمی', '09121110009', 'عمده‌فروش', 'A', 'مشهد', 'خراسان رضوی', 'بلوار وکیل‌آباد، نبش چهارراه حجاب', 320_000_000],
  ['سوپرمارکت هفت‌خوان', 'زهرا سلطانی', '09121110010', 'سوپرمارکت', 'B', 'شیراز', 'فارس', 'بلوار زند، روبروی بیمارستان نمازی', 85_000_000],
  ['هتل آپارتمان پارسیان', 'بهرام فرهادی', '09121110011', 'هتل', 'A', 'شیراز', 'فارس', 'خیابان چمران، پلاک ۳۱۰', 200_000_000],
  ['فست‌فود برگرلند', 'امیر تهرانی', '09121110012', 'رستوران', 'B', 'تهران', 'تهران', 'میرداماد، خیابان نفت شمالی', 120_000_000],
  ['سوپرمارکت نیلوفر', 'حسن مرادی', '09121110013', 'سوپرمارکت', 'C', 'تبریز', 'آذربایجان شرقی', 'خیابان آزادی، کوچه گلکار', 40_000_000],
  ['پخش مواد غذایی کاسپین', 'جعفر رستمی', '09121110014', 'عمده‌فروش', 'VIP', 'رشت', 'گیلان', 'بلوار امام خمینی، جنب میدان شهرداری', 600_000_000],
  ['هایپرمارکت افق کوروش', 'پیمان موحد', '09121110015', 'هایپرمارکت', 'VIP', 'تهران', 'تهران', 'اتوبان شهید بابایی، مجتمع تجاری افق', 750_000_000],
  ['سوپرمارکت امید اهواز', 'ناصر بهرامی', '09121110016', 'سوپرمارکت', 'B', 'اهواز', 'خوزستان', 'کیانپارس، خیابان اصلی', 75_000_000],
  ['کافه دنج قهوه‌خانه', 'لیلا کرمانی', '09121110017', 'کافه', 'C', 'اصفهان', 'اصفهان', 'میدان نقش جهان، بازار هنر', 35_000_000],
  ['رستوران دریایی شمال', 'مجید انصاری', '09121110018', 'رستوران', 'A', 'بندرعباس', 'هرمزگان', 'بلوار امام خمینی، پلاک ۷۷', 160_000_000],
  ['سوپرمارکت آرین قم', 'کاظم شریفی', '09121110019', 'سوپرمارکت', 'B', 'قم', 'قم', 'خیابان امیرکبیر، پلاک ۲۲', 65_000_000],
  ['قنادی شکلات کندو', 'سمیرا پاکزاد', '09121110020', 'قنادی', 'C', 'تهران', 'تهران', 'خیابان انقلاب، روبروی دانشگاه تهران', 55_000_000],
  ['سوپرمارکت ماهان', 'رضا الیاسی', '09121110021', 'سوپرمارکت', 'A', 'کرمان', 'کرمان', 'بلوار شهید صدوقی، پلاک ۱۰۸', 140_000_000],
  ['پخش عمده برادران نوری', 'حمید نوری', '09121110022', 'عمده‌فروش', 'A', 'یزد', 'یزد', 'بلوار جمهوری، جنب میدان امام', 230_000_000],
  ['سوپرمارکت ساحل', 'یاسر بحرینی', '09121110023', 'سوپرمارکت', 'C', 'بوشهر', 'بوشهر', 'خیابان ساحلی، پلاک ۶۰', 38_000_000],
  ['هایپرمارکت آرمان', 'شهاب کاظمی', '09121110024', 'هایپرمارکت', 'A', 'کرج', 'البرز', 'عظیمیه، میدان اسبی', 260_000_000],
  ['رستوران سنتی باغ ارم', 'نوید لطفی', '09121110025', 'رستوران', 'B', 'شیراز', 'فارس', 'بلوار ارم، پلاک ۵', 110_000_000],
  ['سوپرمارکت ونک مارکت', 'آرزو دهقان', '09121110026', 'سوپرمارکت', 'B', 'تهران', 'تهران', 'میدان ونک، خیابان گاندی', 95_000_000],
  ['فروشگاه زنجیره‌ای رفاه', 'مسعود بیات', '09121110027', 'هایپرمارکت', 'A', 'اراک', 'مرکزی', 'خیابان شهید رجایی، پلاک ۳۴', 190_000_000],
  ['عمده‌فروشی البرز پخش', 'بهنام صفری', '09121110028', 'عمده‌فروش', 'B', 'قزوین', 'قزوین', 'شهرک صنعتی البرز، سالن ۳', 130_000_000],
];

const REPS = [
  { id: 'u-006', name: 'سارا حسینی' },
  { id: 'u-007', name: 'کامران راد' },
  { id: 'u-008', name: 'الهام قاسمی' },
];

export const customers: Customer[] = CUSTOMER_SEEDS.map((s, i) => {
  const [storeName, ownerName, mobile, kind, tier, city, province, address, creditLimit] = s;
  const monthlyOrders = tier === 'VIP' ? ri(8, 16) : tier === 'A' ? ri(5, 11) : tier === 'B' ? ri(3, 7) : ri(1, 4);
  const avgOrderValue = tier === 'VIP' ? ri(38, 90) * 1_000_000 : tier === 'A' ? ri(16, 45) * 1_000_000 : tier === 'B' ? ri(8, 22) * 1_000_000 : ri(4, 12) * 1_000_000;
  const creditUsed = Math.round(creditLimit * (0.15 + rand() * 0.6));
  const docsStatus: Customer['docsStatus'] = i % 9 === 3 ? 'pending' : i % 13 === 5 ? 'rejected' : 'verified';
  return {
    id: `c-${String(i + 1).padStart(3, '0')}`,
    storeName,
    ownerName,
    mobile,
    kind,
    tier,
    city,
    province,
    address,
    taxId: `411${ri(100000, 999999)}${ri(10, 99)}`,
    creditLimit,
    creditUsed,
    walletBalance: ri(0, 40) * 500_000,
    loyaltyPoints: ri(200, 24000),
    status: i % 17 === 6 ? 'pending' : i % 23 === 11 ? 'suspended' : 'active',
    docsStatus,
    docs: [
      { name: 'کارت ملی مالک', status: docsStatus === 'verified' ? 'verified' : 'pending', date: iso(ri(40, 300)) },
      { name: 'جواز کسب / پروانه صنفی', status: docsStatus === 'rejected' ? 'rejected' : docsStatus === 'verified' ? 'verified' : 'pending', date: iso(ri(30, 200)) },
      { name: 'کد اقتصادی / شناسه مالیاتی', status: docsStatus === 'verified' ? 'verified' : 'pending', date: iso(ri(20, 180)) },
      { name: 'چک تضمین / ضمانت‌نامه', status: i % 4 === 0 ? 'verified' : 'pending', date: iso(ri(10, 150)) },
    ],
    assignedRepId: REPS[i % REPS.length].id,
    geo: { lat: 35.7 + rand() * 0.5, lng: 51.4 + rand() * 0.5 },
    createdAt: iso(ri(60, 900)),
    lastOrderAt: iso(ri(0, 30)),
    ltv: avgOrderValue * monthlyOrders * ri(8, 24),
    avgOrderValue,
    monthlyOrders,
    churnRisk: tier === 'C' ? ri(35, 78) : tier === 'B' ? ri(12, 42) : ri(2, 18),
    priceContractId: i % 5 === 0 ? `ct-${String(i + 1).padStart(3, '0')}` : undefined,
    notes: i % 3 === 0 ? 'تحویل فقط در بازه صبح؛ نیاز به هماهنگی تلفنی قبل از ارسال.' : 'مشتری خوش‌حساب با تسویه به‌موقع.',
  };
});

// ───────────────────────────────────────────────────────────── سفارش‌ها
const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered'];
const TRACK_TITLES = ['ثبت سفارش', 'تأیید مالی', 'آماده‌سازی انبار', 'بسته‌بندی و پالت‌بندی', 'تحویل به راننده', 'تحویل به مشتری'];

const makeOrder = (index: number): Order => {
  const customer = customers[index % customers.length];
  const itemCount = ri(2, 6);
  const chosen: OrderItem[] = [];
  const used = new Set<number>();
  for (let k = 0; k < itemCount; k++) {
    let pi = ri(0, products.length - 1);
    let guard = 0;
    while (used.has(pi) && guard++ < 20) pi = ri(0, products.length - 1);
    used.add(pi);
    const p = products[pi];
    const qty = ri(2, 40);
    const tier = [...p.tiers].reverse().find((t) => qty >= t.minQty) ?? p.tiers[0];
    chosen.push({
      productId: p.id,
      name: p.name,
      brandName: brandName(p.brandId),
      qty,
      unit: p.unit,
      unitPrice: tier.price,
      total: tier.price * qty,
      tierLabel: tier.label,
    });
  }
  const subtotal = chosen.reduce((s, it) => s + it.total, 0);
  const discountTotal = Math.round(subtotal * (ri(0, 11) / 100));
  const taxAmount = Math.round((subtotal - discountTotal) * 0.09);
  const shippingCost = subtotal > 20_000_000 ? 0 : ri(3, 12) * 100_000;
  const grandTotal = subtotal - discountTotal + taxAmount + shippingCost;
  const daysAgo = ri(0, 175);
  const progressIndex = daysAgo < 2 ? ri(0, 2) : daysAgo < 5 ? ri(2, 4) : 5;
  const status: OrderStatus = index % 29 === 13 ? 'canceled' : index % 37 === 8 ? 'returned' : STATUS_FLOW[progressIndex];
  const paymentMethod: Order['paymentMethod'] = (['cash', 'credit', 'installment', 'cheque', 'online'] as const)[index % 5];
  const paymentStatus: PaymentStatus =
    status === 'delivered' ? (index % 7 === 3 ? 'partial' : index % 11 === 5 ? 'overdue' : 'paid') : index % 4 === 0 ? 'partial' : 'unpaid';
  const createdAt = iso(daysAgo, ri(8, 18));
  const deliveryDate = new Date(new Date(createdAt).getTime() + ri(1, 5) * 86400000).toISOString();
  const driver = DRIVERS[index % DRIVERS.length];
  return {
    id: `o-${String(index + 1).padStart(4, '0')}`,
    code: `MKT-${140000 + index * 7}`,
    customerId: customer.id,
    customerName: customer.storeName,
    items: chosen,
    subtotal,
    discountTotal,
    taxAmount,
    shippingCost,
    grandTotal,
    status,
    paymentMethod,
    paymentStatus,
    paidAmount: paymentStatus === 'paid' ? grandTotal : paymentStatus === 'partial' ? Math.round(grandTotal * 0.4) : 0,
    createdAt,
    deliveryDate,
    deliverySlot: ['۹ تا ۱۲', '۱۲ تا ۱۵', '۱۵ تا ۱۸'][index % 3],
    address: customer.address,
    city: customer.city,
    driverId: driver.id,
    driverName: driver.name,
    vehicle: driver.vehicle,
    trackingCode: `TRK${140000 + index * 7}`,
    trackingSteps: TRACK_TITLES.map((title, si) => ({
      title,
      at: new Date(new Date(createdAt).getTime() + si * 14 * 3600000).toISOString(),
      done: status === 'canceled' || status === 'returned' ? si <= 1 : si <= progressIndex,
      note: si === 2 ? `انبار ${['تهران', 'مشهد', 'شیراز'][index % 3]}` : undefined,
    })),
    appliedOfferIds: index % 3 === 0 ? ['of-001'] : index % 5 === 0 ? ['of-002', 'of-007'] : [],
    hasReturn: status === 'returned',
    returnReason: status === 'returned' ? 'مغایرت وزن در دو قلم کالا — مرجوع و جایگزین شد.' : undefined,
    podSigned: status === 'delivered',
    podSignature: status === 'delivered' ? `SIG-${index}-${customer.id}` : undefined,
    notes: index % 6 === 0 ? 'پالت‌ها باید فیلم‌کشی شود.' : '',
    channel: (['web', 'app', 'phone', 'rep'] as const)[index % 4],
    repId: index % 4 === 3 ? customer.assignedRepId : undefined,
  };
};

export const orders: Order[] = Array.from({ length: 168 }, (_, i) => makeOrder(i)).sort(
  (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
);

// ───────────────────────────────────────────────────────────── انبار و موجودی
export const warehouses: Warehouse[] = [
  {
    id: 'w-001',
    name: 'انبار مرکزی تهران',
    city: 'تهران',
    address: 'کیلومتر ۱۲ جاده مخصوص کرج، شهرک صنعتی، سالن A',
    capacity: 12_000,
    used: 8_340,
    zones: ['A1 مواد خشک', 'A2 نوشیدنی', 'A3 کنسرو', 'B1 سردخانه', 'B2 فریزر'],
    tempControlled: true,
    managerName: 'حسین داودی',
    phone: '021-44556677',
    isActive: true,
  },
  {
    id: 'w-002',
    name: 'انبار مشهد',
    city: 'مشهد',
    address: 'بلوار توس، شهرک صنعتی توس، فاز ۲',
    capacity: 6_500,
    used: 4_120,
    zones: ['M1 خشک', 'M2 نوشیدنی', 'M3 سردخانه'],
    tempControlled: true,
    managerName: 'علی‌رضا شاکری',
    phone: '051-37654321',
    isActive: true,
  },
  {
    id: 'w-003',
    name: 'انبار شیراز',
    city: 'شیراز',
    address: 'شهرک صنعتی شیراز، خیابان ۱۰، سالن ۴',
    capacity: 4_800,
    used: 2_960,
    zones: ['S1 خشک', 'S2 سردخانه'],
    tempControlled: true,
    managerName: 'محسن زارعی',
    phone: '071-38123456',
    isActive: true,
  },
];

export const inventory: InventoryRecord[] = products.map((p, i) => ({
  id: `inv-${p.id}-${p.warehouseId}`,
  productId: p.id,
  warehouseId: p.warehouseId,
  onHand: p.stock,
  reserved: p.reserved,
  reorderPoint: ri(8, 20),
  maxStock: 320,
  lastCountedAt: iso(ri(1, 25)),
  bin: `${['A', 'B', 'M', 'S'][i % 4]}${ri(1, 9)}-${ri(10, 99)}`,
}));

export const batches: Batch[] = products.flatMap((p, i) =>
  Array.from({ length: 2 }, (_, k) => {
    const prod = new Date(new Date(p.productionDate).getTime() - k * 8 * 86400000);
    return {
      id: `bt-${p.id}-${k + 1}`,
      productId: p.id,
      warehouseId: p.warehouseId,
      batchNo: `LOT${String(240000 + i * 13 + k)}`,
      productionDate: prod.toISOString(),
      expiryDate: new Date(prod.getTime() + p.shelfLifeMonths * 30 * 86400000).toISOString(),
      qty: ri(20, 180),
      supplierId: `sup-${String((i % 8) + 1).padStart(3, '0')}`,
      qcStatus: k === 1 && i % 19 === 3 ? 'pending' : i % 29 === 7 ? 'failed' : 'passed',
      costPrice: Math.round(p.basePrice * 0.82),
    } as Batch;
  }),
);

// ───────────────────────────────────────────────────────────── تأمین‌کنندگان
export const suppliers: Supplier[] = [
  ['گروه صنعتی کاله', 'b-007', 'ایران', 'مهندس رحیمی', '021-33889900', 'sales@kalleh.example', 'تسویه ۳۰ روزه', 3, 4.8, 'active', 'CT-SUP-1401'],
  ['گروه صنعتی مینو', 'b-002', 'ایران', 'خانم امینی', '021-33445566', 'trade@minoo.example', 'تسویه ۴۵ روزه', 3, 4.9, 'active', 'CT-SUP-1402'],
  ['کوروش (گلرنگ)', 'b-001', 'ایران', 'آقای کاظمی', '021-91001000', 'b2b@golrang.example', 'نقدی/چک', 2, 4.7, 'active', 'CT-SUP-1403'],
  ['نستله ایران', 'b-041', 'ایران/سوئیس', 'خانم سعیدی', '021-88990011', 'orders@nestle.example', 'تسویه ۶۰ روزه', 7, 4.6, 'active', 'CT-SUP-1404'],
  ['بهنوش ایران', 'b-119', 'ایران', 'آقای مقدم', '021-55443322', 'sales@behnoush.example', 'تسویه ۳۰ روزه', 4, 4.4, 'active', 'CT-SUP-1405'],
  ['اولیتالیا (نماینده رسمی)', 'b-047', 'ایتالیا', 'آقای بروگنی', '+39-055-1234567', 'export@olitalia.example', 'پیش‌پرداخت ۵۰٪', 45, 4.9, 'active', 'CT-SUP-1406'],
  ['صنایع غذایی سولیکو', 'b-025', 'ایران', 'آقای شفیعی', '021-33001122', 'b2b@solico.example', 'تسویه ۲۱ روزه', 2, 4.2, 'review', 'CT-SUP-1407'],
  ['پخش کاسپین', 'b-014', 'ایران', 'آقای رستمی', '013-33445566', 'info@caspian.example', 'نقدی', 3, 3.9, 'suspended', 'CT-SUP-1408'],
].map((s, i) => ({
  id: `sup-${String(i + 1).padStart(3, '0')}`,
  name: s[0] as string,
  brandIds: [s[1] as string],
  country: s[2] as string,
  supplierType: 'food' as Supplier['supplierType'],
  contactName: s[3] as string,
  phone: s[4] as string,
  email: s[5] as string,
  paymentTerms: s[6] as string,
  leadTimeDays: s[7] as number,
  rating: s[8] as number,
  status: s[9] as Supplier['status'],
  contractCode: s[10] as string,
  contractExpiry: iso(-ri(30, 400)),
  providedCategories: [...new Set(products.filter((p) => p.brandId === s[1]).map((p) => p.categoryId))].slice(0, 4),
  monthlyVolume: ri(80, 950) * 1_000_000,
  fillRate: ri(78, 99),
  notes: 'تأمین‌کننده راهبردی؛ تسویه بر اساس قرارداد سالانه و تخفیف حجمی توافقی.',
}));

// ───────────────────────────────────────────────────────────── حمل و نقل
export const shipments: Shipment[] = orders.slice(0, 42).map((o, i) => ({
  id: `sh-${String(i + 1).padStart(3, '0')}`,
  code: `SHP-${9000 + i * 3}`,
  orderId: o.id,
  orderCode: o.code,
  customerName: o.customerName,
  city: o.city,
  driverId: drivers[i % drivers.length].id,
  driverName: drivers[i % drivers.length].name,
  driverPhone: drivers[i % drivers.length].phone,
  vehicle: drivers[i % drivers.length].vehicle,
  plate: drivers[i % drivers.length].plate,
  status: (['scheduled', 'loading', 'in-transit', 'delivered', 'delivered'] as const)[i % 5],
  plannedAt: o.deliveryDate,
  deliveredAt: i % 5 >= 3 ? o.deliveryDate : undefined,
  stops: ri(2, 9),
  completedStops: ri(0, 6),
  weightKg: ri(180, 5200),
  distanceKm: ri(12, 620),
  cost: ri(450, 4800) * 1000,
  podSigned: i % 5 >= 3,
  temperature: i % 3 === 0 ? '۲ تا ۶ درجه سلسیوس' : undefined,
}));

export const REPS_LIST = REPS;
