import type { Review, Gig } from '@/lib/marketplace/types';
import { RatingStars } from '../rating-stars';

export function SellerReviews({ reviews, gigs }: { reviews: Review[]; gigs: Gig[] }) {
  if (!reviews.length) return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  const title = (id: string) => gigs.find((g) => g.id === id)?.title;
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="space-y-2 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <RatingStars value={r.rating} />
            <time className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</time>
          </div>
          <p className="text-sm">{r.comment}</p>
          {title(r.gigId) && <p className="font-mono text-xs text-muted-foreground">on {title(r.gigId)}</p>}
          {r.sellerReply && <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">Seller reply: {r.sellerReply}</p>}
        </li>
      ))}
    </ul>
  );
}
