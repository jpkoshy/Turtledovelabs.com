import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/marketplace/api';
import type { Order } from '@/lib/marketplace/types';

type Panel = null | 'deliver' | 'revision' | 'dispute';

export function OrderActions({ order, role }: { order: Order; role: 'buyer' | 'seller' }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [panel, setPanel] = useState<Panel>(null);
  const [text, setText] = useState('');

  const done = (msg: string) => {
    toast({ title: msg });
    setPanel(null);
    setText('');
    qc.invalidateQueries({ queryKey: ['mp', 'order', order.id] });
    qc.invalidateQueries({ queryKey: ['mp', 'orders'] });
  };
  const fail = (e: unknown) => toast({ title: 'Action failed', description: e instanceof Error ? e.message : 'Please try again', variant: 'destructive' });

  const deliver = useMutation({ mutationFn: () => api.deliverOrder(order.id, text.trim()), onSuccess: () => done('Delivery submitted'), onError: fail });
  const revise = useMutation({ mutationFn: () => api.requestRevision(order.id, text.trim()), onSuccess: () => done('Revision requested'), onError: fail });
  const complete = useMutation({ mutationFn: () => api.completeOrder(order.id), onSuccess: () => done('Order completed'), onError: fail });
  const cancel = useMutation({ mutationFn: () => api.cancelOrder(order.id), onSuccess: () => done('Order cancelled'), onError: fail });
  const dispute = useMutation({ mutationFn: () => api.openDispute(order.id, text.trim()), onSuccess: () => done('Dispute opened'), onError: fail });
  const message = useMutation({
    mutationFn: async () => api.startConversation(role === 'buyer' ? order.sellerId : order.buyerId, order.gigId),
    onSuccess: (c) => navigate(`/marketplace/inbox?c=${encodeURIComponent(c.id)}`),
    onError: fail,
  });

  const s = order.status;
  const busy = deliver.isPending || revise.isPending || complete.isPending || cancel.isPending || dispute.isPending;
  const canDeliver = role === 'seller' && (s === 'active' || s === 'revision');
  const canBuyerAct = role === 'buyer' && s === 'delivered';
  const canCancel = (s === 'pending' || s === 'active') && (role === 'buyer' || role === 'seller');
  const canDispute = role === 'buyer' && ['active', 'delivered', 'revision'].includes(s);

  const submit = panel === 'deliver' ? deliver : panel === 'revision' ? revise : dispute;
  const labels = { deliver: 'Submit delivery', revision: 'Request revision', dispute: 'Open dispute' } as const;
  const placeholders = { deliver: 'Describe what you are delivering…', revision: 'What should be changed?', dispute: 'Explain the problem…' } as const;

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-sm font-mono uppercase text-muted-foreground">Actions</h2>
      <div className="flex flex-wrap gap-2">
        {canDeliver && <Button size="sm" onClick={() => setPanel('deliver')} disabled={busy}>Deliver work</Button>}
        {canBuyerAct && <Button size="sm" onClick={() => complete.mutate()} disabled={busy}>Accept &amp; complete</Button>}
        {canBuyerAct && <Button size="sm" variant="outline" onClick={() => setPanel('revision')} disabled={busy}>Request revision</Button>}
        {canDispute && <Button size="sm" variant="outline" onClick={() => setPanel('dispute')} disabled={busy}>Open dispute</Button>}
        {canCancel && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (window.confirm('Cancel this order? It will be refunded to the buyer.')) cancel.mutate(); }} disabled={busy}>Cancel order</Button>}
        <Button size="sm" variant="secondary" onClick={() => message.mutate()} disabled={message.isPending}>Message {role === 'buyer' ? 'seller' : 'buyer'}</Button>
      </div>
      {panel && (
        <div className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholders[panel]} rows={4} />
          <div className="flex gap-2">
            <Button size="sm" disabled={!text.trim() || submit.isPending} onClick={() => submit.mutate()}>{labels[panel]}</Button>
            <Button size="sm" variant="ghost" onClick={() => { setPanel(null); setText(''); }}>Close</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
