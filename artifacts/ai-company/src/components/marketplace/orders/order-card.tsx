import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/marketplace/api';
import { formatPrice } from '@/lib/marketplace/format';
import type { Order } from '@/lib/marketplace/types';
import { OrderStatusBadge } from './status-badge';

export function OrderCard({ order, as }: { order: Order; as: 'buyer' | 'seller' }) {
  const otherId = as === 'buyer' ? order.sellerId : order.buyerId;
  const { data: gig } = useQuery({ queryKey: ['mp', 'gig', order.gigId], queryFn: () => api.getGig(order.gigId) });
  const { data: other } = useQuery({ queryKey: ['mp', 'user', otherId], queryFn: () => api.getUser(otherId) });
  const amount = as === 'seller' ? order.priceCents - order.feeCents : order.priceCents;
  return (
    <Link href={`/marketplace/orders/${order.id}`}>
      <Card className="p-4 hover:border-primary/50 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium truncate">{gig?.title ?? 'Gig'}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {as === 'buyer' ? 'Seller' : 'Buyer'}: {other?.displayName ?? '…'} · <span className="capitalize">{order.tier}</span> · Due {new Date(order.dueAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <p className="font-mono font-semibold">{formatPrice(amount)}</p>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
