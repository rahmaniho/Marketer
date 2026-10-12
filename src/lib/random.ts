/** تولید اعداد شبه‌تصادفی تکرارپذیر (برای داده‌های Mock ثابت) */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const rng = mulberry32(20260321);

export const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];
export const pickN = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  return out;
};
export const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const choice = <T>(arr: T[], p: number, yes: T, no: T): T => (rng() < p ? yes : no);

export const uid = (prefix: string, n?: number) =>
  `${prefix}-${String(n ?? Math.floor(rng() * 99999)).padStart(4, '0')}`;
