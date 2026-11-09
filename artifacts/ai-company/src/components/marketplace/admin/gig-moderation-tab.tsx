import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/marketplace/api';
import { formatPrice, startingPrice } from '@/lib/marketplace/format';
import type { Gig } from '@/lib/marketplace/types';
import { useAdminGigs } from './hooks';

const order: Record<string, number> = { draft: 0, paused: 1, active: 2, rejected: 3 };

export function GigModerationTab() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useAdminGigs();
  const mod = useMutation({
    mutationFn: (v: { id: string; status: 'active' | 'rejected' }) => api.moderateGig(v.id, v.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mp'] }),
  });
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-destructive">Could not load gigs.</p>;
  const gigs = [...(data ?? [])].sort((a: Gig, b: Gig) => order[a.status] - order[b.status]);
  if (!gigs.length) return <p className="text-sm text-muted-foreground">No gigs to moderate.</p>;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Pending (draft/paused) gigs are listed first.</p>
      {gigs.map((g) => (
        <Card key={g.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link href={`/marketplace/gig/${g.slug}`} className="block truncate font-medium hover:underline">{g.title}</Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={g.status === 'active' ? 'default' : g.status === 'rejected' ? 'destructive' : 'secondary'}>{g.status}</Badge>
                <span>from {formatPrice(startingPrice(g))}</span>
                <span>seller {g.sellerId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={mod.isPending || g.status === 'active'} onClick={() => mod.mutate({ id: g.id, status: 'active' })}>Approve</Button>
              <Button size="sm" variant="destructive" disabled={mod.isPending || g.status === 'rejected'} onClick={() => mod.mutate({ id: g.id, status: 'rejected' })}>Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {mod.isError && <p className="text-sm text-destructive">Action failed: {(mod.error as Error).message}</p>}
    </div>
  );
}
