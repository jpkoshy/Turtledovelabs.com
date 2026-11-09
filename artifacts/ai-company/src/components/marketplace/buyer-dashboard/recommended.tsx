import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { GigCard } from '@/components/marketplace/gig-card';
import { Skeleton } from '@/components/ui/skeleton';

export function RecommendedGigs() {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'recommended'], queryFn: () => api.searchGigs({ sort: 'rating', pageSize: 8 }) });
  const favs = useQuery({ queryKey: ['mp', 'favorites'], queryFn: () => api.listFavorites() });
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  const favIds = new Set((favs.data ?? []).map((g) => g.id));
  const items = (data?.items ?? []).filter((g) => !favIds.has(g.id)).slice(0, 4);
  if (!items.length) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((g) => <GigCard key={g.id} gig={g} />)}
    </div>
  );
}
