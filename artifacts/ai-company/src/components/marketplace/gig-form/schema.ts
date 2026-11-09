import { z } from 'zod';
import type { Gig, Tier } from '@/lib/marketplace/types';

export const TIERS: Tier[] = ['basic', 'standard', 'premium'];

const packageSchema = z.object({
  tier: z.enum(['basic', 'standard', 'premium']),
  name: z.string().trim().min(2, 'Name is required').max(40),
  description: z.string().trim().min(10, 'Describe this package (10+ chars)').max(300),
  price: z.coerce.number({ invalid_type_error: 'Enter a price' }).min(5, 'Min $5').max(10000, 'Max $10,000'),
  deliveryDays: z.coerce.number({ invalid_type_error: 'Enter days' }).int().min(1, 'Min 1 day').max(90),
  revisions: z.coerce.number({ invalid_type_error: 'Enter revisions' }).int().min(0).max(20),
  featuresText: z.string().max(1000),
});

export const gigFormSchema = z.object({
  title: z.string().trim().min(15, 'Title must be at least 15 characters').max(80, 'Max 80 characters'),
  categoryId: z.string().min(1, 'Choose a category'),
  tagsText: z.string().refine((v) => parseTags(v).length >= 1 && parseTags(v).length <= 5, 'Add 1 to 5 comma-separated tags'),
  packages: z.array(packageSchema).length(3),
  description: z.string().trim().min(50, 'Description must be at least 50 characters').max(5000),
  faqs: z.array(z.object({ question: z.string().trim().min(3, 'Question required'), answer: z.string().trim().min(3, 'Answer required') })).max(10),
  images: z.array(z.object({ url: z.string().trim().url('Enter a valid URL (https://...)') })).max(6),
});

export type GigFormValues = z.infer<typeof gigFormSchema>;
export type GigFormInput = z.input<typeof gigFormSchema>;

export const parseTags = (v: string) =>
  Array.from(new Set(v.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)));

export const STEPS = [
  { key: 'overview', label: 'Overview', fields: ['title', 'categoryId', 'tagsText'] },
  { key: 'pricing', label: 'Pricing', fields: ['packages'] },
  { key: 'description', label: 'Description & FAQ', fields: ['description', 'faqs'] },
  { key: 'gallery', label: 'Gallery', fields: ['images'] },
  { key: 'publish', label: 'Publish', fields: [] },
] as const;

export const defaultValues = (): GigFormInput => ({
  title: '',
  categoryId: '',
  tagsText: '',
  packages: [
    { tier: 'basic', name: 'Basic', description: '', price: 50, deliveryDays: 3, revisions: 1, featuresText: '' },
    { tier: 'standard', name: 'Standard', description: '', price: 120, deliveryDays: 5, revisions: 3, featuresText: '' },
    { tier: 'premium', name: 'Premium', description: '', price: 300, deliveryDays: 7, revisions: 5, featuresText: '' },
  ],
  description: '',
  faqs: [],
  images: [],
});

export function gigToForm(g: Gig): GigFormInput {
  const base = defaultValues();
  return {
    title: g.title,
    categoryId: g.categoryId,
    tagsText: g.tags.join(', '),
    packages: TIERS.map((tier, i) => {
      const p = g.packages.find((x) => x.tier === tier);
      return p
        ? { tier, name: p.name, description: p.description, price: p.priceCents / 100, deliveryDays: p.deliveryDays, revisions: p.revisions, featuresText: p.features.join('\n') }
        : base.packages[i];
    }),
    description: g.description,
    faqs: g.faqs.map((f) => ({ ...f })),
    images: g.images.map((url) => ({ url })),
  };
}

export function formToGigInput(v: GigFormValues, status: 'draft' | 'active') {
  return {
    title: v.title,
    categoryId: v.categoryId,
    tags: parseTags(v.tagsText),
    description: v.description,
    images: v.images.map((i) => i.url),
    status,
    faqs: v.faqs,
    packages: v.packages.map((p) => ({
      tier: p.tier,
      name: p.name,
      description: p.description,
      priceCents: Math.round(p.price * 100),
      deliveryDays: p.deliveryDays,
      revisions: p.revisions,
      features: p.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
    })),
  };
}
