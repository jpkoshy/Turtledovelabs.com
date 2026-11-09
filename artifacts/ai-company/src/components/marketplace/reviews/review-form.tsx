import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StarInput } from './star-input';

const MAX = 1000;

export function ReviewForm({ orderId, onDone }: { orderId: string; onDone?: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const m = useMutation({
    mutationFn: () => api.createReview({ orderId, rating, comment: comment.trim() }),
    onSuccess: (r) => {
      toast({ title: 'Review submitted', description: 'Thanks for your feedback!' });
      qc.invalidateQueries({ queryKey: ['mp', 'reviews', r.gigId] });
      qc.invalidateQueries({ queryKey: ['mp', 'reviews'] });
      qc.invalidateQueries({ queryKey: ['mp', 'gig'] });
      qc.invalidateQueries({ queryKey: ['mp', 'gigs'] });
      qc.invalidateQueries({ queryKey: ['mp', 'order', orderId] });
      qc.invalidateQueries({ queryKey: ['mp', 'orders'] });
      onDone?.();
    },
    onError: (e: unknown) => toast({ title: 'Could not submit review', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' }),
  });

  const valid = rating >= 1 && comment.trim().length > 0;
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valid && !m.isPending) m.mutate(); }}>
      <div className="space-y-1.5">
        <span className="text-sm font-medium">Your rating</span>
        <StarInput value={rating} onChange={setRating} disabled={m.isPending} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`review-comment-${orderId}`} className="text-sm font-medium">Your review</label>
        <Textarea
          id={`review-comment-${orderId}`}
          value={comment}
          maxLength={MAX}
          rows={4}
          placeholder="How was the work, communication and delivery?"
          onChange={(e) => setComment(e.target.value)}
          disabled={m.isPending}
        />
        <p className="text-right text-xs text-muted-foreground">{comment.length}/{MAX}</p>
      </div>
      <Button type="submit" disabled={!valid || m.isPending}>{m.isPending ? 'Submitting…' : 'Submit review'}</Button>
    </form>
  );
}
