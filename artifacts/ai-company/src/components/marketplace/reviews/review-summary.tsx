import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import { Skeleton } from '@/components/ui/skeleton';

export function ReviewSummary({ gigId }: { gigId: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'reviews', gigId], queryFn: () => api.listReviewsForGig(gigId) });
  if (isLoading) return <Skeleton className="h-28 w-full" />;
  const reviews = data ?? [];
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  if (!count) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex flex-col items-center sm:items-start">
        <div className="flex items-center gap-2">
          <Star className="h-7 w-7 fill-primary text-primary" />
          <span className="text-4xl font-bold">{avg.toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">{count} review{count === 1 ? '' : 's'}</span>
      </div>
      <ul className="flex-1 space-y-1.5" aria-label="Rating distribution">
        {[5, 4, 3, 2, 1].map((n) => {
          const c = reviews.filter((r) => r.rating === n).length;
          const pct = (c / count) * 100;
          return (
            <li key={n} className="flex items-center gap-2 text-sm">
              <span className="w-12 shrink-0 text-muted-foreground">{n} star{n > 1 ? 's' : ''}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted" role="img" aria-label={`${c} of ${count} reviews gave ${n} stars`}>
                <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{c}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
