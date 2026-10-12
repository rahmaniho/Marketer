import { useId } from 'react';
import type { Brand } from '@/lib/types';

/**
 * لوگوی SVG اختصاصی هر برند
 * لوگوهای واقعی شرکت‌ها دارای علائم تجاری هستند؛ در این دمو برای هر برند یک
 * نشان گرافیکی محلی و مقیاس‌پذیر (مونوگرام + گرادیان اختصاصی) ساخته می‌شود.
 */
export const BrandMark = ({
  brand,
  size = 44,
  className = '',
  rounded = true,
}: {
  brand: Pick<Brand, 'logo' | 'name'>;
  size?: number;
  className?: string;
  rounded?: boolean;
}) => {
  const uid = useId().replace(/[:]/g, '');
  const { from, to, fg, shape, initials } = brand.logo;
  const clip =
    shape === 'round' || shape === 'pill'
      ? `M0,50 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0`
      : shape === 'hex'
        ? 'M50,4 L92,27 L92,73 L50,96 L8,73 L8,27 Z'
        : shape === 'shield'
          ? 'M50,4 L94,20 L94,52 Q94,82 50,97 Q6,82 6,52 L6,20 Z'
          : 'M14,6 L86,6 Q94,6 94,14 L94,86 Q94,94 86,94 L14,94 Q6,94 6,86 L6,14 Q6,6 14,6 Z';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`لوگوی ${brand.name}`}
      style={{ flex: 'none' }}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={clip} />
        </clipPath>
      </defs>
      <g clipPath={rounded ? `url(#clip-${uid})` : undefined}>
        <rect width="100" height="100" rx={shape === 'square' ? 14 : 50} fill={`url(#bg-${uid})`} />
        <circle cx="78" cy="22" r="26" fill="#ffffff" opacity="0.14" />
        <circle cx="22" cy="82" r="30" fill="#000000" opacity="0.08" />
        <rect x="0" y="70" width="100" height="30" fill="#000000" opacity="0.10" />
      </g>
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fill={fg}
        fontSize={initials.length > 2 ? 30 : 38}
        fontWeight="800"
        fontFamily="Vazirmatn, Tahoma, sans-serif"
      >
        {initials}
      </text>
      <text x="50" y="80" textAnchor="middle" fill={fg} fontSize="12" opacity="0.85" fontFamily="Vazirmatn, Tahoma, sans-serif">
        {brand.logo.shape === 'shield' ? '★' : ''}
      </text>
    </svg>
  );
};

/** لوگو + نام برند */
export const BrandLockup = ({
  brand,
  size = 44,
  subtitle,
  className = '',
}: {
  brand: Pick<Brand, 'logo' | 'name' | 'nameEn' | 'country'>;
  size?: number;
  subtitle?: string;
  className?: string;
}) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <BrandMark brand={brand} size={size} />
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-ink-900 dark:text-ink-100">{brand.name}</p>
      <p className="truncate text-[11px] text-ink-500 dark:text-ink-400" dir="ltr">
        {brand.nameEn}
        {subtitle ? ` • ${subtitle}` : ''}
      </p>
    </div>
  </div>
);

/** لوگوی کارن سافت (توسعه‌دهنده) */
export const KarenSoftLogo = ({ size = 34, light = false }: { size?: number; light?: boolean }) => (
  <svg viewBox="0 0 120 40" width={size * 3} height={size} role="img" aria-label="کارن سافت">
    <defs>
      <linearGradient id="ks-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0f684c" />
        <stop offset="100%" stopColor="#45bd8b" />
      </linearGradient>
    </defs>
    <path d="M8 6 L24 6 L34 18 L24 30 L8 30 Z" fill="url(#ks-grad)" />
    <path d="M14 12 L26 12 L31 18 L26 24 L14 24 Z" fill="#ffffff" opacity="0.9" />
    <text x="44" y="19" fill={light ? '#ffffff' : '#0f1923'} fontSize="13" fontWeight="800" fontFamily="Vazirmatn, Tahoma, sans-serif">
      کارن سافت
    </text>
    <text x="44" y="32" fill={light ? '#b9d8c9' : '#6b7a94'} fontSize="8" fontFamily="Vazirmatn, Tahoma, sans-serif">
      KAREN SOFT
    </text>
  </svg>
);
