import type { GigQuery, SellerLevel } from '@/lib/marketplace/types';

export const PAGE_SIZE = 12;
export const SORTS: { value: NonNullable<GigQuery['sort']>; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
];
export const LEVELS: { value: SellerLevel; label: string }[] = [
  { value: 'new', label: 'New seller' },
  { value: 'level1', label: 'Level 1' },
  { value: 'level2', label: 'Level 2' },
  { value: 'top', label: 'Top rated' },
];
export const DELIVERY_OPTIONS = [1, 3, 7, 14, 30];
export const RATING_OPTIONS = [4.5, 4, 3];

const num = (v: string | null) => {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** URL prices are whole dollars; GigQuery uses cents. */
export function parseQuery(search: string): GigQuery {
  const p = new URLSearchParams(search);
  const sort = p.get('sort') as GigQuery['sort'] | null;
  const level = p.get('level') as SellerLevel | null;
  const min = num(p.get('min'));
  const max = num(p.get('max'));
  const page = num(p.get('page'));
  return {
    q: p.get('q')?.trim() || undefined,
    categoryId: p.get('category') || undefined,
    minPriceCents: min !== undefined ? Math.round(min * 100) : undefined,
    maxPriceCents: max !== undefined ? Math.round(max * 100) : undefined,
    maxDeliveryDays: num(p.get('delivery')),
    minRating: num(p.get('rating')),
    sellerLevel: level && LEVELS.some((l) => l.value === level) ? level : undefined,
    sort: sort && SORTS.some((s) => s.value === sort) ? sort : 'relevance',
    page: page && page >= 1 ? Math.floor(page) : 1,
  };
}

export function serializeQuery(q: GigQuery): string {
  const p = new URLSearchParams();
  if (q.q) p.set('q', q.q);
  if (q.categoryId) p.set('category', q.categoryId);
  if (q.minPriceCents !== undefined) p.set('min', String(q.minPriceCents / 100));
  if (q.maxPriceCents !== undefined) p.set('max', String(q.maxPriceCents / 100));
  if (q.maxDeliveryDays !== undefined) p.set('delivery', String(q.maxDeliveryDays));
  if (q.minRating !== undefined) p.set('rating', String(q.minRating));
  if (q.sellerLevel) p.set('level', q.sellerLevel);
  if (q.sort && q.sort !== 'relevance') p.set('sort', q.sort);
  if (q.page && q.page > 1) p.set('page', String(q.page));
  return p.toString();
}

export function activeFilterCount(q: GigQuery): number {
  return [q.categoryId, q.minPriceCents, q.maxPriceCents, q.maxDeliveryDays, q.minRating, q.sellerLevel].filter((v) => v !== undefined).length;
}
