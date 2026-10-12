import { brands } from './brands';
import { products } from './products';

/** یافتن شناسه برند با نام تقریبی */
export const brandIdOf = (name: string): string =>
  brands.find((b) => b.name === name || b.name.includes(name) || name.includes(b.name))?.id ?? 'b-001';

export const productIdOf = (fragment: string): string =>
  products.find((p) => p.name.includes(fragment) || p.nameEn.toLowerCase().includes(fragment.toLowerCase()))?.id ??
  products[0].id;
