import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AdminUser,
  AuditLog,
  Brand,
  CartLine,
  Contract,
  Customer,
  Notification,
  Offer,
  Order,
  OrderStatus,
  Product,
  RFQ,
  RoleId,
  Settings,
  Ticket,
} from '@/lib/types';
import { computePrice } from '@/lib/pricing';
import { products as mockProducts } from '@/data/products';
import { brands as mockBrands } from '@/data/brands';
import { offers as mockOffers } from '@/data/offers';
import { customers as mockCustomers, orders as mockOrders } from '@/data/ops';
import { contracts as mockContracts } from '@/data/crm';
import { settings as defaultSettings } from '@/data/content';
import { notifications as mockNotifications, adminUsers, auditLogs } from '@/data/crm';

/**
 * استور مرکزی دمو (Zustand + persist در localStorage)
 * تمام داده‌ها Mock هستند؛ هیچ درخواست شبکه‌ای انجام نمی‌شود.
 */

export interface ChatMessage {
  id: string;
  from: 'me' | 'bot' | 'agent';
  text: string;
  at: string;
}

interface StoreState {
  // ── ظاهر
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // ── احراز هویت دمو
  customer: Customer | null;
  admin: AdminUser | null;
  loginCustomer: (mobile: string, code: string) => { ok: boolean; message: string };
  demoLoginCustomer: () => void;
  loginAsCustomer: (id: string) => void;
  loginAdmin: (roleId: RoleId) => void;
  logout: () => void;

  // ── ویرایش‌های کاتالوگ (روی داده Mock اعمال می‌شود)
  productEdits: Record<string, Product>;
  deletedProductIds: string[];
  brandEdits: Record<string, Brand>;
  offerEdits: Record<string, Offer>;
  customerEdits: Record<string, Customer>;
  orderStatusEdits: Record<string, OrderStatus>;
  contractsExtra: Contract[];
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertBrand: (b: Brand) => void;
  upsertOffer: (o: Offer) => void;
  upsertCustomer: (c: Customer) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  addContract: (c: Contract) => void;

  // ── سبد خرید
  cart: CartLine[];
  cashPayment: boolean;
  setCashPayment: (v: boolean) => void;
  addToCart: (productId: string, qty: number) => void;
  setCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  recalcCart: () => void;

  // ── علاقه‌مندی و مقایسه
  favorites: string[];
  compare: string[];
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  // ── سفارش‌های ساخته‌شده در دمو
  newOrders: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'code' | 'trackingCode'>) => Order;

  // ── استعلام قیمت، تیکت، اعلان
  rfqs: RFQ[];
  addRfq: (rfq: RFQ) => void;
  tickets: Ticket[];
  addTicket: (t: Ticket) => void;
  notifications: Notification[];
  markNotificationsRead: () => void;

  // ── باشگاه مشتریان
  loyaltyPoints: number;
  addPoints: (n: number) => void;

  // ── جست‌وجو و بازدید
  recentSearches: string[];
  addSearch: (q: string) => void;
  recentlyViewed: string[];
  markViewed: (id: string) => void;

  // ── لاگ عملیات
  auditExtras: AuditLog[];
  logAction: (entry: Omit<AuditLog, 'id' | 'at' | 'ip'>) => void;

  // ── تنظیمات
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // ── خرید گروهی و اشتراک (نمایشی)
  subscriptions: { id: string; title: string; period: string; nextDate: string; amount: number; active: boolean }[];
  toggleSubscription: (id: string) => void;
  groupBuys: { id: string; productId: string; targetQty: number; joinedQty: number; city: string; endsAt: string }[];
  joinGroupBuy: (id: string, qty: number) => void;

  // ── چت پشتیبانی
  chatMessages: ChatMessage[];
  pushChat: (m: ChatMessage) => void;

  // ── عملیات کمکی
  resetDemo: () => void;
}

const STORAGE_KEY = 'marketer-demo-store-v1';

/** پیام آغازین دستیار هوشمند (وضعیت اولیه چت) */
const initialChat: ChatMessage[] = [
  {
    id: 'cm-1',
    from: 'bot',
    text: 'سلام! من دستیار هوشمند بازارعمده هستم. درباره قیمت عمده، ارسال، اعتبار خرید یا مرجوعی بپرسید.',
    at: new Date().toISOString(),
  },
];

const demoSubscriptions = [
  { id: 'sub-1', title: 'سبد هفتگی لبنیات', period: 'هفتگی', nextDate: new Date(Date.now() + 3 * 86400000).toISOString(), amount: 12_400_000, active: true },
  { id: 'sub-2', title: 'سبد ماهانه نوشیدنی', period: 'ماهانه', nextDate: new Date(Date.now() + 11 * 86400000).toISOString(), amount: 28_900_000, active: true },
  { id: 'sub-3', title: 'سبد دو‌هفتگی تنقلات', period: 'دوهفته‌ای', nextDate: new Date(Date.now() + 6 * 86400000).toISOString(), amount: 8_600_000, active: false },
];

const demoGroupBuys = [
  { id: 'gb-1', productId: mockProducts[0].id, targetQty: 200, joinedQty: 148, city: 'تهران', endsAt: new Date(Date.now() + 4 * 86400000).toISOString() },
  { id: 'gb-2', productId: mockProducts[5].id, targetQty: 150, joinedQty: 96, city: 'مشهد', endsAt: new Date(Date.now() + 2 * 86400000).toISOString() },
  { id: 'gb-3', productId: mockProducts[20].id, targetQty: 300, joinedQty: 271, city: 'اصفهان', endsAt: new Date(Date.now() + 6 * 86400000).toISOString() },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        try {
          localStorage.setItem('marketer.theme', next);
          document.documentElement.classList.toggle('dark', next === 'dark');
        } catch {
          /* noop */
        }
      },

      // ── احراز هویت
      customer: null,
      admin: null,
      loginCustomer: (mobile, code) => {
        if (code !== '123456')
          return { ok: false, message: 'کد تأیید نادرست است. در نسخه دمو کد ثابت ۱۲۳۴۵۶ (123456) است.' };
        const normalized = mobile.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
        const found = get().customerEdits[normalized]
          ? Object.values(get().customerEdits).find((c) => c.mobile === normalized)
          : undefined;
        const fallback = mockCustomers.find((c) => c.mobile === normalized);
        const customer = found ?? fallback ?? { ...mockCustomers[0], mobile: normalized || mockCustomers[0].mobile, storeName: found || fallback ? mockCustomers[0].storeName : `فروشگاه دمو ${normalized.slice(-4)}` };
        set({ customer: customer as Customer });
        get().logAction({
          userId: customer.id,
          userName: customer.ownerName,
          roleId: 'rep',
          action: 'ورود مشتری (دمو)',
          entity: 'Auth',
          entityId: customer.id,
          detail: `ورود با موبایل ${normalized}`,
          severity: 'info',
        });
        return { ok: true, message: 'ورود موفق' };
      },
      demoLoginCustomer: () => {
        set({ customer: mockCustomers[0] });
      },
      loginAsCustomer: (id) => {
        const c = mockCustomers.find((x) => x.id === id);
        if (c) set({ customer: c });
      },
      loginAdmin: (roleId) => {
        const admin = adminUsers.find((u) => u.roleId === roleId) ?? adminUsers[0];
        set({ admin });
      },
      logout: () => set({ customer: null, admin: null }),

      // ── ویرایش‌ها
      productEdits: {},
      deletedProductIds: [],
      brandEdits: {},
      offerEdits: {},
      customerEdits: {},
      orderStatusEdits: {},
      contractsExtra: [],
      upsertProduct: (p) => {
        set((s) => ({ productEdits: { ...s.productEdits, [p.id]: p } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'ذخیره محصول',
          entity: 'Product',
          entityId: p.id,
          detail: `محصول «${p.name}» ذخیره شد — قیمت پایه ${p.basePrice.toLocaleString('fa-IR')} تومان`,
          severity: 'warning',
        });
      },
      deleteProduct: (id) => set((s) => ({ deletedProductIds: [...new Set([...s.deletedProductIds, id])] })),
      upsertBrand: (b) => {
        set((s) => ({ brandEdits: { ...s.brandEdits, [b.id]: b } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'ذخیره برند',
          entity: 'Brand',
          entityId: b.id,
          detail: `برند «${b.name}» ذخیره شد`,
          severity: 'info',
        });
      },
      upsertOffer: (o) => {
        set((s) => ({ offerEdits: { ...s.offerEdits, [o.id]: o } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'ذخیره کمپین',
          entity: 'Offer',
          entityId: o.id,
          detail: `کمپین «${o.title}» با ${o.percent}٪ تخفیف`,
          severity: 'info',
        });
      },
      upsertCustomer: (c) => {
        set((s) => ({ customerEdits: { ...s.customerEdits, [c.id]: c } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'ویرایش مشتری',
          entity: 'Customer',
          entityId: c.id,
          detail: `مشتری «${c.storeName}» — سطح ${c.tier}، سقف اعتبار ${c.creditLimit.toLocaleString('fa-IR')}`,
          severity: 'warning',
        });
      },
      setOrderStatus: (orderId, status) => {
        set((s) => ({ orderStatusEdits: { ...s.orderStatusEdits, [orderId]: status } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'تغییر وضعیت سفارش',
          entity: 'Order',
          entityId: orderId,
          detail: `وضعیت سفارش ${orderId} به «${status}» تغییر یافت`,
          severity: status === 'canceled' ? 'critical' : 'info',
        });
      },
      addContract: (c) => set((s) => ({ contractsExtra: [c, ...s.contractsExtra] })),

      // ── سبد خرید
      cart: [],
      cashPayment: true,
      setCashPayment: (v) => {
        set({ cashPayment: v });
        get().recalcCart();
      },
      addToCart: (productId, qty) => {
        const product = [...Object.values(get().productEdits), ...mockProducts].find((p) => p.id === productId);
        if (!product) return;
        const existing = get().cart.find((l) => l.productId === productId);
        const newQty = (existing?.qty ?? 0) + qty;
        const price = computePrice({
          product,
          qty: newQty,
          offers: getAllOffers(get()),
          customer: get().customer,
          contract: getActiveContract(get(), product.id),
          isFirstOrder: get().newOrders.length === 0,
          cartTotal: computeCartRaw(get()).subtotal,
          cashPayment: get().cashPayment,
        });
        const line: CartLine = {
          productId,
          qty: newQty,
          unitPrice: price.unitPrice,
          basePrice: product.basePrice,
          tierLabel: price.tierLabel,
          appliedOfferIds: price.appliedOffers.map((o) => o.id),
          breakdown: price.steps,
        };
        set((s) => ({ cart: [...s.cart.filter((l) => l.productId !== productId), line] }));
        get().recalcCart();
        get().markViewed(productId);
      },
      setCartQty: (productId, qty) => {
        if (qty <= 0) return get().removeFromCart(productId);
        set((s) => ({ cart: s.cart.map((l) => (l.productId === productId ? { ...l, qty } : l)) }));
        get().recalcCart();
      },
      removeFromCart: (productId) => {
        set((s) => ({ cart: s.cart.filter((l) => l.productId !== productId) }));
        get().recalcCart();
      },
      clearCart: () => set({ cart: [] }),
      recalcCart: () => {
        const state = get();
        const offers = getAllOffers(state);
        const cartTotal = computeCartRaw(state).subtotal;
        const cart = state.cart.map((line) => {
          const product = findProduct(state, line.productId);
          if (!product) return line;
          const price = computePrice({
            product,
            qty: line.qty,
            offers,
            customer: state.customer,
            contract: getActiveContract(state, line.productId),
            isFirstOrder: state.newOrders.length === 0,
            cartTotal,
            cashPayment: state.cashPayment,
          });
          void cartTotal;
          return {
            ...line,
            unitPrice: price.unitPrice,
            basePrice: product.basePrice,
            tierLabel: price.tierLabel,
            appliedOfferIds: price.appliedOffers.map((o) => o.id),
            breakdown: price.steps,
          };
        });
        set({ cart });
      },

      // ── علاقه‌مندی و مقایسه
      favorites: [],
      compare: [],
      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
      toggleCompare: (id) =>
        set((s) => {
          if (s.compare.includes(id)) return { compare: s.compare.filter((c) => c !== id) };
          if (s.compare.length >= 4) return { compare: [...s.compare.slice(1), id] };
          return { compare: [...s.compare, id] };
        }),
      clearCompare: () => set({ compare: [] }),

      // ── سفارش‌ها
      newOrders: [],
      placeOrder: (order) => {
        const seq = get().newOrders.length + 1;
        const full: Order = {
          ...order,
          id: `o-new-${String(seq).padStart(3, '0')}`,
          code: `MKT-${142000 + seq * 3}`,
          trackingCode: `TRK${142000 + seq * 3}`,
        };
        set((s) => ({ newOrders: [full, ...s.newOrders] }));
        get().logAction({
          userId: get().customer?.id ?? 'c-001',
          userName: get().customer?.ownerName ?? 'مشتری دمو',
          roleId: 'rep',
          action: 'ثبت سفارش جدید',
          entity: 'Order',
          entityId: full.id,
          detail: `سفارش ${full.code} به ارزش ${full.grandTotal.toLocaleString('fa-IR')} تومان`,
          severity: 'info',
        });
        const earned = Math.round(full.grandTotal / 50000);
        set((s) => ({ loyaltyPoints: s.loyaltyPoints + earned }));
        return full;
      },

      // ── استعلام، تیکت، اعلان
      rfqs: [],
      addRfq: (rfq) => set((s) => ({ rfqs: [rfq, ...s.rfqs] })),
      tickets: [],
      addTicket: (t) => set((s) => ({ tickets: [t, ...s.tickets] })),
      notifications: mockNotifications,
      markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      loyaltyPoints: 18420,
      addPoints: (n) => set((s) => ({ loyaltyPoints: s.loyaltyPoints + n })),

      recentSearches: [],
      addSearch: (q) =>
        set((s) =>
          q.trim().length < 2
            ? {}
            : { recentSearches: [q, ...s.recentSearches.filter((x) => x !== q)].slice(0, 8) },
        ),
      recentlyViewed: [],
      markViewed: (id) => set((s) => ({ recentlyViewed: [id, ...s.recentlyViewed.filter((x) => x !== id)].slice(0, 12) })),

      auditExtras: [],
      logAction: (entry) =>
        set((s) => ({
          auditExtras: [
            {
              ...entry,
              id: `log-x-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              at: new Date().toISOString(),
              ip: '127.0.0.1 (دمو)',
            },
            ...s.auditExtras,
          ].slice(0, 200),
        })),

      settings: defaultSettings,
      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
        get().logAction({
          userId: get().admin?.id ?? 'u-001',
          userName: get().admin?.fullName ?? 'مدیر ارشد سیستم',
          roleId: get().admin?.roleId ?? 'superadmin',
          action: 'ویرایش تنظیمات سیستم',
          entity: 'Settings',
          entityId: 'settings',
          detail: `کلیدهای ویرایش‌شده: ${Object.keys(patch).join('، ')}`,
          severity: 'critical',
        });
      },

      subscriptions: demoSubscriptions,
      toggleSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) })),
      groupBuys: demoGroupBuys,
      joinGroupBuy: (id, qty) =>
        set((s) => ({
          groupBuys: s.groupBuys.map((g) => (g.id === id ? { ...g, joinedQty: Math.min(g.targetQty, g.joinedQty + qty) } : g)),
        })),

      chatMessages: initialChat,
      pushChat: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),

      resetDemo: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* noop */
        }
        set({
          cart: [],
          favorites: [],
          compare: [],
          newOrders: [],
          rfqs: [],
          tickets: [],
          productEdits: {},
          deletedProductIds: [],
          brandEdits: {},
          offerEdits: {},
          customerEdits: {},
          orderStatusEdits: {},
          contractsExtra: [],
          auditExtras: [],
          loyaltyPoints: 18420,
          settings: defaultSettings,
          subscriptions: demoSubscriptions,
          groupBuys: demoGroupBuys,
          recentSearches: [],
          recentlyViewed: [],
          cashPayment: true,
          notifications: mockNotifications,
          chatMessages: initialChat,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        theme: s.theme,
        customer: s.customer,
        admin: s.admin,
        cart: s.cart,
        cashPayment: s.cashPayment,
        favorites: s.favorites,
        compare: s.compare,
        newOrders: s.newOrders,
        rfqs: s.rfqs,
        tickets: s.tickets,
        notifications: s.notifications,
        loyaltyPoints: s.loyaltyPoints,
        recentSearches: s.recentSearches,
        recentlyViewed: s.recentlyViewed,
        productEdits: s.productEdits,
        deletedProductIds: s.deletedProductIds,
        brandEdits: s.brandEdits,
        offerEdits: s.offerEdits,
        customerEdits: s.customerEdits,
        orderStatusEdits: s.orderStatusEdits,
        contractsExtra: s.contractsExtra,
        auditExtras: s.auditExtras,
        settings: s.settings,
        subscriptions: s.subscriptions,
        groupBuys: s.groupBuys,
      }),
    },
  ),
);

// ─────────────────────────────────────────── توابع کمکی بیرون از استور
export const findProduct = (state: Pick<StoreState, 'productEdits'>, id: string): Product | undefined =>
  state.productEdits[id] ?? mockProducts.find((p) => p.id === id);

export const allProducts = (state: Pick<StoreState, 'productEdits' | 'deletedProductIds'>): Product[] => {
  const editedIds = new Set(Object.keys(state.productEdits));
  const base = mockProducts.filter((p) => !state.deletedProductIds.includes(p.id) && !editedIds.has(p.id));
  const edited = Object.values(state.productEdits).filter((p) => !state.deletedProductIds.includes(p.id));
  return [...edited, ...base];
};

export const allBrands = (state: Pick<StoreState, 'brandEdits'>): Brand[] => {
  const editedIds = new Set(Object.keys(state.brandEdits));
  return [...Object.values(state.brandEdits), ...mockBrands.filter((b) => !editedIds.has(b.id))];
};

export const getAllOffers = (state: Pick<StoreState, 'offerEdits'>): Offer[] => {
  const editedIds = new Set(Object.keys(state.offerEdits));
  return [...Object.values(state.offerEdits), ...mockOffers.filter((o) => !editedIds.has(o.id))];
};

export const getActiveContract = (
  state: Pick<StoreState, 'customer' | 'contractsExtra'>,
  productId: string,
): Contract | null => {
  const all = [...state.contractsExtra, ...mockContracts];
  return (
    all.find(
      (c) =>
        c.customerId === state.customer?.id &&
        c.status !== 'expired' &&
        c.status !== 'draft' &&
        c.productIds.includes(productId),
    ) ?? null
  );
};

const computeCartRaw = (state: StoreState) => ({
  subtotal: state.cart.reduce((s, l) => s + l.unitPrice * l.qty, 0),
});

export const allCustomers = (state: Pick<StoreState, 'customerEdits'>): Customer[] => {
  const editedIds = new Set(Object.keys(state.customerEdits));
  return [...Object.values(state.customerEdits), ...mockCustomers.filter((c) => !editedIds.has(c.id))];
};

export const allOrders = (state: Pick<StoreState, 'orderStatusEdits' | 'newOrders'>): Order[] => {
  // تغییر وضعیت روی هر دو مجموعه اعمال می‌شود: سفارش‌های نمونه و سفارش‌های ثبت‌شده در دمو
  const withStatus = (o: Order): Order => {
    const st = state.orderStatusEdits[o.id];
    return st ? { ...o, status: st } : o;
  };
  return [...state.newOrders.map(withStatus), ...mockOrders.map(withStatus)];
};

export const allContracts = (state: Pick<StoreState, 'contractsExtra'>): Contract[] => [...state.contractsExtra, ...mockContracts];
export const allNotifications = (state: Pick<StoreState, 'notifications'>) => state.notifications;
export const allAuditLogs = (state: Pick<StoreState, 'auditExtras'>): AuditLog[] => [...state.auditExtras];

/**
 * هوک‌های خواندنی
 * نکته: از useMemo استفاده می‌شود تا در هر رندر، اسنپ‌شات جدید ساخته نشود
 * (جلوگیری از حلقه بی‌پایان در useSyncExternalStore).
 */
export const useProducts = () => {
  const productEdits = useStore((s) => s.productEdits);
  const deletedProductIds = useStore((s) => s.deletedProductIds);
  return useMemo(() => allProducts({ productEdits, deletedProductIds }), [productEdits, deletedProductIds]);
};

export const useBrands = () => {
  const brandEdits = useStore((s) => s.brandEdits);
  return useMemo(() => allBrands({ brandEdits }), [brandEdits]);
};

export const useOffers = () => {
  const offerEdits = useStore((s) => s.offerEdits);
  return useMemo(() => getAllOffers({ offerEdits }), [offerEdits]);
};

export const useOrders = () => {
  const orderStatusEdits = useStore((s) => s.orderStatusEdits);
  const newOrders = useStore((s) => s.newOrders);
  return useMemo(() => allOrders({ orderStatusEdits, newOrders }), [orderStatusEdits, newOrders]);
};

export const useCustomers = () => {
  const customerEdits = useStore((s) => s.customerEdits);
  return useMemo(() => allCustomers({ customerEdits }), [customerEdits]);
};

export const useAuditLogs = () => {
  const auditExtras = useStore((s) => s.auditExtras);
  return useMemo(() => [...auditExtras, ...auditLogs], [auditExtras]);
};

export const useContracts = () => {
  const contractsExtra = useStore((s) => s.contractsExtra);
  return useMemo(() => [...contractsExtra, ...mockContracts], [contractsExtra]);
};

/** نگاشت شناسه به شیء برای دسترسی سریع */
export const useProductMap = () => {
  const list = useProducts();
  return useMemo(() => new Map(list.map((p) => [p.id, p])), [list]);
};

export const useBrandMap = () => {
  const list = useBrands();
  return useMemo(() => new Map(list.map((b) => [b.id, b])), [list]);
};

/** دسترسی خارج از کامپوننت */
export const getAllProductsNow = () => allProducts(useStore.getState());
export const getAllBrandsNow = () => allBrands(useStore.getState());
export const getAllOffersNow = () => getAllOffers(useStore.getState());
