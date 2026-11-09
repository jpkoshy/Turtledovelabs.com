import { Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import { GigCard } from '@/components/marketplace/gig-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function Favorites() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'favorites'], queryFn: () => api.listFavorites() });
  const remove = useMutation({
    mutationFn: (id: string) => api.toggleFavorite(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mp', 'favorites'] }); },
  });
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No favorites yet. <Link href="/marketplace/browse" className="underline">Browse gigs</Link></p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((g) => (
        <div key={g.id} className="relative">
          <GigCard gig={g} />
          <Button size="icon" variant="secondary" aria-label="Remove from favorites" className="absolute right-2 top-2 h-8 w-8" disabled={remove.isPending} onClick={() => remove.mutate(g.id)}>
            <Heart className="h-4 w-4 fill-current text-primary" />
          </Button>
        </div>
      ))}
    </div>
  );
}
