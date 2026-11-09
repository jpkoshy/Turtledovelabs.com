import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { SlidersHorizontal, SearchX, X } from 'lucide-react';
import MarketplaceLayout from '@/components/marketplace/layout';
import { GigCard } from '@/components/marketplace/gig-card';
import { FilterPanel, PAGE_SIZE, SORTS, activeFilterCount, parseQuery, serializeQuery } from '@/components/marketplace/filters';
import { api } from '@/lib/marketplace/api';
import type { GigQuery } from '@/lib/marketplace/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Browse() {
  const search = useSearch();
  const [path, navigate] = useLocation();
  const query = parseQuery(search);
  const [text, setText] = useState(query.q ?? '');
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setText(query.q ?? ''), [query.q]);

  const update = (patch: Partial<GigQuery>) => {
    const qs = serializeQuery({ ...query, page: 1, ...patch });
    navigate(qs ? `${path}?${qs}` : path, { replace: true });
  };
  const clearFilters = () => update({ categoryId: undefined, minPriceCents: undefined, maxPriceCents: undefined, maxDeliveryDays: undefined, minRating: undefined, sellerLevel: undefined });

  const categories = useQuery({ queryKey: ['mp', 'categories'], queryFn: () => api.listCategories() });
  const results = useQuery({
    queryKey: ['mp', 'search', serializeQuery(query)],
    queryFn: () => api.searchGigs({ ...query, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const cats = categories.data ?? [];
  const catName = cats.find((c) => c.id === query.categoryId)?.name;
  const total = results.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = query.page ?? 1;
  const goPage = (p: number) => {
    update({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const nFilters = activeFilterCount(query);

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold">{query.q ? `Results for "${query.q}"` : catName ?? 'Browse services'}</h1>

        <form className="mt-4 flex gap-2 max-w-xl" role="search" onSubmit={(e) => { e.preventDefault(); update({ q: text.trim() || undefined }); }}>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search services" aria-label="Search services" />
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {results.isLoading ? 'Loading...' : `${total} ${total === 1 ? 'service' : 'services'} available`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />Filters{nFilters ? ` (${nFilters})` : ''}
            </Button>
            <Select value={query.sort ?? 'relevance'} onValueChange={(v) => update({ sort: v as GigQuery['sort'] })}>
              <SelectTrigger className="w-48" aria-label="Sort by"><SelectValue /></SelectTrigger>
              <SelectContent>{SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {nFilters > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {catName && <Chip label={catName} onRemove={() => update({ categoryId: undefined })} />}
            {query.minPriceCents !== undefined && <Chip label={`Min $${query.minPriceCents / 100}`} onRemove={() => update({ minPriceCents: undefined })} />}
            {query.maxPriceCents !== undefined && <Chip label={`Max $${query.maxPriceCents / 100}`} onRemove={() => update({ maxPriceCents: undefined })} />}
            {query.maxDeliveryDays !== undefined && <Chip label={`${query.maxDeliveryDays}d delivery`} onRemove={() => update({ maxDeliveryDays: undefined })} />}
            {query.minRating !== undefined && <Chip label={`${query.minRating}+ stars`} onRemove={() => update({ minRating: undefined })} />}
            {query.sellerLevel && <Chip label={`Level: ${query.sellerLevel}`} onRemove={() => update({ sellerLevel: undefined })} />}
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[16rem_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">
            <FilterPanel query={query} categories={cats} onChange={update} onClear={clearFilters} idPrefix="d" />
          </aside>

          <div>
            {results.isLoading ? (
              <Grid>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-lg" />)}</Grid>
            ) : results.isError ? (
              <div className="rounded-lg border border-border p-10 text-center">
                <p className="font-medium">Something went wrong loading services.</p>
                <Button className="mt-4" variant="outline" onClick={() => results.refetch()}>Try again</Button>
              </div>
            ) : total === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <SearchX className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No services match your search</p>
                <p className="text-sm text-muted-foreground">Try different keywords or remove some filters.</p>
                <Button className="mt-4" variant="outline" onClick={() => navigate(path)}>Reset search</Button>
              </div>
            ) : (
              <>
                <div className={results.isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  <Grid>{results.data!.items.map((g) => <GigCard key={g.id} gig={g} />)}</Grid>
                </div>
                {pages > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>Previous</Button>
                    <span className="font-mono text-xs text-muted-foreground">Page {page} of {pages}</span>
                    <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => goPage(page + 1)}>Next</Button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
          <div className="px-4">
            <FilterPanel query={query} categories={cats} onChange={update} onClear={clearFilters} idPrefix="m" />
          </div>
          <SheetFooter><SheetClose asChild><Button>Show {total} results</Button></SheetClose></SheetFooter>
        </SheetContent>
      </Sheet>
    </MarketplaceLayout>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
);

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-primary" aria-label={`Remove filter ${label}`}>
      {label}<X className="h-3 w-3" />
    </button>
  );
}
