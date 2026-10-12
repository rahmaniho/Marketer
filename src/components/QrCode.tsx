import { useMemo } from 'react';

/**
 * QR نمایشی (Mock) — ماتریس ۲۵×۲۵ از هش رشته ورودی ساخته می‌شود.
 * توجه: این کد قابل اسکن واقعی نیست و فقط برای نمایش در دمو است.
 */
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const nextRand = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const QrCode = ({ value, size = 132, className = '' }: { value: string; size?: number; className?: string }) => {
  const cells = useMemo(() => {
    const n = 25;
    const rand = nextRand(hash(value));
    const grid: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => rand() > 0.52));

    const finder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 7; c++) {
          const edge = r === 0 || r === 6 || c === 0 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = edge || core;
        }
      for (let r = -1; r < 8; r++)
        for (let c = -1; c < 8; c++) {
          const rr = r0 + r;
          const cc = c0 + c;
          if (rr >= 0 && rr < n && cc >= 0 && cc < n && (r === -1 || r === 7 || c === -1 || c === 7)) grid[rr][cc] = false;
        }
    };
    finder(0, 0);
    finder(0, n - 7);
    finder(n - 7, 0);

    // الگوی هم‌ترازی
    const mid = Math.floor(n / 2);
    for (let r = -2; r <= 2; r++)
      for (let c = -2; c <= 2; c++) {
        const edge = Math.abs(r) === 2 || Math.abs(c) === 2;
        grid[mid + r][mid + c] = edge || (r === 0 && c === 0);
      }
    return grid;
  }, [value]);

  const n = cells.length;
  const scale = size / n;

  return (
    <svg width={size} height={size} className={className} role="img" aria-label="کد QR نمایشی محصول">
      <rect width={size} height={size} fill="#ffffff" rx="8" />
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * scale + 2} y={r * scale + 2} width={scale} height={scale} fill="#0f1923" /> : null,
        ),
      )}
    </svg>
  );
};
