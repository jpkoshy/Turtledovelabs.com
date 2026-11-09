import { PLATFORM_FEE_RATE } from './types';
export const formatPrice = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;
export const feeFor = (priceCents: number) => Math.round(priceCents * PLATFORM_FEE_RATE);
export const startingPrice = (g: { packages: { priceCents: number }[] }) => Math.min(...g.packages.map((p) => p.priceCents));
