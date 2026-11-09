import { Link } from 'wouter';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace/format';
import type { Order } from '@/lib/marketplace/types';

export function OrderConfirmation({ order, gigTitle }: { order: Order; gigTitle: string }) {
  return (
    <div className="mx-auto max-w-lg text-center space-y-4 py-8" data-testid="order-confirmation">
      <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
      <h1 className="text-2xl font-semibold">Order placed</h1>
      <p className="text-muted-foreground">
        Your order for “{gigTitle}” ({formatPrice(order.priceCents + order.feeCents)} total, demo — nothing was charged) has been sent to the seller.
      </p>
      <p className="text-xs font-mono text-muted-foreground">Order #{order.id}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild><Link href={`/marketplace/orders/${order.id}`}>View order</Link></Button>
        <Button asChild variant="outline"><Link href="/marketplace/browse">Keep browsing</Link></Button>
      </div>
    </div>
  );
}
