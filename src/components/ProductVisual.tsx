import { useId } from 'react';
import type { Brand, Product } from '@/lib/types';
import { categoryById } from '@/data/categories';
import { Icon } from './Icon';

/**
 * تصویرسازی برداری محصول (به‌جای تصویر واقعی)
 * هر محصول یک بسته‌بندی نمادین با رنگ دسته‌بندی، آیکون و نام برند می‌گیرد.
 * دلیل: دمو استاتیک است و تصاویر واقعی محصولات دارای حق نشر هستند.
 */
export const ProductVisual = ({
  product,
  brand,
  className = '',
  variant = 0,
  size = 'md',
}: {
  product: Product;
  brand?: Brand;
  className?: string;
  variant?: number;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const uid = useId().replace(/:/g, '');
  const cat = categoryById(product.categoryId);
  const color = cat?.color ?? '#0f684c';
  const soft = `${color}1f`;

  const heights = { sm: 96, md: 190, lg: 300 }[size];

  return (
    <svg viewBox="0 0 160 120" width="100%" height={heights} className={className} role="img" aria-label={product.name}>
      <defs>
        <linearGradient id={`pb-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={soft} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`pk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.72" />
        </linearGradient>
      </defs>

      <rect width="160" height="120" fill={`url(#pb-${uid})`} rx="14" />

      {/* بسته‌بندی نمادین */}
      {variant % 3 === 0 && (
        <g>
          <path d="M52 30 H108 V104 H52 Z" fill={`url(#pk-${uid})`} rx="6" />
          <path d="M52 30 L58 22 H114 L108 30 Z" fill="#00000022" />
          <rect x="60" y="44" width="40" height="7" rx="3.5" fill="#ffffff" opacity="0.85" />
          <rect x="60" y="56" width="26" height="5" rx="2.5" fill="#ffffff" opacity="0.55" />
        </g>
      )}
      {variant % 3 === 1 && (
        <g>
          <rect x="46" y="34" width="68" height="70" rx="10" fill={`url(#pk-${uid})`} />
          <rect x="46" y="34" width="68" height="16" rx="8" fill="#00000022" />
          <circle cx="80" cy="74" r="15" fill="#ffffff" opacity="0.9" />
          <rect x="56" y="96" width="48" height="6" rx="3" fill="#ffffff" opacity="0.6" />
        </g>
      )}
      {variant % 3 === 2 && (
        <g>
          <path d="M64 26 h32 v12 l10 16 v48 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6 v-48 l10 -16 z" fill={`url(#pk-${uid})`} />
          <rect x="62" y="60" width="36" height="34" rx="6" fill="#ffffff" opacity="0.88" />
        </g>
      )}

      {/* آیکون دسته */}
      <g transform="translate(80,74)">
        <foreignObject x="-16" y="-16" width="32" height="32">
          <div className="flex h-8 w-8 items-center justify-center" style={{ color }}>
            <Icon name={cat?.icon ?? 'package'} className="h-6 w-6" />
          </div>
        </foreignObject>
      </g>

      <text x="80" y="114" textAnchor="middle" fontSize="10" fill={color} fontWeight="700" fontFamily="Vazirmatn, Tahoma, sans-serif">
        {brand?.name?.slice(0, 18) ?? ''}
      </text>
    </svg>
  );
};

/** تصویرسازی برند (بنر کارت برند) */
export const BrandBanner = ({ brand, className = '' }: { brand: Brand; className?: string }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 320 90" className={className} role="img" aria-label={`بنر ${brand.name}`}>
      <defs>
        <linearGradient id={`bb-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={brand.logo.from} />
          <stop offset="100%" stopColor={brand.logo.to} />
        </linearGradient>
      </defs>
      <rect width="320" height="90" rx="16" fill={`url(#bb-${uid})`} />
      <circle cx="286" cy="16" r="46" fill="#ffffff" opacity="0.12" />
      <circle cx="34" cy="86" r="38" fill="#000000" opacity="0.10" />
      <text x="300" y="40" textAnchor="end" fill={brand.logo.fg} fontSize="20" fontWeight="800" fontFamily="Vazirmatn, Tahoma, sans-serif">
        {brand.name.slice(0, 22)}
      </text>
      <text x="300" y="66" textAnchor="end" fill={brand.logo.fg} fontSize="12" opacity="0.85" fontFamily="Vazirmatn, Tahoma, sans-serif">
        {brand.nameEn.slice(0, 26)}
      </text>
    </svg>
  );
};
