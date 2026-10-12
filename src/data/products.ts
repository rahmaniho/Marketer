import type { PriceTier, Product, SalesUnit } from '@/lib/types';
import { brands } from './brands';
import { categoryById } from './categories';

/**
 * کاتالوگ محصولات (Mock) — ۸۰+ قلم کالای عمده
 * قالب هر ردیف:
 * [نام فارسی، نام لاتین، نام برند، دسته، واحد فروش، تعداد در کارتن، بسته‌بندی،
 *  قیمت پایه کارتن (تومان)، قیمت مصرف‌کننده، MOQ، تنظیمات]
 *
 * تنظیمات: tiers=تعداد:درصد,تعداد:درصد | cash=درصد تخفیف نقدی | badges=... | tags=...
 */
type Seed = [string, string, string, string, SalesUnit, number, string, number, number, number, string?];

const brandIdByName = (name: string): string => {
  const found = brands.find((b) => b.name === name || b.name.includes(name) || name.includes(b.name));
  return found?.id ?? brands[0].id;
};

const DEFAULT_TIERS: [number, number][] = [
  [5, 3],
  [10, 6],
  [20, 9],
  [50, 13],
];

const buildTiers = (basePrice: number, spec?: string): PriceTier[] => {
  const steps: [number, number][] = spec
    ? (spec.split(',').map((pair) => {
        const [q, p] = pair.split(':');
        return [Number(q), Number(p)] as [number, number];
      }) as [number, number][])
    : DEFAULT_TIERS;
  const tiers: PriceTier[] = [
    { minQty: 1, price: basePrice, discountPercent: 0, label: 'قیمت پایه' },
    ...steps.map(([qty, pct]) => ({
      minQty: qty,
      price: Math.round((basePrice * (100 - pct)) / 100),
      discountPercent: pct,
      label: `از ${qty} ${qty >= 50 ? 'کارتن (پالتی)' : 'کارتن'}`,
    })),
  ];
  return tiers;
};

const opts = (meta: string): Record<string, string> =>
  Object.fromEntries(
    meta
      .split('|')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2),
  ) as Record<string, string>;

let seedIndex = 0;

const makeProduct = (seed: Seed): Product => {
  const [name, nameEn, brandName, categoryId, unit, perCarton, pack, price, market, moq, meta = ''] = seed;
  const o = opts(meta);
  const i = seedIndex++;
  const cat = categoryById(categoryId);
  const brandId = brandIdByName(brandName);
  const cash = Number(o.cash ?? (i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 0));
  const stock = Number(o.stock ?? 12 + ((i * 17) % 180));
  const shelfLife = Number(o.shelf ?? 6 + (i % 18));
  const prodDate = new Date(Date.now() - (i % 9) * 86400000 * 11);
  const expiry = new Date(prodDate.getTime() + shelfLife * 30 * 86400000);
  const badgeList = (o.badges ?? '').split(',').filter(Boolean);

  return {
    id: `p-${String(i + 1).padStart(3, '0')}`,
    name,
    nameEn,
    brandId,
    categoryId,
    barcode: `62${String(1000000000 + i * 7919).slice(0, 11)}`,
    sku: `${categoryId.toUpperCase().slice(0, 4)}-${String(1000 + i)}`,
    unit,
    unitsPerCarton: perCarton,
    packDesc: pack,
    basePrice: price,
    marketPrice: market,
    cashDiscountPercent: cash,
    tiers: buildTiers(price, o.tiers),
    stock,
    reserved: Math.floor(stock * 0.12),
    warehouseId: `w-00${(i % 3) + 1}`,
    productionDate: prodDate.toISOString(),
    expiryDate: expiry.toISOString(),
    shelfLifeMonths: shelfLife,
    moq,
    paletteQty: perCarton > 0 ? Number(o.pallet ?? 40 + ((i * 7) % 60)) : 24,
    country: brands.find((b) => b.id === brandId)?.country ?? 'ایران',
    images: [0, 1, 2].map((k) => ({
      seed: `img-${i + 1}-${k + 1}`,
      hue: (((cat?.color ?? '#0f684c') as string) + k) as string,
      icon: cat?.icon ?? 'package',
    })),
    badges: [
      ...(brands.find((b) => b.id === brandId)?.origin === 'international' ? (['imported'] as const) : (['irc'] as const)),
      ...(i % 7 === 0 ? (['bestseller'] as const) : []),
      ...(i % 11 === 0 ? (['new'] as const) : []),
      ...(i % 6 === 0 ? (['halal'] as const) : []),
      ...(i % 13 === 5 ? (['organic'] as const) : []),
      ...badgeList as ('halal' | 'organic' | 'imported' | 'irc' | 'new' | 'bestseller' | 'expiring')[],
    ],
    tags: [
      cat?.name ?? '',
      ...(o.tags ? o.tags.split(',') : []),
      ...(cat?.parentId ? [categoryById(cat.parentId)?.name ?? ''] : []),
    ].filter(Boolean),
    description: `${name} ${brandName} — ${pack}. ${unit} ${perCarton} عددی، مناسب فروشگاه‌های زنجیره‌ای، سوپرمارکت و رستوران. قیمت‌گذاری پله‌ای عمده، تسویه نقدی/اعتباری و ارسال سراسری از انبارهای تهران، مشهد و شیراز.`,
    rating: Number((3.8 + ((i * 11) % 12) / 10).toFixed(1)),
    soldCount: 240 + ((i * 337) % 9800),
    isActive: true,
    createdAt: new Date(Date.now() - (200 - i) * 86400000).toISOString(),
  };
};

const SEEDS: Seed[] = [
  // ---------------- لبنیات ----------------
  ['شیر پرچرب فرادما ۱ لیتری', 'UHT Full-Fat Milk 1L', 'کاله', 'milk', 'کارتن', 12, '۱۲ عدد × ۱ لیتر', 720000, 78000, 3, 'badges=bestseller|tiers=10:4,25:8,60:12'],
  ['شیر کم‌چرب فرادما ۱ لیتری', 'UHT Low-Fat Milk 1L', 'پگاه', 'milk', 'کارتن', 12, '۱۲ عدد × ۱ لیتر', 690000, 75000, 3, 'tiers=10:4,25:8,60:12'],
  ['شیر ESL بطری ۹۰۰ گرمی', 'ESL Bottle Milk 900g', 'میهن', 'milk', 'کارتن', 9, '۹ عدد × ۹۰۰ گرم', 585000, 72000, 4, ''],
  ['شیر شکلاتی ۲۰۰ میلی‌لیتر', 'Chocolate Milk 200ml', 'کاله', 'milk', 'کارتن', 24, '۲۴ عدد × ۲۰۰ میلی‌لیتر', 620000, 32000, 5, 'cash=2'],
  ['ماست پرچرب دبه ۲.۵ کیلویی', 'Full-Fat Yogurt 2.5kg', 'کاله', 'yogurt', 'کارتن', 4, '۴ عدد × ۲.۵ کیلوگرم', 1180000, 320000, 4, 'badges=bestseller|tiers=8:3,20:7,40:10'],
  ['ماست کم‌چرب ۲ کیلویی', 'Low-Fat Yogurt 2kg', 'پگاه', 'yogurt', 'کارتن', 6, '۶ عدد × ۲ کیلوگرم', 1140000, 205000, 4, ''],
  ['دوغ گازدار ۱.۵ لیتری', 'Sparkling Doogh 1.5L', 'رامک', 'yogurt', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 510000, 95000, 5, 'badges=bestseller|cash=3'],
  ['دوغ بدون گاز ۲۴۰ میلی‌لیتری', 'Flat Doogh 240ml', 'دامداران', 'yogurt', 'شرینک', 12, '۱۲ عدد × ۲۴۰ میلی‌لیتر', 240000, 22000, 10, 'tiers=20:4,60:9'],
  ['کشک سنتی ۸۰۰ گرمی', 'Traditional Kashk 800g', 'رامک', 'yogurt', 'کارتن', 12, '۱۲ عدد × ۸۰۰ گرم', 1320000, 125000, 3, ''],
  ['کفیر طبیعی ۱ لیتری', 'Kefir 1L', 'رامک', 'yogurt', 'کارتن', 6, '۶ عدد × ۱ لیتر', 690000, 130000, 4, ''],
  ['پنیر سفید ۴۰۰ گرمی ۲۵٪', 'White Cheese 400g', 'کاله', 'cheese', 'کارتن', 16, '۱۶ عدد × ۴۰۰ گرم', 1420000, 105000, 3, 'badges=bestseller|tiers=8:4,24:9'],
  ['پنیر UFO خامه‌ای ۲۰۰ گرمی', 'Cream Cheese UFO 200g', 'کاله', 'cheese', 'کارتن', 24, '۲۴ عدد × ۲۰۰ گرم', 1560000, 78000, 3, ''],
  ['پنیر پیتزا ورقه‌ای ۱ کیلویی', 'Pizza Cheese Slices 1kg', 'پگاه', 'cheese', 'کارتن', 8, '۸ بسته × ۱ کیلوگرم', 2180000, 310000, 2, 'cash=3'],
  ['پنیر خامه‌ای صبحانه ۵۰۰ گرمی', 'Breakfast Cream Cheese 500g', 'آلیما', 'cheese', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1740000, 168000, 3, 'badges=imported'],
  ['کره حیوانی ۱۰۰ گرمی', 'Animal Butter 100g', 'میمن', 'butter', 'کارتن', 24, '۲۴ عدد × ۱۰۰ گرم', 1980000, 92000, 3, 'tiers=6:3,12:7'],
  ['کره گیاهی ۵۰۰ گرمی', 'Vegetable Butter 500g', 'به‌پاک', 'butter', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1080000, 105000, 3, ''],
  ['خامه صبحانه ۲۰۰ گرمی', 'Breakfast Cream 200g', 'کاله', 'butter', 'شرینک', 12, '۱۲ عدد × ۲۰۰ گرم', 384000, 38000, 8, ''],
  ['بستنی سنتی ۴.۵ لیتری', 'Traditional Ice Cream 4.5L', 'دومینو', 'icecream', 'کارتن', 2, '۲ عدد × ۴.۵ لیتر', 1960000, 1080000, 2, 'badges=bestseller'],
  ['بستنی قیفی وانیلی شرینک ۶ عددی', 'Vanilla Cone 6-pack', 'پریما', 'icecream', 'شرینک', 8, '۸ شرینک × ۶ عدد', 680000, 95000, 4, ''],
  ['یخ‌دسر میوه‌ای ۷۰ میلی‌لیتری', 'Fruit Ice Pop 70ml', 'گل یخ تبریز', 'icecream', 'کارتن', 40, '۴۰ عدد × ۷۰ میلی‌لیتر', 520000, 18000, 6, ''],

  // ---------------- نوشیدنی ----------------
  ['نوشابه کوکاکولا ۱.۵ لیتری', 'Coca-Cola 1.5L', 'خوشگوار', 'soda', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 540000, 105000, 5, 'badges=bestseller|tiers=20:4,50:8'],
  ['نوشابه زمزم پرتقالی ۱.۵ لیتری', 'Zamzam Orange 1.5L', 'زمزم', 'soda', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 486000, 98000, 5, 'tiers=20:4,60:9'],
  ['نوشابه رژیمی کوکاکولا زیرو ۳۰۰ میلی‌لیتری', 'Coca-Cola Zero 300ml', 'خوشگوار', 'soda', 'شرینک', 12, '۱۲ عدد × ۳۰۰ میلی‌لیتر', 300000, 28000, 10, ''],
  ['نوشابه پپسی ۱.۵ لیتری', 'Pepsi 1.5L', 'دینا', 'soda', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 510000, 100000, 5, ''],
  ['نوشابه سون‌آپ لیمو ۱.۵ لیتری', 'Sunsup Lemon 1.5L', 'دینا', 'soda', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 498000, 98000, 5, ''],
  ['آب معدنی ۱.۵ لیتری', 'Mineral Water 1.5L', 'دماوند', 'water', 'شرینک', 6, '۶ عدد × ۱.۵ لیتر', 168000, 25000, 20, 'badges=bestseller|tiers=50:5,150:11,pallet=90'],
  ['آب معدنی گازدار ۷۵۰ میلی‌لیتری', 'Sparkling Water 750ml', 'چیکان', 'water', 'کارتن', 12, '۱۲ عدد × ۷۵۰ میلی‌لیتر', 384000, 38000, 8, ''],
  ['آبمیوه سن‌ایچ پرتقال ۱ لیتری', 'Sunich Orange Juice 1L', 'آلفرد', 'juice', 'کارتن', 12, '۱۲ عدد × ۱ لیتر', 1068000, 108000, 4, 'badges=bestseller|tiers=10:4,30:9'],
  ['آبمیوه نکتار سیب ۲۰۰ میلی‌لیتری', 'Apple Nectar 200ml', 'شهد ایران', 'juice', 'شرینک', 12, '۱۲ عدد × ۲۰۰ میلی‌لیتر', 252000, 22000, 12, ''],
  ['ماءالشعیر کلاسیک ۳۳۰ میلی‌لیتری', 'Classic Malt Drink 330ml', 'بهنوش', 'malt', 'کارتن', 24, '۲۴ عدد × ۳۳۰ میلی‌لیتر', 780000, 38000, 6, 'badges=bestseller|cash=2'],
  ['ماءالشعیر لیمویی شیشه‌ای ۳۳۰ میلی‌لیتری', 'Lemon Malt Glass 330ml', 'افس', 'malt', 'کارتن', 24, '۲۴ عدد × ۳۳۰ میلی‌لیتر', 1080000, 52000, 4, 'badges=imported'],
  ['دلستر لیمو ۱.۵ لیتری', 'Delester Lemon 1.5L', 'بهنوش', 'malt', 'کارتن', 6, '۶ عدد × ۱.۵ لیتر', 522000, 100000, 5, ''],
  ['نوشیدنی انرژی‌زا سینرژی ۲۵۰ میلی‌لیتری', 'Synergy Energy Drink 250ml', 'بهنوش', 'energy', 'کارتن', 24, '۲۴ عدد × ۲۵۰ میلی‌لیتر', 1152000, 53000, 4, ''],
  ['نوشیدنی ایزوتونیک ۵۰۰ میلی‌لیتری', 'Isotonic Sport Drink 500ml', 'تینا نوش', 'energy', 'شرینک', 12, '۱۲ عدد × ۵۰۰ میلی‌لیتر', 396000, 35000, 8, ''],
  ['نسکافه کلاسیک ۲۰۰ گرمی', 'Nescafe Classic 200g', 'نستله', 'hotdrink', 'کارتن', 12, '۱۲ عدد × ۲۰۰ گرم', 4680000, 420000, 2, 'badges=imported,tiers=6:4,12:8'],
  ['چای سیاه کیسه‌ای ۱۰۰ عددی', 'Black Tea Bags 100pcs', 'گلستان', 'tea', 'کارتن', 12, '۱۲ عدد × ۱۰۰ کیسه', 1620000, 175000, 3, 'badges=bestseller'],

  // ---------------- تنقلات ----------------
  ['بیسکویت کرم‌دار وانیلی مینو', 'Minoo Cream Biscuit', 'مینو', 'biscuit', 'کارتن', 24, '۲۴ عدد × ۸۰ گرم', 720000, 32000, 6, 'badges=bestseller|tiers=20:4,50:9,100:14'],
  ['بیسکویت پتی‌بور شیرین عسل', 'Shirin Asal Petit Beurre', 'شیرین عسل', 'biscuit', 'کارتن', 24, '۲۴ عدد × ۹۰ گرم', 660000, 30000, 6, 'tiers=24:5,72:10'],
  ['ویفر شکلاتی پارس مینو', 'Pars Minoo Wafer', 'پارس مینو', 'biscuit', 'کارتن', 24, '۲۴ عدد × ۴۵ گرم', 576000, 26000, 8, ''],
  ['کراکر نمکی بهشت بیسکویت', 'Behesht Salt Cracker', 'بهشت بیسکویت', 'biscuit', 'کارتن', 24, '۲۴ عدد × ۷۵ گرم', 600000, 28000, 6, ''],
  ['چوب شور مینو شرینک ۶ عددی', 'Minoo Pretzel 6-pack', 'مینو', 'biscuit', 'شرینک', 10, '۱۰ شرینک × ۶ عدد', 420000, 45000, 8, ''],
  ['شکلات تلخ ۱۰۰ گرمی', 'Dark Chocolate 100g', 'شونیز', 'chocolate', 'کارتن', 24, '۲۴ عدد × ۱۰۰ گرم', 1680000, 78000, 4, 'badges=bestseller'],
  ['شکلات صبحانه نوتلا ۳۵۰ گرمی', 'Nutella Spread 350g', 'فریرو', 'chocolate', 'کارتن', 12, '۱۲ عدد × ۳۵۰ گرم', 4320000, 395000, 2, 'badges=imported'],
  ['آبنبات چوبی میوه‌ای', 'Fruit Lollipop', 'آذر شهد', 'chocolate', 'کارتن', 60, '۶۰ عدد × ۱۵ گرم', 480000, 12000, 10, 'tiers=60:5,180:12'],
  ['آدامس نعنایی ۱۰ عددی', 'Mint Chewing Gum 10pcs', 'مینو', 'chocolate', 'کارتن', 40, '۴۰ بسته × ۱۰ عدد', 640000, 20000, 8, ''],
  ['کیک روغنی کاکائویی شرینک ۶ عددی', 'Cocoa Sponge Cake 6-pack', 'شیرین عسل', 'cake', 'کارتن', 8, '۸ شرینک × ۶ عدد', 680000, 95000, 5, 'badges=bestseller|cash=3'],
  ['کیک لایه‌ای مربایی شرینک ۶ عددی', 'Jam Layer Cake 6-pack', 'نادی', 'cake', 'شرینک', 8, '۸ شرینک × ۶ عدد', 560000, 78000, 5, ''],
  ['کلوچه گندمی ۵۵ گرمی', 'Wheat Kolucheh 55g', 'ایران نادی', 'cake', 'کارتن', 24, '۲۴ عدد × ۵۵ گرم', 720000, 34000, 6, ''],
  ['چیپس نمکی مینو ۹۰ گرمی', 'Minoo Salted Chips 90g', 'مینو', 'chips', 'کارتن', 24, '۲۴ عدد × ۹۰ گرم', 840000, 38000, 6, 'badges=bestseller|tiers=24:5,48:10'],
  ['پفک نمکی ۸۰ گرمی', 'Salty Puffs 80g', 'شیرین وطن', 'chips', 'کارتن', 24, '۲۴ عدد × ۸۰ گرم', 720000, 32000, 6, ''],
  ['پاپ‌کورن کاراملی V.Nito', 'V.Nito Caramel Popcorn', 'کوروش', 'chips', 'کارتن', 24, '۲۴ عدد × ۷۵ گرم', 1080000, 48000, 5, 'badges=new'],
  ['چیپس کتل‌چیپس نمکی ۷۰ گرمی', 'Kettle Chips 70g', 'دینا', 'chips', 'کارتن', 24, '۲۴ عدد × ۷۰ گرم', 1440000, 65000, 4, 'badges=imported'],
  ['تخمه آفتابگردان شور ۲۰۰ گرمی', 'Salted Sunflower Seeds 200g', 'کوروش', 'nutsnack', 'کارتن', 20, '۲۰ عدد × ۲۰۰ گرم', 1140000, 62000, 5, ''],

  // ---------------- روغن و کنسرو ----------------
  ['روغن سرخ‌کردنی لادن ۱.۸ لیتری', 'Ladan Frying Oil 1.8L', 'لادن', 'oils', 'کارتن', 6, '۶ حلب × ۱.۸ لیتر', 1740000, 315000, 4, 'badges=bestseller|tiers=12:4,36:9'],
  ['روغن مایع آفتابگردان بهار ۱.۸ لیتری', 'Bahar Sunflower Oil 1.8L', 'بهار', 'oils', 'کارتن', 6, '۶ حلب × ۱.۸ لیتر', 1860000, 335000, 4, ''],
  ['روغن زیتون فرابکر اولیتالیا ۱ لیتری', 'Olitalia EVOO 1L', 'اولیتالیا', 'oils', 'کارتن', 12, '۱۲ بطری × ۱ لیتر', 6900000, 640000, 2, 'badges=imported'],
  ['مارگارین قنادی ۵ کیلویی', 'Pastry Margarine 5kg', 'غنچه', 'oils', 'کارتن', 4, '۴ بسته × ۵ کیلوگرم', 3200000, 890000, 2, ''],
  ['رب گوجه‌فرنگی مهرام ۸۰۰ گرمی', 'Mehram Tomato Paste 800g', 'مهرام', 'paste', 'کارتن', 12, '۱۲ عدد × ۸۰۰ گرم', 1380000, 128000, 4, 'badges=bestseller|tiers=12:4,36:9,72:13'],
  ['رب گوجه‌فرنگی یک و یک ۵ کیلویی قوطی', 'Yek-o-Yek Tomato Paste 5kg', 'یک و یک', 'paste', 'کارتن', 4, '۴ قوطی × ۵ کیلوگرم', 2680000, 700000, 2, 'cash=3'],
  ['رب انار طبیعی ۵۰۰ گرمی', 'Natural Pomegranate Paste 500g', '۱ و ۱', 'paste', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1560000, 145000, 3, ''],
  ['سس مایونز مهرام ۵۰۰ گرمی', 'Mehram Mayonnaise 500g', 'مهرام', 'sauce', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1080000, 100000, 4, 'badges=bestseller'],
  ['کچاپ سس مهرام ۵۰۰ گرمی', 'Mehram Ketchup 500g', 'مهرام', 'sauce', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 900000, 88000, 4, ''],
  ['سس خردل مهرام ۲۵۰ گرمی', 'Mehram Mustard 250g', 'مهرام', 'sauce', 'کارتن', 12, '۱۲ شیشه × ۲۵۰ گرم', 780000, 78000, 4, ''],
  ['کنسرو تن ماهی شیلتون ۱۸۰ گرمی', 'Shilton Tuna 180g', 'شیلتون', 'canned', 'کارتن', 24, '۲۴ عدد × ۱۸۰ گرم', 3240000, 145000, 3, 'badges=bestseller'],
  ['کنسرو تن ماهی شیلانه بدون روغن', 'Shilaneh Light Tuna', 'شیلانه', 'canned', 'کارتن', 24, '۲۴ عدد × ۱۸۰ گرم', 3480000, 158000, 3, ''],
  ['کنسرو لوبیا چیتی یک و یک ۴۲۰ گرمی', 'Yek-o-Yek Baked Beans 420g', 'یک و یک', 'canned', 'کارتن', 12, '۱۲ عدد × ۴۲۰ گرم', 960000, 92000, 4, ''],
  ['کنسرو نخود سبز ۳۸۰ گرمی', 'Green Peas Can 380g', 'پایا کنسرو', 'canned', 'کارتن', 24, '۲۴ عدد × ۳۸۰ گرم', 1320000, 62000, 4, ''],
  ['خیارشور بیژن ۸۰۰ گرمی', 'Bijan Pickled Cucumber 800g', 'بیژن', 'pickle', 'کارتن', 12, '۱۲ شیشه × ۸۰۰ گرم', 1260000, 118000, 4, ''],
  ['ترشی مخلوط شیدیس ۷۰۰ گرمی', 'Shidis Mixed Pickle 700g', 'شیدیس', 'pickle', 'کارتن', 12, '۱۲ شیشه × ۷۰۰ گرم', 1140000, 108000, 4, ''],
  ['زیتون کنسروی بدر ۵۰۰ گرمی', 'Badr Canned Olive 500g', 'بدر', 'pickle', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1080000, 102000, 4, ''],
  ['زیتون پرورده محسن ۵۰۰ گرمی', 'Mohsen Marinated Olive 500g', 'محسن', 'pickle', 'کارتن', 12, '۱۲ عدد × ۵۰۰ گرم', 1440000, 132000, 3, ''],
  ['آبلیمو کامبیز ۹۰۰ میلی‌لیتری', 'Kambiz Lime Juice 900ml', 'کامبیز', 'vinegar', 'کارتن', 12, '۱۲ بطری × ۹۰۰ میلی‌لیتر', 900000, 85000, 4, ''],
  ['سرکه سفید وردا ۱ لیتری', 'Varda White Vinegar 1L', 'وردا', 'vinegar', 'کارتن', 12, '۱۲ بطری × ۱ لیتر', 720000, 68000, 4, ''],

  // ---------------- ماکارونی و غذاهای آماده ----------------
  ['ماکارونی ساده تک ماکارون ۷۰۰ گرمی', 'Tak Makaron Spaghetti 700g', 'تک ماکارون', 'macaroni', 'کارتن', 12, '۱۲ عدد × ۷۰۰ گرم', 780000, 72000, 4, 'badges=bestseller|tiers=12:4,36:9,96:15'],
  ['ماکارونی رشته‌ای زر ماکارون ۷۰۰ گرمی', 'Zar Makaron Vermicelli 700g', 'زر ماکارون', 'macaroni', 'کارتن', 12, '۱۲ عدد × ۷۰۰ گرم', 720000, 68000, 4, ''],
  ['لازانیا تک ماکارون ۵۰۰ گرمی', 'Tak Makaron Lasagna 500g', 'تک ماکارون', 'macaroni', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 900000, 85000, 4, ''],
  ['نودل فوری مرغ ۷۵ گرمی', 'Instant Noodle Chicken 75g', 'کیان باداس', 'noodle', 'کارتن', 30, '۳۰ عدد × ۷۵ گرم', 660000, 25000, 8, 'tiers=30:5,90:11'],
  ['سوپ فوری قارچ و خامه', 'Cream of Mushroom Soup', 'کیان باداس', 'noodle', 'کارتن', 24, '۲۴ عدد × ۶۰ گرم', 720000, 32000, 6, ''],
  ['ناگت مرغ به فا ۷۰۰ گرمی', 'Beh Fa Chicken Nugget 700g', 'به فا', 'readymeal', 'کارتن', 12, '۱۲ بسته × ۷۰۰ گرم', 2160000, 195000, 3, 'badges=bestseller'],
  ['کتلت گوشت ۵۰۰ گرمی', 'Meat Cutlet 500g', 'به پخت', 'readymeal', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 1680000, 152000, 3, ''],
  ['فلافل آماده سرخ‌کردنی ۶۰۰ گرمی', 'Falafel Ready Mix 600g', 'راک', 'readymeal', 'کارتن', 12, '۱۲ بسته × ۶۰۰ گرم', 1440000, 132000, 3, ''],
  ['برنج ایرانی طارم هاشمی ۱۰ کیلویی', 'Iranian Tarom Rice 10kg', 'زرین', 'rice', 'کیسه', 1, '۱ کیسه × ۱۰ کیلوگرم', 2850000, 3150000, 5, 'badges=bestseller|tiers=10:3,30:7'],
  ['لوبیا قرمز درجه یک ۹۰۰ گرمی', 'Red Kidney Beans 900g', 'بهاران', 'rice', 'کارتن', 20, '۲۰ بسته × ۹۰۰ گرم', 1980000, 118000, 3, ''],

  // ---------------- پروتئین ----------------
  ['سوسیس آلمانی ۷۰٪ گوشت ۵۰۰ گرمی', 'German Sausage 70% Meat', 'سولیکو', 'sausage', 'کارتن', 20, '۲۰ بسته × ۵۰۰ گرم', 4200000, 235000, 2, 'badges=bestseller'],
  ['کالباس خشک ۹۰٪ گوشت', 'Dry Salami 90% Meat', 'گوشتیران', 'sausage', 'کارتن', 20, '۲۰ بسته × ۳۰۰ گرم', 5600000, 315000, 2, ''],
  ['ژامبون مرغ ۷۰٪ گوشت', 'Chicken Ham 70%', '۲۰۲', 'sausage', 'کارتن', 20, '۲۰ بسته × ۳۰۰ گرم', 3600000, 205000, 2, ''],
  ['همبرگر منجمد ۳۰٪ گوشت ۸ عددی', 'Frozen Burger 8pcs', 'راک', 'burger', 'کارتن', 12, '۱۲ بسته × ۸ عدد', 2880000, 265000, 3, 'badges=bestseller|cash=3'],
  ['مرغ کامل منجمد ۱.۸ کیلویی', 'Frozen Whole Chicken 1.8kg', 'شوکا', 'chicken', 'کارتن', 6, '۶ عدد × ۱.۸ کیلوگرم', 5400000, 985000, 2, ''],
  ['فیله مرغ تازه بسته‌بندی ۹۰۰ گرمی', 'Fresh Chicken Fillet 900g', 'میرا پروتئین', 'chicken', 'کارتن', 8, '۸ بسته × ۹۰۰ گرم', 4680000, 640000, 2, 'badges=new'],
  ['ماهی قزل‌آلای منجمد ۱ کیلویی', 'Frozen Rainbow Trout 1kg', 'فردوس پارس', 'seafood', 'کارتن', 6, '۶ بسته × ۱ کیلوگرم', 6900000, 1280000, 2, ''],
  ['میگوی منجمد بسته ۸۰۰ گرمی', 'Frozen Shrimp 800g', 'فردوس پارس', 'seafood', 'کارتن', 10, '۱۰ بسته × ۸۰۰ گرم', 9600000, 1050000, 2, 'badges=imported'],
  ['تخم مرغ بسته‌بندی ۲۰ عددی', 'Packed Eggs 20pcs', 'چکاد', 'egg', 'شرینک', 10, '۱۰ شرینک × ۲۰ عدد', 1560000, 165000, 4, ''],

  // ---------------- خشکبار و ادویه ----------------
  ['زعفران سرگل یک مثقالی', 'Saffron Super Negin 4.6g', 'سحرخیز', 'spice', 'بسته', 10, '۱۰ بسته × ۱ مثقال', 12500000, 1580000, 2, 'badges=organic'],
  ['زردچوبه ادویه گلستان ۱۰۰ گرمی', 'Golestan Turmeric 100g', 'گلستان', 'spice', 'کارتن', 24, '۲۴ عدد × ۱۰۰ گرم', 1080000, 55000, 4, ''],
  ['فلفل سیاه آسیاب ۵۰ گرمی', 'Black Pepper 50g', 'گلها', 'spice', 'کارتن', 24, '۲۴ عدد × ۵۰ گرم', 1080000, 52000, 4, ''],
  ['سماق ادویه گلستان ۱۰۰ گرمی', 'Golestan Sumac 100g', 'گلستان', 'spice', 'کارتن', 24, '۲۴ عدد × ۱۰۰ گرم', 960000, 48000, 4, ''],
  ['خرما مضافتی ۶۰۰ گرمی', 'Mazafati Dates 600g', 'کوروش', 'driedfruit', 'کارتن', 12, '۱۲ بسته × ۶۰۰ گرم', 1440000, 135000, 3, 'badges=bestseller|cash=3'],
  ['کشمش طلایی ۵۰۰ گرمی', 'Golden Raisin 500g', 'کوروش', 'driedfruit', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 1560000, 145000, 3, ''],
  ['آلو مشهدی خشک ۵۰۰ گرمی', 'Dried Mashhad Plum 500g', 'پالیز', 'driedfruit', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 1380000, 128000, 3, ''],
  ['مغز گردو تازه ۵۰۰ گرمی', 'Walnut Kernel 500g', 'کل شهر', 'driedfruit', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 4980000, 480000, 2, ''],
  ['قند حبه‌ای ۱۰ کیلویی', 'Sugar Cubes 10kg', 'قند اصفهان', 'sugar', 'کیسه', 1, '۱ کیسه × ۱۰ کیلوگرم', 1580000, 178000, 5, 'badges=bestseller|tiers=10:3,40:8'],
  ['شکر سفید بسته ۱۰ کیلویی', 'White Sugar 10kg', 'پیرانشهر', 'sugar', 'کیسه', 1, '۱ کیسه × ۱۰ کیلوگرم', 1450000, 165000, 5, ''],
  ['عسل طبیعی کوهی ۹۰۰ گرمی', 'Mountain Honey 900g', '۱ و ۱', 'sugar', 'کارتن', 6, '۶ شیشه × ۹۰۰ گرم', 2700000, 495000, 2, 'badges=organic'],
  ['نمک خوراکی یددار ۵۰۰ گرمی', 'Iodized Salt 500g', 'بلورین پارس', 'salt', 'کارتن', 24, '۲۴ عدد × ۵۰۰ گرم', 384000, 18000, 8, 'tiers=48:5,144:12'],
  ['پودر ژله توت‌فرنگی ۷۰ گرمی', 'Strawberry Jelly Powder 70g', 'گلرنگ', 'salt', 'کارتن', 48, '۴۸ عدد × ۷۰ گرم', 720000, 20000, 6, ''],

  // ---------------- فریزری ----------------
  ['سبزی سرخ‌شده منجمد ۴۰۰ گرمی', 'Fried Herbs Frozen 400g', 'فردوس پارس', 'frozenveg', 'کارتن', 20, '۲۰ بسته × ۴۰۰ گرم', 1320000, 75000, 3, ''],
  ['مخلوط سبزیجات منجمد ۷۵۰ گرمی', 'Frozen Mixed Veg 750g', 'فردوس پارس', 'frozenveg', 'کارتن', 12, '۱۲ بسته × ۷۵۰ گرم', 1380000, 125000, 3, ''],
  ['پیتزا منجمد پپرونی ۴۰۰ گرمی', 'Frozen Pepperoni Pizza 400g', 'راک', 'frozenmeal', 'کارتن', 12, '۱۲ بسته × ۴۰۰ گرم', 2880000, 265000, 2, 'badges=bestseller'],
  ['لازانیا منجمد گوشت ۵۰۰ گرمی', 'Frozen Beef Lasagna 500g', 'به فا', 'frozenmeal', 'کارتن', 12, '۱۲ بسته × ۵۰۰ گرم', 2640000, 245000, 2, ''],

  // ---------------- کودک ----------------
  ['سرلاک گندم و شیر ۲۵۰ گرمی', 'Cerelac Wheat & Milk 250g', 'نستله', 'babyfood', 'کارتن', 12, '۱۲ عدد × ۲۵۰ گرم', 3240000, 295000, 3, 'badges=imported,bestseller'],
  ['شیرخشک آپتامیل ۲ (۴۰۰ گرمی)', 'Aptamil 2 Formula 400g', 'دنون', 'infant', 'کارتن', 12, '۱۲ عدد × ۴۰۰ گرم', 7200000, 690000, 2, 'badges=imported'],
  ['غذای کودک سبزیجات ۲۰۰ گرمی', 'Baby Vegetable Puree 200g', 'نانو', 'babyfood', 'کارتن', 12, '۱۲ شیشه × ۲۰۰ گرم', 2400000, 215000, 3, 'badges=imported'],

  // ---------------- بهداشتی ----------------
  ['مایع ظرفشویی ۳.۷۵ لیتری', 'Dishwashing Liquid 3.75L', 'سی‌گل', 'detergent', 'کارتن', 4, '۴ حلب × ۳.۷۵ لیتر', 1560000, 415000, 4, ''],
  ['پودر ماشین لباسشویی ۵ کیلویی', 'Laundry Powder 5kg', 'فومکس', 'detergent', 'کارتن', 4, '۴ بسته × ۵ کیلوگرم', 2100000, 545000, 3, ''],
  ['صابون آنتی‌باکتریال ۱۰۰ گرمی', 'Antibacterial Soap 100g', 'به‌پاک', 'soap', 'کارتن', 48, '۴۸ عدد × ۱۰۰ گرم', 1320000, 32000, 6, ''],
  ['دستمال کاغذی جعبه‌ای ۱۰۰ برگ', 'Facial Tissue 100 Sheets', 'گلرنگ', 'paper', 'کارتن', 24, '۲۴ جعبه × ۱۰۰ برگ', 1200000, 62000, 5, ''],

  // ---------------- ملزومات فروشگاه ----------------
  ['پاکت کرافت سایز متوسط', 'Kraft Paper Bag Medium', 'پارس تدارک', 'packaging', 'بسته', 100, '۱۰۰ عدد بسته', 850000, 12000, 5, ''],
  ['رول کاغذ حرارتی صندوق ۸۰ میلی‌متری', 'Thermal POS Roll 80mm', 'پارس تدارک', 'pos', 'شرینک', 20, '۲۰ رول شرینک', 1900000, 115000, 4, ''],
];

export const products: Product[] = SEEDS.map(makeProduct);

export const productById = (id: string): Product | undefined => products.find((p) => p.id === id);
export const productsByBrand = (brandId: string) => products.filter((p) => p.brandId === brandId);
export const productsByCategory = (categoryId: string) =>
  products.filter((p) => p.categoryId === categoryId || categoryById(p.categoryId)?.parentId === categoryId);
export const bestsellers = products.filter((p) => p.badges.includes('bestseller'));
export const newProducts = products.filter((p) => p.badges.includes('new'));
export const importedProducts = products.filter((p) => p.badges.includes('imported'));
