import { useEffect, useState } from 'react';
import type { Category, GigQuery } from '@/lib/marketplace/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DELIVERY_OPTIONS, LEVELS, RATING_OPTIONS, activeFilterCount } from './query';

interface Props {
  query: GigQuery;
  categories: Category[];
  onChange: (patch: Partial<GigQuery>) => void;
  onClear: () => void;
  idPrefix?: string;
}

const ANY = '__any';
const Heading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">{children}</h3>
);

export function FilterPanel({ query, categories, onChange, onClear, idPrefix = 'f' }: Props) {
  const dollars = (c?: number) => (c === undefined ? '' : String(c / 100));
  const [min, setMin] = useState(dollars(query.minPriceCents));
  const [max, setMax] = useState(dollars(query.maxPriceCents));
  useEffect(() => { setMin(dollars(query.minPriceCents)); setMax(dollars(query.maxPriceCents)); }, [query.minPriceCents, query.maxPriceCents]);

  const applyPrice = () => {
    const toCents = (v: string) => (v.trim() === '' || Number(v) < 0 || !Number.isFinite(Number(v)) ? undefined : Math.round(Number(v) * 100));
    let lo = toCents(min), hi = toCents(max);
    if (lo !== undefined && hi !== undefined && lo > hi) [lo, hi] = [hi, lo];
    onChange({ minPriceCents: lo, maxPriceCents: hi });
  };
  const roots = categories.filter((c) => !c.parentId);
  const list = roots.length ? roots : categories;
  const id = (s: string) => `${idPrefix}-${s}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Filters{activeFilterCount(query) ? ` (${activeFilterCount(query)})` : ''}</span>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={!activeFilterCount(query)}>Clear all</Button>
      </div>

      <section>
        <Heading>Category</Heading>
        <RadioGroup value={query.categoryId ?? ANY} onValueChange={(v) => onChange({ categoryId: v === ANY ? undefined : v })}>
          <div className="flex items-center gap-2"><RadioGroupItem value={ANY} id={id('cat-any')} /><Label htmlFor={id('cat-any')}>All categories</Label></div>
          {list.map((c) => (
            <div key={c.id} className="flex items-center gap-2"><RadioGroupItem value={c.id} id={id(`cat-${c.id}`)} /><Label htmlFor={id(`cat-${c.id}`)}>{c.name}</Label></div>
          ))}
        </RadioGroup>
      </section>

      <section>
        <Heading>Budget (USD)</Heading>
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); applyPrice(); }}>
          <Input type="number" min={0} inputMode="numeric" placeholder="Min" aria-label="Minimum price" value={min} onChange={(e) => setMin(e.target.value)} onBlur={applyPrice} />
          <span className="text-muted-foreground">-</span>
          <Input type="number" min={0} inputMode="numeric" placeholder="Max" aria-label="Maximum price" value={max} onChange={(e) => setMax(e.target.value)} onBlur={applyPrice} />
          <button type="submit" className="sr-only">Apply</button>
        </form>
      </section>

      <section>
        <Heading>Delivery time</Heading>
        <RadioGroup value={String(query.maxDeliveryDays ?? ANY)} onValueChange={(v) => onChange({ maxDeliveryDays: v === ANY ? undefined : Number(v) })}>
          <div className="flex items-center gap-2"><RadioGroupItem value={ANY} id={id('del-any')} /><Label htmlFor={id('del-any')}>Any</Label></div>
          {DELIVERY_OPTIONS.map((d) => (
            <div key={d} className="flex items-center gap-2"><RadioGroupItem value={String(d)} id={id(`del-${d}`)} /><Label htmlFor={id(`del-${d}`)}>{d === 1 ? 'Up to 24 hours' : `Up to ${d} days`}</Label></div>
          ))}
        </RadioGroup>
      </section>

      <section>
        <Heading>Minimum rating</Heading>
        <RadioGroup value={String(query.minRating ?? ANY)} onValueChange={(v) => onChange({ minRating: v === ANY ? undefined : Number(v) })}>
          <div className="flex items-center gap-2"><RadioGroupItem value={ANY} id={id('rat-any')} /><Label htmlFor={id('rat-any')}>Any</Label></div>
          {RATING_OPTIONS.map((r) => (
            <div key={r} className="flex items-center gap-2"><RadioGroupItem value={String(r)} id={id(`rat-${r}`)} /><Label htmlFor={id(`rat-${r}`)}>{r}+ stars</Label></div>
          ))}
        </RadioGroup>
      </section>

      <section>
        <Heading>Seller level</Heading>
        <RadioGroup value={query.sellerLevel ?? ANY} onValueChange={(v) => onChange({ sellerLevel: v === ANY ? undefined : (v as GigQuery['sellerLevel']) })}>
          <div className="flex items-center gap-2"><RadioGroupItem value={ANY} id={id('lvl-any')} /><Label htmlFor={id('lvl-any')}>Any level</Label></div>
          {LEVELS.map((l) => (
            <div key={l.value} className="flex items-center gap-2"><RadioGroupItem value={l.value} id={id(`lvl-${l.value}`)} /><Label htmlFor={id(`lvl-${l.value}`)}>{l.label}</Label></div>
          ))}
        </RadioGroup>
      </section>
    </div>
  );
}
