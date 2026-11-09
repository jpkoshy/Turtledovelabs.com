import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/marketplace/api';
import type { Gig, Review } from '@/lib/marketplace/types';

function ReviewItem({ r, gigTitle }: { r: Review; gigTitle: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const reply = useMutation({
    mutationFn: () => api.replyToReview(r.id, text.trim()),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['mp'] }); },
  });
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{gigTitle}</span>
        <span className="font-mono text-xs" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
      </div>
      <p className="mt-1">{r.comment}</p>
      {r.sellerReply ? (
        <p className="mt-2 border-l-2 pl-3 text-muted-foreground"><span className="font-medium text-foreground">Your reply: </span>{r.sellerReply}</p>
      ) : (
        <div className="mt-2 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply publicly to this review" rows={2} />
          <Button size="sm" disabled={!text.trim() || reply.isPending} onClick={() => reply.mutate()}>{reply.isPending ? 'Posting...' : 'Reply'}</Button>
        </div>
      )}
    </div>
  );
}

export function RecentReviews({ reviews, gigs }: { reviews: Review[]; gigs: Gig[] }) {
  const sorted = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Recent reviews</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No reviews yet.</p>}
        {sorted.map((r) => <ReviewItem key={r.id} r={r} gigTitle={gigs.find((g) => g.id === r.gigId)?.title ?? 'Gig'} />)}
      </CardContent>
    </Card>
  );
}
