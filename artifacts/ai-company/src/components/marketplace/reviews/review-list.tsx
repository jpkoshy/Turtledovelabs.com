import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import type { Review } from '@/lib/marketplace/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE = 5;
type Sort = 'newest' | 'highest';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      ))}
    </span>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const { data: buyer } = useQuery({ queryKey: ['mp', 'user', review.buyerId], queryFn: () => api.getUser(review.buyerId) });
  const { data: seller } = useQuery({
    queryKey: ['mp', 'gig-seller', review.gigId],
    queryFn: async () => { const g = await api.getGig(review.gigId); return g ? api.getUser(g.sellerId) : null; },
    enabled: !!review.sellerReply,
  });
  const name = buyer?.displayName ?? 'Buyer';
  return (
    <li className="space-y-2 border-b border-border py-5 last:border-0">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          {buyer?.avatarUrl && <AvatarImage src={buyer.avatarUrl} alt="" />}
          <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Stars value={review.rating} />
            <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
          </div>
        </div>
      </div>
      <p className="whitespace-pre-line break-words text-sm">{review.comment}</p>
      {review.sellerReply && (
        <div className="ml-4 rounded-md border-l-2 border-primary bg-muted/50 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold">Seller response{seller ? ` · ${seller.displayName}` : ''}</p>
          <p className="whitespace-pre-line break-words text-muted-foreground">{review.sellerReply}</p>
        </div>
      )}
    </li>
  );
}

export function ReviewList({ gigId }: { gigId: string }) {
  const [sort, setSort] = useState<Sort>('newest');
  const [shown, setShown] = useState(PAGE);
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'reviews', gigId], queryFn: () => api.listReviewsForGig(gigId) });

  if (isLoading) return <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>;
  const reviews = [...(data ?? [])].sort((a, b) =>
    sort === 'highest' ? b.rating - a.rating || +new Date(b.createdAt) - +new Date(a.createdAt) : +new Date(b.createdAt) - +new Date(a.createdAt));
  if (!reviews.length) return <p className="text-sm text-muted-foreground">No reviews yet. Be the first after your order completes.</p>;

  return (
    <div>
      <div className="flex items-center justify-end gap-2" role="group" aria-label="Sort reviews">
        {(['newest', 'highest'] as Sort[]).map((s) => (
          <Button key={s} size="sm" variant={sort === s ? 'default' : 'outline'} aria-pressed={sort === s} onClick={() => { setSort(s); setShown(PAGE); }}>
            {s === 'newest' ? 'Newest' : 'Highest rated'}
          </Button>
        ))}
      </div>
      <ul>{reviews.slice(0, shown).map((r) => <ReviewItem key={r.id} review={r} />)}</ul>
      {shown < reviews.length && (
        <div className="pt-2 text-center">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>Load more ({reviews.length - shown} more)</Button>
        </div>
      )}
    </div>
  );
}
