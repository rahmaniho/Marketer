/**
 * مدل داده‌های پلتفرم عمده‌فروشی «بازارعمده»
 * همه موجودیت‌ها صرفاً Mock هستند و در localStorage نگهداری می‌شوند.
 */

export type Origin = 'iran' | 'international';

export type SalesUnit = 'کارتن' | 'شرینک' | 'پالت' | 'بسته' | 'کیسه' | 'حلقه';

export type LicenseStatus = 'valid' | 'expiring' | 'pending' | 'expired';

export type LicenseKind = 'IRC' | 'وزارت بهداشت' | 'حلال' | 'ارگانیک' | 'استاندارد';

export interface Brand {
  id: string;
  /** نام فارسی برند */
  name: string;
  /** نام لاتین برند */
  nameEn: string;
  slug: string;
  /** کشور مبدأ */
  country: string;
  origin: Origin;
  /** شناسه دسته‌های اصلی فعالیت */
  categoryIds: string[];
  /** خطوط تولید / گروه محصولات */
  productLines: string[];
  description: string;
  licenseKind: LicenseKind;
  licenseCode: string;
  licenseStatus: LicenseStatus;
  licenseExpiry: string;
  /** پالت بصری لوگوی SVG اختصاصی */
  logo: {
    from: string;
    to: string;
    fg: string;
    shape: 'round' | 'square' | 'shield' | 'hex' | 'pill';
    initials: string;
  };
  established: number;
  rating: number;
  /** نمایندگی/توزیع انحصاری در ایران */
  exclusive?: boolean;
  representative?: string;
  isActive: boolean;
  tags: string[];
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  nameEn: string;
  /** نام آیکون lucide در نقشه آیکون‌ها */
  icon: string;
  color: string;
  productCount?: number;
  description: string;
}

export interface PriceTier {
  /** حداقل تعداد برای فعال شدن این پله */
  minQty: number;
  /** قیمت هر واحد در این پله (تومان) */
  price: number;
  /** درصد تخفیف نسبت به قیمت پایه */
  discountPercent: number;
  label: string;
}

export interface Product {
  id: string;
  /** نام فارسی کالا */
  name: string;
  nameEn: string;
  brandId: string;
  categoryId: string;
  barcode: string;
  sku: string;
  /** واحد فروش عمده */
  unit: SalesUnit;
  /** تعداد واحد در کارتن */
  unitsPerCarton: number;
  /** شرح بسته‌بندی مثل «۱۲ عدد × ۱ لیتر» */
  packDesc: string;
  /** قیمت پایه هر واحد فروش (تومان) */
  basePrice: number;
  /** قیمت مصرف‌کننده پیشنهادی */
  marketPrice: number;
  cashDiscountPercent: number;
  tiers: PriceTier[];
  stock: number;
  reserved: number;
  warehouseId: string;
  productionDate: string;
  expiryDate: string;
  shelfLifeMonths: number;
  moq: number;
  paletteQty: number;
  country: string;
  images: { seed: string; hue: string; icon: string }[];
  badges: ('halal' | 'organic' | 'imported' | 'irc' | 'new' | 'bestseller' | 'expiring')[];
  tags: string[];
  description: string;
  rating: number;
  soldCount: number;
  isActive: boolean;
  createdAt: string;
}

export type OfferKind =
  | 'cash'
  | 'volume'
  | 'timed'
  | 'first-order'
  | 'seasonal'
  | 'vip'
  | 'bundle'
  | 'loyalty';

export interface Offer {
  id: string;
  title: string;
  kind: OfferKind;
  description: string;
  /** درصد تخفیف */
  percent: number;
  /** مبلغ ثابت تخفیف (تومان) - اختیاری */
  fixedAmount?: number;
  code: string;
  brandIds: string[];
  categoryIds: string[];
  productIds: string[];
  /** حداقل مبلغ سبد برای اعمال */
  minCartAmount: number;
  /** حداقل تعداد اقلام */
  minQty: number;
  startsAt: string;
  endsAt: string;
  /** فقط برای مشتریان VIP */
  vipOnly: boolean;
  firstOrderOnly: boolean;
  maxUsage: number;
  usedCount: number;
  color: string;
  icon: string;
  isActive: boolean;
}

export type CustomerTier = 'A' | 'B' | 'C' | 'VIP';
export type CustomerKind = 'سوپرمارکت' | 'هایپرمارکت' | 'رستوران' | 'عمده‌فروش' | 'کافه' | 'قنادی' | 'هتل';

export interface Customer {
  id: string;
  storeName: string;
  ownerName: string;
  mobile: string;
  kind: CustomerKind;
  tier: CustomerTier;
  city: string;
  province: string;
  address: string;
  /** کد اقتصادی / شناسه مالیاتی */
  taxId: string;
  creditLimit: number;
  creditUsed: number;
  walletBalance: number;
  loyaltyPoints: number;
  status: 'active' | 'pending' | 'suspended';
  docsStatus: 'verified' | 'pending' | 'rejected';
  docs: { name: string; status: 'pending' | 'verified' | 'rejected'; date: string }[];
  assignedRepId: string;
  geo: { lat: number; lng: number };
  createdAt: string;
  lastOrderAt: string;
  /** ارزش طول عمر مشتری */
  ltv: number;
  avgOrderValue: number;
  monthlyOrders: number;
  churnRisk: number;
  priceContractId?: string;
  notes: string;
}

export interface CartLine {
  productId: string;
  qty: number;
  /** قیمت واحد اعمال‌شده (پس از آبشار تخفیف) */
  unitPrice: number;
  basePrice: number;
  tierLabel: string;
  appliedOfferIds: string[];
  /** دلیل قیمت نهایی برای شفافیت */
  breakdown: PriceBreakdownStep[];
}

export interface PriceBreakdownStep {
  label: string;
  detail: string;
  amount: number;
  percent: number;
  kind: 'base' | 'contract' | 'cash' | 'volume' | 'offer' | 'vip' | 'tax';
}

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'returned';

export type PaymentMethod = 'cash' | 'credit' | 'installment' | 'cheque' | 'online';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface OrderItem {
  productId: string;
  name: string;
  brandName: string;
  qty: number;
  unit: SalesUnit;
  unitPrice: number;
  total: number;
  tierLabel: string;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  shippingCost: number;
  grandTotal: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  createdAt: string;
  deliveryDate: string;
  deliverySlot: string;
  address: string;
  city: string;
  driverId?: string;
  driverName?: string;
  vehicle?: string;
  trackingCode: string;
  trackingSteps: { title: string; at: string; done: boolean; note?: string }[];
  appliedOfferIds: string[];
  hasReturn: boolean;
  returnReason?: string;
  podSigned?: boolean;
  podSignature?: string;
  notes: string;
  channel: 'web' | 'app' | 'phone' | 'rep';
  repId?: string;
}

export type RoleId = 'superadmin' | 'sales-manager' | 'operator' | 'warehouse' | 'finance' | 'rep' | 'supplier';

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  color: string;
  permissions: Permission[];
}

export type Permission =
  | 'dashboard.view'
  | 'brand.manage'
  | 'product.manage'
  | 'offer.manage'
  | 'customer.manage'
  | 'customer.approve'
  | 'order.manage'
  | 'order.status'
  | 'warehouse.manage'
  | 'supplier.manage'
  | 'report.export'
  | 'user.manage'
  | 'audit.view'
  | 'settings.manage'
  | 'content.manage';

export interface AdminUser {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  roleId: RoleId;
  avatarColor: string;
  twoFactorEnabled: boolean;
  ssoProvider?: string;
  lastLogin: string;
  status: 'active' | 'disabled';
  city: string;
}

export interface AuditLog {
  id: string;
  at: string;
  userId: string;
  userName: string;
  roleId: RoleId;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface Supplier {
  id: string;
  name: string;
  brandIds: string[];
  country: string;
  contactName: string;
  phone: string;
  email: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  status: 'active' | 'suspended' | 'review';
  contractCode: string;
  contractExpiry: string;
  providedCategories: string[];
  monthlyVolume: number;
  fillRate: number;
  notes: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  address: string;
  capacity: number;
  used: number;
  zones: string[];
  tempControlled: boolean;
  managerName: string;
  phone: string;
  isActive: boolean;
}

export interface InventoryRecord {
  id: string;
  productId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  maxStock: number;
  lastCountedAt: string;
  bin: string;
}

export interface Batch {
  id: string;
  productId: string;
  warehouseId: string;
  batchNo: string;
  productionDate: string;
  expiryDate: string;
  qty: number;
  supplierId: string;
  qcStatus: 'passed' | 'pending' | 'failed';
  costPrice: number;
}

export interface Shipment {
  id: string;
  code: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  city: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  plate: string;
  status: 'scheduled' | 'loading' | 'in-transit' | 'delivered' | 'failed';
  plannedAt: string;
  deliveredAt?: string;
  stops: number;
  completedStops: number;
  weightKg: number;
  distanceKm: number;
  cost: number;
  podSigned: boolean;
  temperature?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  capacityKg: number;
  zone: string;
  rating: number;
  status: 'available' | 'on-route' | 'off';
  todayStops: number;
  todayKm: number;
}

export interface RFQ {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  branchName?: string;
  items: { title: string; brandHint: string; qty: number; unit: SalesUnit; targetPrice?: number; note?: string }[];
  status: 'new' | 'quoted' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  validUntil: string;
  quotedTotal?: number;
  quotedBy?: string;
  note: string;
  priority: 'low' | 'normal' | 'high';
}

export interface Lead {
  id: string;
  storeName: string;
  ownerName: string;
  mobile: string;
  city: string;
  kind: CustomerKind;
  source: 'وب‌سایت' | 'تماس ورودی' | 'ویزیت میدانی' | 'معرفی مشتری' | 'نمایشگاه' | 'اینستاگرام';
  score: number;
  stage: 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost';
  estimatedValue: number;
  assignedRepId: string;
  createdAt: string;
  lastActivity: string;
  note: string;
}

export interface Visit {
  id: string;
  leadId?: string;
  customerId?: string;
  customerName: string;
  repId: string;
  repName: string;
  plannedAt: string;
  doneAt?: string;
  status: 'planned' | 'done' | 'canceled' | 'missed';
  purpose: string;
  outcome: string;
  nextAction: string;
  geo: { lat: number; lng: number };
  distanceKm: number;
  photoSeeds: string[];
  orderPlaced: boolean;
  orderAmount: number;
}

export interface Contract {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  title: string;
  productIds: string[];
  /** درصد تخفیف پیمانی روی محصولات انتخابی */
  discountPercent: number;
  minMonthlyQty: number;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'expiring' | 'expired' | 'draft';
  signedBy: string;
  signedAt: string;
  signatureHash: string;
  attachment: string;
  settlement: string;
  note: string;
}

export interface Ticket {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  subject: string;
  category: 'سفارش' | 'مالی' | 'کیفیت' | 'لجستیک' | 'فنی' | 'پیشنهاد';
  priority: 'low' | 'normal' | 'high';
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  updatedAt: string;
  channel: 'چت' | 'تلفن' | 'ایمیل' | 'فرم سایت';
  messages: { from: 'customer' | 'agent' | 'bot'; name: string; text: string; at: string }[];
  npsScore?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: 'order' | 'offer' | 'system' | 'finance' | 'logistics' | 'loyalty';
  at: string;
  read: boolean;
  audience: 'customer' | 'admin' | 'both';
  link?: string;
}

export interface LoyaltyAccount {
  customerId: string;
  points: number;
  tier: string;
  nextTierPoints: number;
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
  history: { at: string; title: string; points: number; kind: 'earn' | 'spend' }[];
  rewards: { id: string; title: string; points: number; description: string; image: string }[];
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: 'حسابداری' | 'ERP' | 'WMS' | 'TMS' | 'پیام‌رسان' | 'مارکت‌پلیس' | 'پرداخت' | 'دولتی' | 'نقشه';
  description: string;
  status: 'connected' | 'available' | 'beta';
  icon: string;
  docs: string;
  webhookUrl?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  kind: 'article' | 'video' | 'recipe' | 'webinar';
  category: string;
  excerpt: string;
  body: string;
  author: string;
  readMinutes: number;
  publishedAt: string;
  tags: string[];
  views: number;
  cover: { from: string; to: string; icon: string };
}

export interface ForumTopic {
  id: string;
  title: string;
  author: string;
  role: string;
  body: string;
  replies: { author: string; role: string; body: string; at: string }[];
  tags: string[];
  views: number;
  createdAt: string;
  pinned: boolean;
  solved: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export interface SustainabilityInitiative {
  id: string;
  title: string;
  description: string;
  kind: 'ضایعات' | 'اهدای غذا' | 'کربن' | 'بازیافت' | 'خیریه';
  impact: string;
  progress: number;
  goal: string;
  partner: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: 'order' | 'delivery' | 'visit' | 'webinar' | 'payment' | 'holiday';
  detail: string;
}

export interface InsightCard {
  id: string;
  title: string;
  value: string;
  delta: string;
  positive: boolean;
  hint: string;
  icon: string;
}

export interface ChatScript {
  id: string;
  patterns: string[];
  answer: string;
  quickReplies?: string[];
}

export interface Settings {
  companyName: string;
  taxPercent: number;
  freeShippingMin: number;
  shippingCost: number;
  creditDaysDefault: number;
  chequeDays: number;
  cartonsPerPallet: number;
  usdRate: number;
  contractDiscountDefault: number;
  cashDiscountDefault: number;
  enableTwoFactor: boolean;
  enableSso: boolean;
  enableAuditLog: boolean;
  enableModian: boolean;
  enableSmsMock: boolean;
  lowStockThreshold: number;
  expiryWarnDays: number;
  settlementTerms: string[];
  businessModels: string[];
}
