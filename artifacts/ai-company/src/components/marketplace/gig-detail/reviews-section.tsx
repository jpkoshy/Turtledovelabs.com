import { ReviewList, ReviewSummary } from '@/components/marketplace/reviews';

export function ReviewsSection({ gigId }: { gigId: string; ratingAvg?: number; ratingCount?: number }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Reviews</h2>
      <ReviewSummary gigId={gigId} />
      <ReviewList gigId={gigId} />
    </section>
  );
}
