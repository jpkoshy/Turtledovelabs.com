import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/marketplace/api';
import type { Order } from '@/lib/marketplace/types';

/** Placeholder review form (swap for ReviewForm from @/components/marketplace/reviews once B14 lands). */
export function ReviewSlot({ order }: { order: Order }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { data: reviews } = useQuery({ queryKey: ['mp', 'reviews', order.gigId], queryFn: () => api.listReviewsForGig(order.gigId) });
  const existing = reviews?.find((r) => r.orderId === order.id);
  const create = useMutation({
    mutationFn: () => api.createReview({ orderId: order.id, rating, comment: comment.trim() }),
    onSuccess: () => { toast({ title: 'Review submitted' }); qc.invalidateQueries({ queryKey: ['mp', 'reviews', order.gigId] }); },
    onError: (e) => toast({ title: 'Could not submit review', description: e instanceof Error ? e.message : undefined, variant: 'destructive' }),
  });

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
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} stars`} onClick={() => setRating(n)}>
            <Star className={`h-6 w-6 ${n <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your experience?" rows={3} />
      <Button size="sm" disabled={!comment.trim() || create.isPending} onClick={() => create.mutate()}>Submit review</Button>
    </Card>
  );
}
