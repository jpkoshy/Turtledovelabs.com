import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/marketplace/api';
import type { Order } from '@/lib/marketplace/types';
import { ReviewForm } from '@/components/marketplace/reviews';

export function ReviewSlot({ order }: { order: Order }) {
  const { data: reviews } = useQuery({ queryKey: ['mp', 'reviews', order.gigId], queryFn: () => api.listReviewsForGig(order.gigId) });
  const existing = reviews?.find((r) => r.orderId === order.id);
  if (existing) {
    return (
      <Card className="p-4 space-y-1">
        <h2 className="text-sm font-mono uppercase text-muted-foreground">Your review</h2>
        <p className="text-yellow-500">{'★'.repeat(existing.rating)}<span className="text-muted-foreground">{'★'.repeat(5 - existing.rating)}</span></p>
        <p className="text-sm">{existing.comment}</p>
      </Card>
    );
  }
  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-sm font-mono uppercase text-muted-foreground">Leave a review</h2>
      <ReviewForm orderId={order.id} />
    </Card>
  );
}
