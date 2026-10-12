import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Brand, Product } from '@/lib/types';
import { ProductVisual } from './ProductVisual';
import { BrandMark } from './BrandLogo';
import { Badge, Stars, useToast } from './ui';
import { Icon } from './Icon';
import { categoryById } from '@/data/categories';
import { faNum, percentFa, toman } from '@/lib/format';
import { useOffers, useStore } from '@/store/useStore';
import { computePrice } from '@/lib/pricing';

const BADGE_MAP: Record<string, { label: string; tone: 'success' | 'warning' | 'info' | 'brand' | 'vip'; icon: string }> = {
  bestseller: { label: 'پرفروش', tone: 'brand', icon: 'flame' },
  new: { label: 'جدید', tone: 'info', icon: 'sparkles' },
  imported: { label: 'وارداتی', tone: 'vip', icon: 'globe' },
  halal: { label: 'حلال', tone: 'success', icon: 'badge' },
  organic: { label: 'ارگانیک', tone: 'success', icon: 'leaf' },
  irc: { label: 'IRC', tone: 'info', icon: 'shield' },
  expiring: { label: 'نزدیک انقضا', tone: 'warning', icon: 'clock' },
  // ── نشان‌های ماژول شوینده و بهداشتی (کارن سافت)
  antibacterial: { label: '💧 ضدباکتری', tone: 'info', icon: 'shield' },
  sensitive: { label: 'مناسب پوست حساس', tone: 'success', icon: 'heart' },
  natural: { label: '🌿 طبیعی', tone: 'success', icon: 'leaf' },
  child: { label: '👶 کودک', tone: 'brand', icon: 'baby' },
  recyclable: { label: 'قابل بازیافت', tone: 'success', icon: 'refresh' },
  'cruelty-free': { label: 'Cruelty-Free', tone: 'success', icon: 'leaf' },
  'best-price': { label: '💰 بهترین قیمت', tone: 'warning', icon: 'wallet' },
};

export const ProductCard = ({ product, brand, compact = false }: { product: Product; brand?: Brand; compact?: boolean }) => {
  const [qty, setQty] = useState(Math.max(1, product.moq));
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const customer = useStore((s) => s.customer);
  const offers = useOffers();
  const { toast } = useToast();

  const price = computePrice({ product, qty, offers, customer, cashPayment: true });
  const inCart = cart.find((l) => l.productId === product.id);
  const cat = categoryById(product.categoryId);
  const isFav = favorites.includes(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <article className="card group flex h-full flex-col overflow-hidden transition hover:shadow-pop">
      <div className="relative">
        <Link to={`/product/${product.id}`} aria-label={product.name}>
          <ProductVisual product={product} brand={brand} size="md" className="w-full" />
        </Link>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <button
            onClick={() => toggleFavorite(product.id)}
            aria-label="افزودن به علاقه‌مندی"
            className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur transition ${
              isFav ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-ink-200 bg-white/85 text-ink-400 hover:text-rose-500'
            }`}
          >
            <Icon name="heart" className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              toggleCompare(product.id);
              toast(inCompare ? 'از مقایسه حذف شد' : 'به مقایسه اضافه شد', 'info');
            }}
            aria-label="افزودن به مقایسه"
            className={`flex h-8 w-8 items-center justify-center rounded-xl border backdrop-blur transition ${
              inCompare ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white/85 text-ink-400 hover:text-brand-600'
            }`}
          >
            <Icon name="sliders" className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.badges.slice(0, 2).map((b) => {
            const meta = BADGE_MAP[b];
            return meta ? (
              <Badge key={b} tone={meta.tone} icon={meta.icon}>
                {meta.label}
              </Badge>
            ) : null;
          })}
        </div>
        {product.stock <= 12 && (
          <div className="absolute bottom-2 right-2">
            <Badge tone={product.stock <= 0 ? 'danger' : 'warning'} icon="alert">
              {product.stock <= 0 ? 'ناموجود' : `موجودی ${faNum(product.stock)} ${product.unit}`}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] text-ink-400">
            {cat && <Icon name={cat.icon} className="h-3 w-3" />}
            {cat?.name}
          </span>
          <Stars value={product.rating} size={11} />
        </div>

        <Link to={`/product/${product.id}`} className="line-clamp-2 text-[13.5px] font-bold leading-6 text-ink-900 hover:text-brand-700 dark:text-ink-100 dark:hover:text-brand-300">
          {product.name}
        </Link>

        {brand && (
          <Link to={`/brand/${brand.id}`} className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-500 hover:text-brand-700 dark:text-ink-400">
            <BrandMark brand={brand} size={16} rounded={false} />
            {brand.name}
            <span className="text-ink-300">•</span>
            <span>{brand.country}</span>
          </Link>
        )}

        <p className="mt-1.5 text-[11px] text-ink-500 dark:text-ink-400">{product.packDesc}</p>

        {!compact && (
          <div className="mt-2 rounded-xl bg-ink-50 px-2.5 py-2 dark:bg-ink-800/60">
            <p className="flex items-center justify-between text-[11px] text-ink-500 dark:text-ink-400">
              <span>حداقل سفارش (MOQ)</span>
              <span className="num font-semibold text-ink-700 dark:text-ink-200">
                {faNum(product.moq)} {product.unit}
              </span>
            </p>
            <p className="mt-1 flex items-center justify-between text-[11px] text-ink-500 dark:text-ink-400">
              <span>تخفیف نقدی</span>
              <span className="font-semibold text-brand-700 dark:text-brand-300">
                {product.cashDiscountPercent > 0 ? percentFa(product.cashDiscountPercent) : '—'}
              </span>
            </p>
          </div>
        )}

        <div className="mt-2.5 flex items-end justify-between">
          <div>
            <p className="num text-[15px] font-extrabold text-ink-900 dark:text-ink-50">{faNum(price.unitPrice)}</p>
            <p className="text-[10px] text-ink-500 dark:text-ink-400">تومان / {product.unit}</p>
          </div>
          {price.discountPercent > 0 && (
            <div className="text-left">
              <p className="num text-[11px] text-ink-400 line-through">{faNum(product.basePrice)}</p>
              <Badge tone="success">{percentFa(price.discountPercent, true)}</Badge>
            </div>
          )}
        </div>

        {price.nextTier && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-accent-50 px-2 py-1.5 text-[10.5px] font-medium text-accent-800 dark:bg-accent-900/20 dark:text-accent-300">
            <Icon name="sparkles" className="mt-0.5 h-3 w-3 flex-none" />
            {faNum(price.nextTier.needQty)} {product.unit} دیگر اضافه کن → {percentFa(price.nextTier.discountPercent)} ارزان‌تر
          </p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-xl border border-ink-200 dark:border-ink-700">
              <button
                onClick={() => setQty((q) => Math.max(product.moq, q - 1))}
                className="px-2.5 py-2 text-ink-500 hover:text-brand-700"
                aria-label="کاهش تعداد"
              >
                <Icon name="minus" className="h-3.5 w-3.5" />
              </button>
              <span className="num min-w-8 text-center text-[13px] font-bold">{faNum(qty)}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-2.5 py-2 text-ink-500 hover:text-brand-700" aria-label="افزایش تعداد">
                <Icon name="plus" className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              className="btn-primary btn-sm flex-1"
              disabled={product.stock <= 0}
              onClick={() => {
                addToCart(product.id, qty);
                toast(`${product.name} (${faNum(qty)} ${product.unit}) به سبد اضافه شد`);
              }}
            >
              <Icon name="cart" className="h-4 w-4" />
              {inCart ? `در سبد: ${faNum(inCart.qty)}` : 'افزودن به سبد'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

/** کارت کوچک افقی (برای لیست‌های فشرده) */
export const ProductRow = ({ product, brand }: { product: Product; brand?: Brand }) => {
  const addToCart = useStore((s) => s.addToCart);
  const { toast } = useToast();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5 dark:border-ink-800 dark:bg-ink-900">
      <Link to={`/product/${product.id}`} className="w-16 flex-none">
        <ProductVisual product={product} brand={brand} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/product/${product.id}`} className="line-clamp-1 text-[12.5px] font-bold hover:text-brand-700">
          {product.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
          {brand?.name} • {product.packDesc}
        </p>
      </div>
      <div className="flex-none text-left">
        <p className="num text-[12.5px] font-extrabold">{toman(product.basePrice, false)}</p>
        <button
          className="btn-soft btn-sm mt-1"
          onClick={() => {
            addToCart(product.id, product.moq);
            toast('به سبد اضافه شد');
          }}
        >
          افزودن
        </button>
      </div>
    </div>
  );
};
