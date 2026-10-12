import type { Category } from '@/lib/types';
import { dhCategories } from '@/modules/dh/data';
import { msCategories } from '@/modules/misc/data';

/**
 * درخت دسته‌بندی محصولات (دوسطحی)
 * icon = نام آیکون در نقشه آیکون‌های اپ
 * دسته‌های ماژول شوینده و بهداشتی از /data/detergent/ و /data/hygiene/ و
 * دسته‌های ماژول کالاهای مصرفی از /data/misc/ بارگذاری می‌شوند.
 */
export const categories: Category[] = [
  // ---------- ریشه‌ها ----------
  { id: 'dairy', parentId: null, name: 'لبنیات و بستنی', nameEn: 'Dairy & Ice Cream', icon: 'milk', color: '#3b82f6', description: 'شیر، ماست، پنیر، کره، دوغ و بستنی' },
  { id: 'beverage', parentId: null, name: 'نوشیدنی و آب معدنی', nameEn: 'Beverages', icon: 'cup', color: '#06b6d4', description: 'نوشابه، آب معدنی، آبمیوه، ماءالشعیر و نوشیدنی انرژی‌زا' },
  { id: 'snack', parentId: null, name: 'تنقلات، شکلات و بیسکویت', nameEn: 'Snacks & Confectionery', icon: 'cookie', color: '#f59e0b', description: 'بیسکویت، شکلات، کیک، چیپس، پفک، آبنبات' },
  { id: 'pantry', parentId: null, name: 'روغن، رب، کنسرو و سس', nameEn: 'Oils, Sauces & Canned', icon: 'bottle', color: '#ef4444', description: 'روغن خوراکی، رب، کنسرو، سس، ترشی و زیتون' },
  { id: 'pasta', parentId: null, name: 'ماکارونی، غلات و غذاهای آماده', nameEn: 'Pasta & Ready Meals', icon: 'wheat', color: '#eab308', description: 'ماکارونی، رشته، لازانیا، نودل و غذای آماده' },
  { id: 'protein', parentId: null, name: 'پروتئین و فرآورده‌های گوشتی', nameEn: 'Protein & Meat', icon: 'beef', color: '#dc2626', description: 'سوسیس، کالباس، همبرگر، مرغ، گوشت و ماهی' },
  { id: 'grocery', parentId: null, name: 'خشکبار، ادویه، چای و قند', nameEn: 'Dry Goods & Spices', icon: 'leaf', color: '#16a34a', description: 'چای، ادویه، زعفران، خشکبار، قند و شکر، عسل' },
  { id: 'frozen', parentId: null, name: 'فریزری و محصولات منجمد', nameEn: 'Frozen', icon: 'snow', color: '#0ea5e9', description: 'سبزی منجمد، غذای منجمد، میوه منجمد و بستنی' },
  { id: 'baby', parentId: null, name: 'غذای کودک و شیر خشک', nameEn: 'Baby Food', icon: 'baby', color: '#ec4899', description: 'سرلاک، غذای کودک، شیر خشک و پوره' },
  { id: 'hygiene', parentId: null, name: 'بهداشتی و شوینده', nameEn: 'Hygiene & Detergent', icon: 'spray', color: '#8b5cf6', description: 'شوینده، صابون، دستمال کاغذی و بهداشت فردی' },
  { id: 'office', parentId: null, name: 'ملزومات فروشگاه', nameEn: 'Store Supplies', icon: 'store', color: '#64748b', description: 'پاکت، نایلون، لیبل، بسته‌بندی و ملزومات صنفی' },

  // ---------- لبنیات ----------
  { id: 'milk', parentId: 'dairy', name: 'شیر', nameEn: 'Milk', icon: 'milk', color: '#3b82f6', description: 'شیر پرچرب، کم‌چرب، ESL و فرادما' },
  { id: 'yogurt', parentId: 'dairy', name: 'ماست، دوغ و کشک', nameEn: 'Yogurt & Doogh', icon: 'bowl', color: '#3b82f6', description: 'ماست، دوغ، کشک و کفیر' },
  { id: 'cheese', parentId: 'dairy', name: 'پنیر', nameEn: 'Cheese', icon: 'cheese', color: '#3b82f6', description: 'پنیر سفید، خامه‌ای، پیتزا و UFO' },
  { id: 'butter', parentId: 'dairy', name: 'کره و خامه', nameEn: 'Butter & Cream', icon: 'butter', color: '#3b82f6', description: 'کره حیوانی، کره گیاهی و خامه' },
  { id: 'icecream', parentId: 'dairy', name: 'بستنی و دسر', nameEn: 'Ice Cream', icon: 'icecream', color: '#3b82f6', description: 'بستنی، دسر، شیرینی‌های سرد' },

  // ---------- نوشیدنی ----------
  { id: 'soda', parentId: 'beverage', name: 'نوشابه گازدار', nameEn: 'Carbonated', icon: 'cup', color: '#06b6d4', description: 'نوشابه گازدار و طعم‌دار' },
  { id: 'water', parentId: 'beverage', name: 'آب معدنی', nameEn: 'Mineral Water', icon: 'droplet', color: '#06b6d4', description: 'آب معدنی، آب آشامیدنی و آب طعم‌دار' },
  { id: 'juice', parentId: 'beverage', name: 'آبمیوه و نکتار', nameEn: 'Juice', icon: 'juice', color: '#06b6d4', description: 'آبمیوه، نکتار، شربت و نوشیدنی میوه‌ای' },
  { id: 'malt', parentId: 'beverage', name: 'ماءالشعیر و دلستر', nameEn: 'Malt Drink', icon: 'beer', color: '#06b6d4', description: 'ماءالشعیر بدون الکل و دلستر' },
  { id: 'energy', parentId: 'beverage', name: 'نوشیدنی انرژی‌زا و ورزشی', nameEn: 'Energy & Sports', icon: 'zap', color: '#06b6d4', description: 'نوشیدنی انرژی‌زا، ایزوتونیک و ورزشی' },
  { id: 'hotdrink', parentId: 'beverage', name: 'قهوه، نسکافه و دمنوش', nameEn: 'Coffee & Tea Drinks', icon: 'coffee', color: '#06b6d4', description: 'قهوه فوری، نسکافه، کاپوچینو و دمنوش' },

  // ---------- تنقلات ----------
  { id: 'biscuit', parentId: 'snack', name: 'بیسکویت و ویفر', nameEn: 'Biscuit & Wafer', icon: 'cookie', color: '#f59e0b', description: 'بیسکویت، ویفر، کراکر و چوب شور' },
  { id: 'chocolate', parentId: 'snack', name: 'شکلات و آبنبات', nameEn: 'Chocolate & Candy', icon: 'candy', color: '#f59e0b', description: 'شکلات، تافی، آبنبات و آدامس' },
  { id: 'cake', parentId: 'snack', name: 'کیک، کلوچه و شیرینی', nameEn: 'Cake & Pastry', icon: 'cake', color: '#f59e0b', description: 'کیک روغنی، کیک لایه‌ای، کلوچه و شیرینی' },
  { id: 'chips', parentId: 'snack', name: 'چیپس، پفک و اسنک', nameEn: 'Chips & Snacks', icon: 'chips', color: '#f59e0b', description: 'چیپس، پفک، پاپ‌کورن و اسنک' },
  { id: 'nutsnack', parentId: 'snack', name: 'تخمه و آجیل', nameEn: 'Seeds & Nuts', icon: 'nut', color: '#f59e0b', description: 'تخمه، آجیل، خشکبار تنقلاتی' },

  // ---------- روغن و کنسرو ----------
  { id: 'oils', parentId: 'pantry', name: 'روغن خوراکی', nameEn: 'Edible Oil', icon: 'bottle', color: '#ef4444', description: 'روغن سرخ‌کردنی، مایع، جامد و مارگارین' },
  { id: 'sauce', parentId: 'pantry', name: 'سس و کچاپ', nameEn: 'Sauce & Ketchup', icon: 'dressing', color: '#ef4444', description: 'مایونز، کچاپ، خردل، سس سالاد' },
  { id: 'paste', parentId: 'pantry', name: 'رب گوجه‌فرنگی', nameEn: 'Tomato Paste', icon: 'tomato', color: '#ef4444', description: 'رب گوجه‌فرنگی و رب انواع' },
  { id: 'canned', parentId: 'pantry', name: 'کنسرو', nameEn: 'Canned Food', icon: 'can', color: '#ef4444', description: 'کنسرو تن ماهی، مرغ، حبوبات و سبزیجات' },
  { id: 'pickle', parentId: 'pantry', name: 'ترشی، خیارشور و زیتون', nameEn: 'Pickles & Olive', icon: 'jar', color: '#ef4444', description: 'ترشیجات، خیارشور، لیته و زیتون' },
  { id: 'vinegar', parentId: 'pantry', name: 'آبلیمو، سرکه و چاشنی', nameEn: 'Vinegar & Lemon', icon: 'lemon', color: '#ef4444', description: 'آبلیمو، آبغوره، سرکه و چاشنی' },

  // ---------- ماکارونی ----------
  { id: 'macaroni', parentId: 'pasta', name: 'ماکارونی، رشته و لازانیا', nameEn: 'Macaroni', icon: 'wheat', color: '#eab308', description: 'ماکارونی، اسپاگتی، رشته و لازانیا' },
  { id: 'readymeal', parentId: 'pasta', name: 'غذاهای آماده و نیمه‌آماده', nameEn: 'Ready Meals', icon: 'soup', color: '#eab308', description: 'ناگت، کتلت، فلافل، پیتزا و غذای آماده' },
  { id: 'rice', parentId: 'pasta', name: 'برنج، حبوبات و غلات', nameEn: 'Rice & Legumes', icon: 'rice', color: '#eab308', description: 'برنج ایرانی و وارداتی، حبوبات، بلغور' },
  { id: 'noodle', parentId: 'pasta', name: 'نودل و سوپ فوری', nameEn: 'Noodles & Soup', icon: 'noodle', color: '#eab308', description: 'نودل فوری، سوپ فوری و پاستا' },

  // ---------- پروتئین ----------
  { id: 'sausage', parentId: 'protein', name: 'سوسیس و کالباس', nameEn: 'Sausage', icon: 'sausage', color: '#dc2626', description: 'سوسیس، کالباس، ژامبون و هات‌داگ' },
  { id: 'burger', parentId: 'protein', name: 'همبرگر، ناگت و کباب', nameEn: 'Burger & Nugget', icon: 'burger', color: '#dc2626', description: 'همبرگر، ناگت، کباب لقمه و شنیسل' },
  { id: 'chicken', parentId: 'protein', name: 'مرغ و طیور', nameEn: 'Poultry', icon: 'chicken', color: '#dc2626', description: 'مرغ گرم و منجمد، قطعات و فرآورده' },
  { id: 'seafood', parentId: 'protein', name: 'ماهی، میگو و تن', nameEn: 'Seafood', icon: 'fish', color: '#dc2626', description: 'ماهی منجمد، میگو و فرآورده‌های دریایی' },
  { id: 'egg', parentId: 'protein', name: 'تخم مرغ', nameEn: 'Egg', icon: 'egg', color: '#dc2626', description: 'تخم مرغ بسته‌بندی و مایع' },

  // ---------- خشکبار ----------
  { id: 'tea', parentId: 'grocery', name: 'چای و دمنوش', nameEn: 'Tea', icon: 'tea', color: '#16a34a', description: 'چای سیاه، سبز، کیسه‌ای و دمنوش' },
  { id: 'spice', parentId: 'grocery', name: 'ادویه و چاشنی', nameEn: 'Spices', icon: 'spice', color: '#16a34a', description: 'ادویه‌جات، زردچوبه، فلفل، سماق و زعفران' },
  { id: 'driedfruit', parentId: 'grocery', name: 'خشکبار و میوه خشک', nameEn: 'Dried Fruit', icon: 'nut', color: '#16a34a', description: 'خرما، کشمش، آلو، انجیر، توت خشک و مغزها' },
  { id: 'sugar', parentId: 'grocery', name: 'قند، شکر و شیرین‌کننده', nameEn: 'Sugar', icon: 'cube', color: '#16a34a', description: 'قند حبه‌ای، شکر، شیره و عسل' },
  { id: 'salt', parentId: 'grocery', name: 'نمک و پودرهای غذایی', nameEn: 'Salt', icon: 'salt', color: '#16a34a', description: 'نمک خوراکی، بیکینگ‌پودر، ژلاتین' },

  // ---------- فریزری ----------
  { id: 'frozenveg', parentId: 'frozen', name: 'سبزی و صیفی منجمد', nameEn: 'Frozen Vegetables', icon: 'snow', color: '#0ea5e9', description: 'سبزی سرخ‌شده، نخود سبز، ذرت و مخلوط' },
  { id: 'frozenmeal', parentId: 'frozen', name: 'غذای منجمد', nameEn: 'Frozen Meals', icon: 'snow', color: '#0ea5e9', description: 'پیتزا، لازانیا، کتلت و فینگر' },
  { id: 'frozenfruit', parentId: 'frozen', name: 'میوه و دسر منجمد', nameEn: 'Frozen Fruit', icon: 'snow', color: '#0ea5e9', description: 'میوه منجمد، پوره و یخ‌دسر' },

  // ---------- کودک ----------
  { id: 'infant', parentId: 'baby', name: 'شیرخشک و غذای شیرخوار', nameEn: 'Infant Formula', icon: 'baby', color: '#ec4899', description: 'شیرخشک، آپتامیل، نان و گربر' },
  { id: 'babyfood', parentId: 'baby', name: 'غذای کودک', nameEn: 'Baby Food', icon: 'bowl', color: '#ec4899', description: 'سرلاک، پوره، اسنک کودک' },

  // ---------- بهداشتی ----------
  { id: 'detergent', parentId: 'hygiene', name: 'شوینده و پاک‌کننده', nameEn: 'Detergent', icon: 'spray', color: '#8b5cf6', description: 'مایع ظرفشویی، پودر ماشین، شیشه‌شور' },
  { id: 'soap', parentId: 'hygiene', name: 'صابون و بهداشت فردی', nameEn: 'Soap', icon: 'soap', color: '#8b5cf6', description: 'صابون، شامپو، مایع دستشویی' },
  { id: 'paper', parentId: 'hygiene', name: 'دستمال کاغذی و سلولزی', nameEn: 'Paper', icon: 'paper', color: '#8b5cf6', description: 'دستمال کاغذی، پوشک و سلولزی' },

  // ---------- ملزومات ----------
  { id: 'packaging', parentId: 'office', name: 'بسته‌بندی و پاکت', nameEn: 'Packaging', icon: 'package', color: '#64748b', description: 'پاکت، نایلون، ظرف یکبار مصرف' },
  { id: 'pos', parentId: 'office', name: 'کنترات و تجهیزات فروشگاه', nameEn: 'Store Equipment', icon: 'store', color: '#64748b', description: 'رول کاغذ، لیبل، بارکدخوان و ملزومات صنفی' },

  // ---------- ماژول شوینده و بهداشتی (کارن سافت) ----------
  ...dhCategories,

  // ---------- ماژول سایر کالاهای مصرفی سوپرمارکتی (کارن سافت) ----------
  ...msCategories,
];

export const categoryById = (id: string) => categories.find((c) => c.id === id);
export const rootCategories = categories.filter((c) => !c.parentId);
export const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
export const categoryPath = (id: string): Category[] => {
  const cat = categoryById(id);
  if (!cat) return [];
  if (!cat.parentId) return [cat];
  const parent = categoryById(cat.parentId);
  return parent ? [parent, cat] : [cat];
};
