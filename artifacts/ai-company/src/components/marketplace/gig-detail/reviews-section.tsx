import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { RatingStars } from '@/components/marketplace/rating-stars';

// Simple placeholder; swap for ReviewSummary/ReviewList from '@/components/marketplace/reviews' once B14 lands.
export function ReviewsSection({ gigId, ratingAvg, ratingCount }: { gigId: string; ratingAvg: number; ratingCount: number }) {
  const { data: reviews = [], isLoading } = useQuery({ queryKey: ['mp', 'reviews', gigId], queryFn: () => api.listReviewsForGig(gigId) });
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <RatingStars value={ratingAvg} count={ratingCount} />
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading reviews…</p> : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-4 space-y-2">
              <RatingStars value={r.rating} />
              <p className="text-sm">{r.comment}</p>
              {r.sellerReply && <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">Seller: {r.sellerReply}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
