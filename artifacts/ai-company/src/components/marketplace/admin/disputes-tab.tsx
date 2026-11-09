import { useState } from 'react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/marketplace/api';
import type { Dispute } from '@/lib/marketplace/types';
import { useAdminDisputes } from './hooks';

function DisputeRow({ d }: { d: Dispute }) {
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const resolve = useMutation({
    mutationFn: (outcome: 'resolved_buyer' | 'resolved_seller') => api.resolveDispute(d.id, outcome, note.trim()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mp'] }),
  });
  const open = d.status === 'open';
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={open ? 'destructive' : 'secondary'}>{d.status.replace('_', ' ')}</Badge>
          <Link href={`/marketplace/orders/${d.orderId}`} className="font-mono text-xs underline">Order {d.orderId}</Link>
          <span className="text-xs text-muted-foreground">opened by {d.openedBy}</span>
        </div>
        <p className="text-sm">{d.reason}</p>
        {open ? (
          <>
            <Textarea placeholder="Resolution note (required)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={!note.trim() || resolve.isPending} onClick={() => resolve.mutate('resolved_buyer')}>Resolve for buyer (refund)</Button>
              <Button size="sm" variant="outline" disabled={!note.trim() || resolve.isPending} onClick={() => resolve.mutate('resolved_seller')}>Resolve for seller (release)</Button>
            </div>
            {resolve.isError && <p className="text-sm text-destructive">{(resolve.error as Error).message}</p>}
          </>
        ) : (
          d.resolution && <p className="text-xs text-muted-foreground">Resolution: {d.resolution}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DisputesTab() {
  const { data, isLoading, error } = useAdminDisputes();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-destructive">Could not load disputes.</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No disputes.</p>;
  const sorted = [...data].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open'));
  return <div className="space-y-2">{sorted.map((d) => <DisputeRow key={d.id} d={d} />)}</div>;
}
