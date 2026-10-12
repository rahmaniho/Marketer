import type { Brand, LicenseKind, LicenseStatus, Origin } from '@/lib/types';
import { slugify } from '@/lib/format';

/**
 * پایگاه داده برندهای ایرانی و بین‌المللی مجاز
 * هر برند شامل: نام فارسی/لاتین، کشور، دسته‌ها، خطوط تولید، وضعیت مجوز و پالت لوگو
 * لوگوها به‌صورت SVG اختصاصی و محلی ساخته می‌شوند (بدون تصویر خارجی) — مؤلفه <BrandLogo/>
 */

type Seed = [
  /** نام فارسی */ string,
  /** نام لاتین */ string,
  /** دسته‌ها (با کاما) */ string,
  /** خطوط تولید (با کاما) */ string,
  /** تنظیمات تکمیلی: country|origin|est|exclusive|rep|representative|note */ string?,
];

const PALETTES: Brand['logo'][] = [
  { from: '#0f684c', to: '#45bd8b', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#b91c1c', to: '#f87171', fg: '#ffffff', shape: 'shield', initials: '' },
  { from: '#1d4ed8', to: '#60a5fa', fg: '#ffffff', shape: 'square', initials: '' },
  { from: '#b45309', to: '#fbbf24', fg: '#ffffff', shape: 'hex', initials: '' },
  { from: '#6d28d9', to: '#a78bfa', fg: '#ffffff', shape: 'pill', initials: '' },
  { from: '#0e7490', to: '#22d3ee', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#be185d', to: '#f472b6', fg: '#ffffff', shape: 'square', initials: '' },
  { from: '#15803d', to: '#4ade80', fg: '#ffffff', shape: 'shield', initials: '' },
  { from: '#7c2d12', to: '#fb923c', fg: '#ffffff', shape: 'hex', initials: '' },
  { from: '#334155', to: '#94a3b8', fg: '#ffffff', shape: 'pill', initials: '' },
  { from: '#4c1d95', to: '#c084fc', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#065f46', to: '#34d399', fg: '#ffffff', shape: 'square', initials: '' },
  { from: '#9a3412', to: '#fdba74', fg: '#2b1608', shape: 'shield', initials: '' },
  { from: '#0284c7', to: '#7dd3fc', fg: '#04263a', shape: 'hex', initials: '' },
  { from: '#a16207', to: '#fde047', fg: '#3a2c05', shape: 'pill', initials: '' },
  { from: '#831843', to: '#fb7185', fg: '#ffffff', shape: 'round', initials: '' },
  { from: '#155e75', to: '#5eead4', fg: '#04283a', shape: 'square', initials: '' },
  { from: '#3f6212', to: '#a3e635', fg: '#1c2905', shape: 'shield', initials: '' },
  { from: '#7e22ce', to: '#e879f9', fg: '#ffffff', shape: 'hex', initials: '' },
  { from: '#1e3a8a', to: '#38bdf8', fg: '#ffffff', shape: 'pill', initials: '' },
];

/** حروف اختصاری از نام فارسی برند */
const initialsOf = (name: string): string => {
  const clean = name.replace(/[()«»\-–]/g, ' ').replace(/شرکت|گروه|صنعتی|صنایع|غذایی|لبنیات|نوشیدنی|روغن|نباتی|تولیدی|کارخانه/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.slice(0, 2);
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]).slice(0, 2);
};

const LICENSE_KINDS: LicenseKind[] = ['وزارت بهداشت', 'استاندارد', 'IRC', 'حلال', 'ارگانیک'];

const makeBrand = (seed: Seed, index: number): Brand => {
  const [name, nameEn, cats, lines, meta = ''] = seed;
  const flags = Object.fromEntries(
    meta
      .split('|')
      .map((p) => p.split('='))
      .filter((p) => p.length === 2),
  ) as Record<string, string>;

  const country = flags.country ?? 'ایران';
  const origin: Origin = (flags.origin as Origin) ?? (country === 'ایران' ? 'iran' : 'international');
  const international = origin === 'international';
  const palette = PALETTES[index % PALETTES.length];
  const status: LicenseStatus = index % 13 === 4 ? 'expiring' : index % 19 === 7 ? 'pending' : 'valid';
  const licenseKind: LicenseKind = international ? 'IRC' : LICENSE_KINDS[index % LICENSE_KINDS.length];

  return {
    id: `b-${String(index + 1).padStart(3, '0')}`,
    name,
    nameEn,
    slug: slugify(nameEn || name),
    country,
    origin,
    industry: (flags.industry as Brand['industry']) ?? (cats.includes('hygiene') ? 'mixed' : 'food'),
    categoryIds: cats.split(',').map((c) => c.trim()).filter(Boolean),
    productLines: lines.split(',').map((c) => c.trim()).filter(Boolean),
    description: `${name} (${nameEn}) — ${international ? 'برند وارداتی مجاز' : 'تولیدکننده ایرانی'} فعال در گروه‌های ${lines
      .split(',')
      .slice(0, 3)
      .map((s) => s.trim())
      .join('، ')}.`,
    licenseKind,
    licenseCode: international
      ? `IRC-${1000000 + index * 137}`
      : `IRC-${250000000 + index * 373}`,
    licenseStatus: status,
    licenseExpiry: new Date(
      Date.UTC(2026 + (index % 3), (index * 5) % 12, 10 + (index % 18)),
    ).toISOString(),
    logo: { ...palette, initials: initialsOf(name) },
    established: Number(flags.est) || 1340 + ((index * 7) % 60),
    rating: Number((3.6 + ((index * 13) % 14) / 10).toFixed(1)),
    exclusive: flags.exclusive === '1',
    representative: flags.rep,
    isActive: true,
    tags: [
      ...(international ? ['وارداتی', 'مجوز IRC'] : ['تولید داخل']),
      ...(index % 5 === 0 ? ['پرفروش'] : []),
      ...(flags.exclusive === '1' ? ['نمایندگی انحصاری'] : []),
    ],
  };
};

/** فهرست فشرده برندها: [نام فارسی، نام لاتین، دسته‌ها، خطوط تولید، تنظیمات] */
const SEEDS: Seed[] = [
  // ============ گروه‌های بزرگ و برندهای شاخص ایرانی ============
  ['گروه صنعتی گلرنگ', 'Golrang Industrial Group', 'snack,pantry,grocery,dairy', 'پروشات کوروش,کوروش,سس مایونز,خشکبار,چیپس و پاپ‌کورن', 'est=1347|exclusive=1'],
  ['گروه صنعتی مینو', 'Minoo Industrial Group', 'snack,beverage,pantry,pasta,dairy', 'بیسکویت,شکلات,کیک,آدامس,چیپس و پفک,روغن,رب,ماکارونی', 'est=1338|exclusive=1'],
  ['گروه صنعتی بهشهر', 'Behshahr Industrial Group', 'pantry,dairy,pasta,snack,hygiene', 'بهار,لادن,به‌پاک,روغن خوراکی,صابون,شوینده,ماکارونی', 'est=1337|exclusive=1'],
  ['گروه صنعتی دینا (پپسی ایران)', 'Dina Holding (Pepsi Iran)', 'beverage,snack', 'پپسی,سون‌آپ,میراندا,کرانچی,نیک‌ناک,کتل‌چیپس', 'est=1344|exclusive=1|rep=نمایندگی انحصاری پپسی در ایران'],
  ['گروه صنایع نوشاب خوشگوار', 'Nooshab Khoshgovar (Coca-Cola Iran)', 'beverage,dairy', 'نوشابه گازدار,آبمیوه,دوغ,شیر,کوکاکولا,فانتا,اسپرایت,دسانی', 'est=1332'],
  ['شرکت لبنیات پگاه', 'Pegah Dairy', 'dairy,frozen', 'شیر,ماست,پنیر,کره,دوغ,بستنی,خامه', 'est=1351|exclusive=1'],
  ['شرکت لبنیات کاله', 'Kalleh Dairy', 'dairy,frozen', 'پنیر,ماست,شیر,دوغ,کره,بستنی,محصولات پروبیوتیک', 'est=1369|exclusive=1'],
  ['شرکت صنایع غذایی تک ماکارون', 'Tak Makaron', 'pasta', 'ماکارونی,رشته,لازانیا,اسپاگتی', 'est=1350|exclusive=1'],
  ['شرکت صنایع غذایی زر ماکارون', 'Zar Makaron', 'pasta', 'ماکارونی,رشته,اسپاگتی', 'est=1363'],
  ['شرکت گلستان', 'Golestan', 'grocery,snack', 'چای,ادویه‌جات,سبزیجات خشک,زعفران,سماق,لیمو عمانی,خشکبار', 'est=1349|exclusive=1'],
  ['شرکت مهرام', 'Mehram', 'pantry', 'رب گوجه‌فرنگی,کچاپ,مایونز,خردل,ترشیجات,آبلیمو,سرکه,ادویه', 'est=1354|exclusive=1'],
  ['شرکت یک و یک', 'Yek-o-Yek', 'pantry,pasta,grocery', 'رب گوجه‌فرنگی,کنسرو,ترشیجات,آبلیمو,سرکه,سس,مربا', 'est=1352'],
  ['شرکت اویلا', 'Oila', 'pantry', 'روغن سرخ‌کردنی,روغن مایع,کنسرو تن ماهی,زیتون,خیارشور', 'est=1379'],
  ['شرکت بهروز', 'Behrouz', 'pantry', 'رب گوجه‌فرنگی,کنسرو,خیارشور,ترشیجات,سس', 'est=1352'],
  ['شرکت دلپذیر', 'Delpazir', 'pantry', 'رب گوجه‌فرنگی,سس,خیارشور,ترشیجات', 'est=1350'],
  ['شرکت شیلتون', 'Shilton', 'pantry', 'کنسرو تن ماهی,کنسرو مرغ,کنسرو حبوبات,کنسرو سبزیجات', 'est=1362'],
  ['شرکت تحفه', 'Tohfeh', 'pantry,pasta', 'کنسرو تن ماهی,کنسرو حبوبات,غذاهای آماده', 'est=1368'],
  ['شرکت صنایع غذایی نادی', 'Nadi', 'snack', 'کلوچه,کیک لایه‌ای,کاپ‌کیک,بیسکویت,شیرینی', 'est=1349'],
  ['شرکت صنایع غذایی شیرین وطن', 'Shirin Vatan', 'snack', 'کیک,بیسکویت,کراکر,پفک,شکلات,چیپس', 'est=1358'],
  ['شرکت شکلات آبش', 'Abesh (Mehr Darya)', 'snack', 'کیک روغنی,کیک لایه‌ای,کیک رولتی,بیسکویت,شکلات', 'est=1370'],
  ['شرکت شکوه شهد', 'Shokouh Shahd', 'snack,grocery', 'سوهان,شکلات,سوغات', 'est=1360'],
  ['شرکت صنایع غذایی بابل آب', 'Babol Ab', 'beverage,dairy,snack', 'نوشابه گازدار,لبنیات سنتی,مواد اولیه قنادی', 'est=1355'],
  ['شرکت صنایع غذایی نظری', 'Nazari', 'snack', 'کیک,کلوچه', 'est=1372'],
  ['شرکت گوشتیران', 'Gooshtiran', 'protein', 'سوسیس,کالباس,همبرگر,ژامبون', 'est=1350'],
  ['شرکت سولیکو (کاله پروتئین)', 'Solico', 'protein,dairy', 'سوسیس,کالباس,همبرگر,فرآورده‌های گوشتی', 'est=1355'],
  ['شرکت فرآورده‌های گوشتی ۲۰۲', '202 Meat Products', 'protein', 'سوسیس,کالباس,همبرگر,ژامبون', 'est=1356'],
  ['شرکت روغن نباتی بهار', 'Bahar Vegetable Oil', 'pantry', 'روغن سرخ‌کردنی,روغن مایع,روغن جامد', 'est=1325'],
  ['شرکت روغن نباتی لادن', 'Ladan Vegetable Oil', 'pantry', 'روغن سرخ‌کردنی,روغن مایع,روغن جامد', 'est=1347'],
  ['شرکت روغن نباتی ورامین', 'Varamin Vegetable Oil', 'pantry', 'روغن سرخ‌کردنی,روغن مایع,روغن جامد', 'est=1343'],
  ['شرکت رامک شیراز', 'Ramak Dairy', 'dairy', 'دوغ کفیر,ماست,پنیر,کشک,لبنیات', 'est=1365'],
  ['شرکت پارس نوش (پریسان)', 'Pars Noosh (Prisan)', 'beverage', 'نوشیدنی میوه‌ای بدون گاز,شربت', 'est=1368'],
  ['شرکت بلورین پارس', 'Bolourin Pars', 'grocery', 'نمک خوراکی پودری,نمک یددار', 'est=1375'],
  ['شرکت پارمیس (کشت سبز شیراز)', 'Parmis', 'grocery', 'قند خرد شده,شکر سفید', 'est=1382'],
  ['شرکت چیکان (مروارید سپیدان)', 'Chikan', 'beverage', 'آب معدنی طبیعی,آب چشمه', 'est=1378'],
  ['شرکت ارمغان شیراز (آوا)', 'Ava', 'protein', 'ژامبون گوشت مرغ,فرآورده گوشتی', 'est=1384'],
  ['شرکت شیدیس شیراز', 'Shidis', 'pantry', 'ترشی سیر,ترشی موسیر,ترشی مخلوط,لیته,بندری', 'est=1370'],
  ['شرکت ۱ و ۱ دشت مرغاب', '1 & 1 Dasht-e Morghab', 'pantry,grocery,pasta', 'روغن زیتون,عسل,مربا,رب انار,ماکارونی,ترشیجات', 'est=1373'],
  ['شرکت ۱۷۷۷ صنایع غذایی', '1777 Food Industries', 'pasta', 'غذاهای آماده,ساندویچ سرد,سالاد', 'est=1386'],
  ['شرکت عباسپور', 'Abbaspour', 'snack', 'شکلات,تافی,آبنبات', 'est=1343'],
  ['شرکت زعفران عباس‌زاده', 'Abbaszadeh Saffron', 'grocery', 'زعفران,سوغات', 'est=1363'],
  ['شرکت نستله ایران', 'Nestle Iran', 'baby,beverage,snack,hotdrink', 'سرلاک,گربر,نستوم,نسکافه,چوکاپیک,نسکوئیک,کیت‌کت,مگی', 'country=سوئیس|origin=international|est=1364|exclusive=1'],
  ['شرکت دنون ایران', 'Danone Iran', 'dairy,baby', 'دنت,اکتیویا,اکتیمل,دانونینو,آپتامیل', 'country=فرانسه|origin=international|est=1368'],
  ['شرکت هینکن ایران (کاسل نوش)', 'Heineken Iran (Casl Noosh)', 'beverage', 'ماءالشعیر بدون الکل,دلستر', 'country=هلند|origin=international|est=1379'],
  ['شرکت افس', 'Efes', 'beverage', 'ماءالشعیر شیشه‌ای,لیمو,هلو,سیب,استوایی', 'country=ترکیه|origin=international|est=1348'],
  ['شرکت هوخلاند (آلیما)', 'Hochland (Alima)', 'dairy', 'پنیر صبحانه دانمارکی,پنیر خامه‌ای,پنیر طعم‌دار,کره', 'country=آلمان|origin=international|est=1380'],
  ['شرکت مونینی', 'Monini', 'pantry', 'روغن زیتون,سرکه', 'country=ایتالیا|origin=international|est=1331'],
  ['شرکت اولیتالیا', 'Olitalia', 'pantry,pasta', 'روغن زیتون,سرکه,پاستا,برنج,کنسرو,ادویه', 'country=ایتالیا|origin=international|est=1375'],
  ['شرکت برناردینی / تایانای', 'Bernardini Group / Tayanai', 'pantry,grocery', 'فناوری زنجیره تأمین غلات,صنعت روغن و چربی', 'country=ایتالیا|origin=international|est=1400|rep=نیل تجارت آرتیان'],
  ['شرکت دامداران', 'Damdaran', 'dairy,protein', 'شیر,ماست,پنیر,دوغ,محصولات پروتئینی', 'est=1348'],
  ['شرکت می‌ماس', 'Mimas', 'dairy', 'شیر,ماست,پنیر,دوغ', 'est=1372'],
  ['شرکت هراز', 'Haraz Dairy', 'dairy', 'شیر,ماست,پنیر,دوغ', 'est=1353'],
  ['شرکت عالیس', 'Ales Dairy', 'dairy', 'شیر,ماست,پنیر,دوغ', 'est=1370'],
  ['شرکت آبغی', 'Abghi', 'dairy', 'شیر,ماست,پنیر,دوغ', 'est=1376'],
  ['شرکت میمن', 'Meyman', 'dairy', 'کره حیوانی,کره گیاهی,خامه', 'est=1374'],
  ['شرکت شکلی', 'Shekli', 'dairy', 'کره حیوانی,کره گیاهی', 'est=1368'],
  ['شرکت کالیاکان', 'Kaliakan', 'dairy', 'کره حیوانی,کره گیاهی', 'est=1371'],
  ['شرکت کامبیز', 'Kambiz', 'pantry', 'آبلیمو,آبغوره,سرکه,کشک', 'est=1359'],
  ['شرکت سمیه', 'Samieh', 'pantry', 'آبلیمو,آبغوره,کشک', 'est=1362'],
  ['شرکت وردا', 'Varda', 'pantry', 'سرکه,آبلیمو', 'est=1364'],
  ['شرکت بهرام', 'Bahram Saffron', 'grocery', 'زعفران', 'est=1352'],
  ['شرکت ممتاز فانتان', 'Mumtaz Fantan', 'grocery', 'زعفران', 'est=1366'],
  ['شرکت دامان', 'Daman Saffron', 'grocery', 'زعفران,دارچین', 'est=1370'],
  ['شرکت سحرخیز', 'Saharkhiz', 'grocery', 'زعفران,آلو مشهدی', 'est=1350'],
  ['شرکت پالیز', 'Paliz', 'grocery', 'آلو مشهدی,خشکبار', 'est=1364'],
  ['شرکت برتر', 'Bartar', 'grocery', 'آلو مشهدی,مغز گردو,خلال بادام', 'est=1368'],
  ['شرکت مانی', 'Mani Dried Fruit', 'grocery', 'آلو مشهدی,برگه هلو', 'est=1369'],
  ['شرکت کل شهر', 'Kol Shahr', 'grocery', 'مغز گردو,خلال بادام,لیمو عمانی', 'est=1372'],
  ['شرکت رادین', 'Radin', 'grocery', 'مغز گردو,خلال بادام', 'est=1374'],
  ['شرکت ملارد', 'Malard Food', 'pantry,snack', 'فرآورده‌های غذایی,رب,سس', 'est=1360'],
  ['شرکت صدف', 'Sadaf', 'pantry,snack', 'فرآورده‌های غذایی,ادویه,کیک', 'est=1367'],
  ['شرکت به‌چین', 'Beh Chin', 'pantry', 'فرآورده‌های غذایی,کنسرو', 'est=1365'],
  ['شرکت بدر', 'Badr', 'pantry', 'زیتون,کنسرو,سس,ترشیجات', 'est=1366'],
  ['شرکت محسن', 'Mohsen', 'pantry', 'زیتون,زیتون پرورده', 'est=1368'],
  ['شرکت اصالت', 'Esalat', 'pantry', 'زیتون,روغن زیتون', 'est=1375'],
  ['شرکت شیلانه', 'Shilaneh', 'pantry', 'کنسرو تن ماهی', 'est=1370'],
  ['شرکت بیژن', 'Bijan', 'pantry', 'سس,خیارشور,ترشیجات', 'est=1372'],
  ['شرکت دلوسه', 'Deloseh', 'pantry', 'سس,مایونز,سالاد فصل', 'est=1376'],
  ['شرکت مانا', 'Mana', 'pasta', 'ماکارونی,پاستا', 'est=1372'],
  ['شرکت رشد', 'Roshd', 'pasta', 'ماکارونی,رشته', 'est=1366'],
  ['شرکت میرا پروتئین', 'Mira Protein', 'protein', 'مرغ گرم,قطعات مرغ', 'est=1390'],
  ['شرکت رزینا', 'Rezina', 'protein', 'مرغ گرم,فرآورده مرغ', 'est=1391'],
  ['شرکت مرغ مطر', 'Morgh-e Matar', 'protein', 'مرغ گرم', 'est=1385'],
  ['شرکت شوکا', 'Shoka', 'protein', 'مرغ گرم,بوقلمون', 'est=1388'],
  ['شرکت زریال', 'Zaryal', 'protein', 'مرغ گرم', 'est=1392'],
  ['شرکت چکاد', 'Chekad', 'protein', 'مرغ گرم,تخم مرغ', 'est=1389'],
  ['شرکت آندره', 'Andre', 'protein', 'سوسیس,کالباس,همبرگر', 'est=1378'],
  ['شرکت رناط', 'Renat', 'protein', 'سوسیس,کالباس,همبرگر', 'est=1380'],
  ['شرکت به‌پاک', 'Behpak', 'dairy,pantry,hygiene', 'لبنیات,روغن,صابون,شوینده', 'est=1312'],
  ['شرکت به‌پخت', 'Beh Pokht', 'pasta,pantry', 'غذاهای آماده,کنسرو,کتلت,فلافل', 'est=1385'],
  ['شرکت بهشت بیسکویت', 'Behesht Biscuits', 'snack', 'بیسکویت,کراکر,ویفر', 'est=1380'],
  ['شرکت بهین گوشت و شیر', 'Behin Meat & Milk', 'protein,dairy', 'فرآورده‌های گوشتی,لبنیات', 'est=1383'],
  ['شرکت بهین‌وزین غذا', 'Behinew Wazin Food', 'pantry', 'مواد غذایی,کنسرو', 'est=1386'],
  ['شرکت تهران پگاه', 'Tehran Pegah', 'dairy', 'لبنیات,شیر,ماست', 'est=1352'],
  ['شرکت تهران بختار', 'Tehran Bakhtar', 'pantry', 'مواد غذایی,ترشیجات', 'est=1370'],
  ['شرکت تهران دشت نشاط', 'Tehran Dashte Neshat', 'pantry,grocery', 'مواد غذایی,حبوبات', 'est=1378'],
  ['شرکت تهران زرگوشت', 'Tehran Zar-Gousht', 'protein', 'فرآورده‌های گوشتی,همبرگر', 'est=1380'],
  ['شرکت تلوانگ', 'Televang', 'pantry,pasta', 'مواد غذایی,غذای آماده', 'est=1384'],
  ['شرکت تینا نوش آسیا', 'Tina Noosh Asia', 'beverage', 'نوشیدنی,شربت', 'est=1385'],
  ['شرکت پیچک', 'Pichack', 'pantry,grocery', 'مواد غذایی,حبوبات', 'est=1376'],
  ['شرکت پایا کنسرو', 'Paya Conserve', 'pantry', 'کنسرو تن ماهی,کنسرو مرغ,کنسرو حبوبات,آبلیمو,رب', 'est=1379'],
  ['شرکت پدیده دیناوند', 'Padideh Dinavand', 'pantry', 'مواد غذایی,سس', 'est=1382'],
  ['شرکت پارس تدارک', 'Pars Tadarock', 'pantry', 'مواد غذایی,برنج', 'est=1388'],
  ['شرکت پدرام کسری (انتخاب)', 'Pedram Kasra (Entekhab)', 'snack', 'بیسکویت,پای,کیک', 'est=1381'],
  ['شرکت چای پرشین', 'Persian Tea', 'grocery', 'چای سیاه,چای سبز', 'est=1370'],
  ['شرکت پیرانشهر قند', 'Piranshahr Sugar', 'grocery', 'قند,شکر', 'est=1358'],
  ['شرکت محلاتک غذا', 'Mahalla Tak Food', 'pantry', 'رب گوجه‌فرنگی,ترشیجات,کچاپ,کنسرو,قارچ', 'est=1375'],
  ['شرکت مهدویه', 'Mahdavieh Import Export', 'grocery', 'خشکبار,واردات و صادرات', 'est=1362'],
  ['شرکت ماهی‌دشت (نازگل)', 'Mahidasht Vegetable Oil (Nazgol)', 'pantry,beverage', 'روغن نباتی,روغن مایع,آب معدنی,سس', 'est=1349'],
  ['شرکت مهنا نوش (بوجنه)', 'Mahna Noosh (Boojneh)', 'beverage', 'نوشیدنی,مواد غذایی بهداشتی', 'est=1381'],
  ['شرکت مهنام غذا', 'Mahnam Food Products', 'pantry', 'کنسرو,مربا,ترشیجات,سس', 'est=1379'],
  ['شرکت خاتون لبنیات (سارا)', 'Khatoon Dairy (Sara)', 'dairy', 'لبنیات,ماست,پنیر', 'est=1377'],
  ['شرکت خزر تلد', 'Khazar Told', 'pantry,grocery', 'مواد غذایی,حبوبات', 'est=1380'],
  ['شرکت خلی شکر', 'Kholi Sugar', 'grocery', 'قند,شکر', 'est=1364'],
  ['شرکت خرم نوش', 'Khoram Noosh', 'beverage', 'نوشیدنی,شربت خرما', 'est=1383'],
  ['شرکت کاوه', 'Kaveh', 'pantry,grocery', 'مواد غذایی,ادویه,رب', 'est=1355'],
  ['شرکت صنایع غذایی سینا', 'Sina Food Industries', 'dairy,pantry,beverage', 'لبنیات,مارگارین,نوشیدنی', 'est=1347'],
  ['شرکت پاک لبنیات', 'Pak Dairy', 'dairy,frozen', 'لبنیات,شیر,ماست,بستنی', 'est=1343'],
  ['شرکت پانیذ فام شکر', 'Paniz Fam Sugar', 'grocery', 'قند,شکر', 'est=1372'],
  ['شرکت بهنوش ایران', 'Behnoush Iran', 'beverage', 'ماءالشعیر,دلستر,دوغ آبعلی,تاک,ایراندا,سینرژی', 'est=1363|exclusive=1'],
  ['شرکت فردوس پارس', 'Ferdows Pars', 'grocery,frozen,protein', 'محصولات کشاورزی,محصولات دامی,سبزی منجمد', 'est=1382'],
  ['شرکت قزوین شکر', 'Qazvin Sugar', 'grocery', 'قند,شکر', 'est=1340'],
  ['شرکت کاشفان کویر', 'Kashefan Kavir Farming', 'grocery', 'محصولات کشاورزی,زعفران,پسته', 'est=1380'],
  ['شرکت کایوان غذا', 'Kayvan Food', 'pantry,snack', 'مواد غذایی,تنقلات', 'est=1381'],
  ['شرکت کشت صنعت', 'Kesht Sanat', 'pantry', 'روغن خوراکی,روغن جامد', 'est=1376'],
  ['شرکت پریس (PARS)', 'PARS Oil & Fat', 'pantry', 'روغن و چربی خوراکی', 'est=1374'],
  ['شرکت صنایع غذایی کوروش', 'Kourosh Food Industry', 'grocery,snack,pantry', 'خرما,کشمش,خشکبار,پسته,مغزها,رب,چیپس,پاپ‌کورن', 'est=1380|exclusive=1'],
  ['شرکت زمزم', 'Zamzam', 'beverage', 'نوشیدنی,آب معدنی', 'est=1338|exclusive=1'],
  ['شرکت کیان باداس', 'Kian Badas', 'pasta', 'غذاهای فوری,نودل,سوپ فوری', 'est=1384'],
  ['شرکت آلفرد (سان‌ایچ)', 'Alifard (Sunich)', 'beverage', 'نوشیدنی,آبمیوه,نکتار', 'est=1353|exclusive=1'],
  ['شرکت زعفران اسفدان', 'Esfedan Saffron', 'grocery', 'زعفران,دمنوش', 'est=1379'],
  ['شرکت دنا هلدینگ', 'Dana Holding', 'snack,dairy,grocery', 'شیرین عسل,بیسکویت,کیک,شکلات,لبنیات', 'est=1385|exclusive=1'],
  ['شرکت مهیا پروتئین', 'Mahya Protein', 'protein', 'محصولات پروتئینی,مرغ,سوسیس', 'est=1386'],
  ['شرکت آذر شهد', 'Azar Shahd', 'snack', 'کیک,بیسکویت,پفک,تافی,شکلات,آبنبات,آدامس', 'est=1379'],
  ['شرکت ایران نادی', 'Iran Nadi', 'snack', 'کلوچه,کیک لایه‌ای,کاپ‌کیک', 'est=1349'],

  // ============ برندهای مکمل ایرانی ============
  ['شرکت لبنیات میهن', 'Mihan Dairy', 'dairy,frozen', 'شیر,ماست,پنیر,کره,خامه,بستنی', 'est=1372|exclusive=1'],
  ['شرکت دومینو', 'Domino', 'frozen,dairy', 'بستنی,دسر منجمد', 'est=1355'],
  ['شرکت پریما', 'Prima', 'frozen,dairy', 'بستنی قیفی,دسر', 'est=1370'],
  ['بهاران گل', 'Baharan Gol', 'frozen,dairy', 'بستنی,لبنیات', 'est=1368'],
  ['گل یخ تبریز', 'Gol Yakh Tabriz', 'frozen,snack', 'بستنی پاستوریزه,پشمک', 'est=1356'],
  ['شهد ایران (گلدیس، هانی، بنیس)', 'Shahd Iran', 'beverage', 'آبمیوه,نکتار,نوشیدنی انرژی‌زا', 'est=1364'],
  ['شیرین عسل', 'Shirin Asal', 'snack', 'بیسکویت,کیک,شکلات,ویفر', 'est=1363|exclusive=1'],
  ['شونیز', 'Shoniz', 'snack', 'شکلات,ویفر,تافی,آدامس,بیسکویت,آبنبات', 'est=1369|exclusive=1'],
  ['نگین (میشکا)', 'Negin (Mishka)', 'snack', 'شکلات مغزدار,راحت‌الحلقوم,پشمک,نوقا,ویفر', 'est=1374'],
  ['پارس مینو', 'Pars Minoo', 'snack', 'بیسکویت,شکلات,ویفر,آدامس,غلات حجیم شده', 'est=1362'],
  ['فرمند', 'Farmand', 'snack', 'شکلات,بیسکویت', 'est=1372'],
  ['باراکا', 'Baraka', 'snack', 'شکلات,اسنک', 'est=1392'],
  ['پارمیدا', 'Parmida', 'snack', 'شکلات,آبنبات', 'est=1388'],
  ['راک', 'Rock', 'protein,pasta', 'سوسیس,کالباس,ژامبون,پیتزا,برگر,فلافل', 'est=1382'],
  ['به فا', 'Beh Fa', 'pasta,frozen', 'غذاهای آماده,ناگت,شنیسل,فلافل,کتلت', 'est=1380'],
  ['سمیرا', 'Samira', 'pasta', 'ماکارونی,ورمیشل,لازانیا,اسپاگتی', 'est=1376'],
  ['آفرین ماکارون', 'Afarin Makaron', 'pasta', 'ماکارونی,پاستا,نودل,لازانیا', 'est=1378'],
  ['گلها', 'Golha', 'grocery', 'ادویه‌جات,چاشنی,دمنوش', 'est=1363|exclusive=1'],
  ['طبیعت', 'Tabiat', 'grocery', 'ادویه,رب,کنسرو,چای,قند', 'est=1387'],
  ['چای احمد', 'Ahmad Tea', 'grocery', 'چای سیاه,دمنوش', 'est=1363'],
  ['چای محسن', 'Mohsen Tea', 'grocery', 'چای سیاه', 'est=1352'],
  ['قند اصفهان', 'Isfahan Sugar', 'grocery', 'قند,شکر', 'est=1310'],
  ['قند بیستون', 'Bisotoun Sugar', 'grocery', 'قند,شکر', 'est=1346'],
  ['کوروش پروتئین البرز', 'Kourosh Protein Alborz', 'protein', 'فرآورده‌های گوشتی,پروتئینی خام', 'est=1392'],
  ['تبرک', 'Tabarak', 'pantry,grocery', 'رب گوجه‌فرنگی,سس,آبمیوه,کنسرو', 'est=1376'],
  ['گودین', 'Godin', 'pantry', 'کنسرو گوشتی و غیرگوشتی,رب', 'est=1385'],
  ['فدلک', 'Fadlek', 'pantry', 'کنسرو تن ماهی,کنسرو لوبیا,رب', 'est=1377'],
  ['گلناز', 'Golnaz', 'pantry', 'روغن مایع,روغن سرخ‌کردنی,مارگارین', 'est=1370'],
  ['کشت و صنعت شمال (غنچه)', 'Shomal Agro (Ghoncheh)', 'pantry,dairy', 'مارگارین,روغن نباتی,کره', 'est=1352'],
  ['بهاران', 'Baharan', 'grocery', 'برنج,حبوبات', 'est=1380'],
  ['آورس', 'Avers', 'beverage', 'نوشیدنی,آب معدنی', 'est=1392'],
  ['دماوند', 'Damavand', 'beverage', 'آب معدنی,آب چشمه', 'est=1368|exclusive=1'],
  ['ویمال', 'Vimal', 'beverage', 'آبمیوه,شربت', 'est=1372'],
  ['سن‌ایچ', 'Sunich', 'beverage', 'آبمیوه,نکتار,شربت', 'est=1353'],
  ['کمپوتی', 'Kompo', 'beverage', 'نوشیدنی میوه‌ای,پوره', 'est=1390'],
  ['چای گلستان', 'Golestan Tea', 'grocery', 'چای سیاه,چای سبز,دمنوش', 'est=1349'],
  ['زرین', 'Zarrin', 'grocery', 'برنج,پسته', 'est=1374'],
  ['گلدونه', 'Goldooneh', 'pantry', 'رب,سس,کنسرو', 'est=1386'],
  ['چاشنی', 'Chashni', 'grocery', 'ادویه,سس', 'est=1388'],
  ['سی‌گل', 'Se Gol', 'hygiene', 'شوینده,صابون,دستمال کاغذی', 'est=1376'],
  ['فومکس', 'Fomex', 'hygiene', 'شوینده,پاک‌کننده', 'est=1382'],
  ['کلرادو', 'Kolorado', 'hygiene', 'شوینده,بهداشتی', 'est=1384'],
  ['نی‌سو', 'Niso', 'hygiene', 'شوینده,مایع دستشویی', 'est=1369'],
  ['گلرنگ بهداشتی', 'Golrang Hygiene', 'hygiene', 'شامپو,بهداشت فردی', 'est=1388'],

  // ============ برندهای بین‌المللی مجاز ============
  ['نستله', 'Nestle', 'baby,beverage,snack,hotdrink', 'سرلاک,گربر,نستوم,پیور لایف,پریر,چوکاپیک,فیتنس,نسکافه,کیت‌کت,مگی', 'country=سوئیس|origin=international|est=1866'],
  ['دنون', 'Danone', 'dairy,baby', 'دنت,دنت پاپ,اکتیویا,اکتیمل,دانونینو,آپتامیل', 'country=فرانسه|origin=international|est=1919'],
  ['کوکاکولا', 'Coca-Cola', 'beverage', 'کوکاکولا,زیرو,فانتا,اسپرایت,کانادا درای,دسانی,پاور اید,هی‌دی', 'country=آمریکا|origin=international|est=1892'],
  ['پپسی', 'Pepsi', 'beverage,snack', 'پپسی,سون‌آپ,میراندا,کرانچی,نیک‌ناک,کتل‌چیپس', 'country=آمریکا|origin=international|est=1898'],
  ['هینکن', 'Heineken', 'beverage', 'ماءالشعیر بدون الکل (کاسل نوش)', 'country=هلند|origin=international|est=1864'],
  ['افس', 'Efes', 'beverage', 'ماءالشعیر شیشه‌ای کلاسیک,لیمو,هلو,سیب,استوایی', 'country=ترکیه|origin=international|est=1969'],
  ['هوخلاند', 'Hochland', 'dairy', 'پنیر صبحانه دانمارکی,پنیر خامه‌ای,پنیر دوغ,پنیر زیتون,پنیر چیلی,کره', 'country=آلمان|origin=international|est=1926|rep=برند محلی آلیما'],
  ['مونینی', 'Monini', 'pantry', 'روغن زیتون,سرکه', 'country=ایتالیا|origin=international|est=1920'],
  ['اولیتالیا', 'Olitalia', 'pantry,pasta', 'روغن زیتون,سرکه,کنسرو,پاستا,برنج,ادویه,غذای منجمد', 'country=ایتالیا|origin=international|est=1950'],
  ['برناردینی', 'Bernardini Group', 'pantry,grocery', 'فناوری زنجیره تأمین غلات,صنعت روغن و چربی', 'country=ایتالیا|origin=international|est=1959|rep=نیل تجارت آرتیان'],
  ['مارس', 'Mars', 'snack', 'اسنیکرز,مارس,بونتی,توئیکس,ام‌اندامز', 'country=آمریکا|origin=international|est=1911'],
  ['فریرو', 'Ferrero', 'snack', 'فریرو روشر,کیندر,نوتلا', 'country=ایتالیا|origin=international|est=1946'],
  ['لیندت', 'Lindt', 'snack', 'شکلات تلخ,شکلات شیری', 'country=سوئیس|origin=international|est=1845'],
  ['تابلرون', 'Toblerone', 'snack', 'شکلات,نوقا', 'country=سوئیس|origin=international|est=1908'],
  ['میلکا', 'Milka', 'snack', 'شکلات شیری,شکلات مغزدار', 'country=آلمان|origin=international|est=1901'],
  ['اولکر', 'Ulker', 'snack', 'شکلات,بیسکویت,کیک', 'country=ترکیه|origin=international|est=1944'],
  ['مرسی', 'Merci', 'snack', 'شکلات,شکلات پرالین', 'country=آلمان|origin=international|est=1965'],
  ['روشن', 'Roshen', 'snack', 'شکلات,آبنبات,ویفر', 'country=اوکراین|origin=international|est=1996'],
  ['هریبو', 'Haribo', 'snack', 'پاستیل,آبنبات ژله‌ای', 'country=آلمان|origin=international|est=1920'],
  ['لاوازا', 'Lavazza', 'hotdrink', 'قهوه,کپسول قهوه', 'country=ایتالیا|origin=international|est=1895'],
  ['جیکوبز', 'Jacobs', 'hotdrink', 'قهوه فوری,کاپوچینو', 'country=آلمان|origin=international|est=1895'],
  ['کادبوری', 'Cadbury', 'snack', 'شکلات,پودر کاکائو', 'country=انگلیس|origin=international|est=1824'],
  ['دل‌مونته', 'Del Monte', 'pantry', 'کنسرو میوه,رب,آبمیوه', 'country=آمریکا|origin=international|est=1886'],
  ['هاینتس', 'Heinz', 'pantry', 'کچاپ,سس,کنسرو', 'country=آمریکا|origin=international|est=1869'],
  ['نانو', 'Nānu', 'baby,dairy', 'شیر خشک,غذای کودک', 'country=سوئیس|origin=international|est=1896'],
  ['هوماانا', 'Humana', 'baby', 'غذای کودک,شیر خشک', 'country=آلمان|origin=international|est=1950'],
];

export const brands: Brand[] = SEEDS.map(makeBrand).sort((a, b) => a.name.localeCompare(b.name, 'fa'));

export const brandById = (id: string): Brand | undefined => brands.find((b) => b.id === id);
export const brandName = (id: string): string => brandById(id)?.name ?? 'برند نامشخص';
export const iranianBrands = brands.filter((b) => b.origin === 'iran');
export const internationalBrands = brands.filter((b) => b.origin === 'international');
