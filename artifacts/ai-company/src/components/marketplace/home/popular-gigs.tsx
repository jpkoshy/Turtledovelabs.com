import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { GigCard } from '../gig-card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from './section-header';

const track = 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-6 px-6';
const item = 'snap-start shrink-0 w-64 sm:w-72';

export function PopularGigs() {
  const { data, isLoading } = useQuery({
    queryKey: ['mp', 'home', 'popular-gigs'],
    queryFn: () => api.searchGigs({ sort: 'rating', pageSize: 12 }),
  });
  const gigs = data?.items ?? [];
  return (
    <section className="container mx-auto px-6 py-12">
      <SectionHeader title="Popular gigs" href="/marketplace/browse?sort=rating" />
      {isLoading ? (
        <div className={track}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className={item}><Skeleton className="aspect-video" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/2" /></div>)}</div>
      ) : gigs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gigs published yet. Check back soon.</p>
      ) : (
        <div className={track}>{gigs.map((g) => <div key={g.id} className={item}><GigCard gig={g} /></div>)}</div>
      )}
    </section>
  );
}
