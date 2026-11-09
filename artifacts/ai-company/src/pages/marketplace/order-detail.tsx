import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/marketplace/auth-context';
import { api } from '@/lib/marketplace/api';
import { formatPrice } from '@/lib/marketplace/format';
import { OrderActions, OrderStatusBadge, OrderTimeline, ReviewSlot } from '@/components/marketplace/orders';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { data: order, isLoading } = useQuery({ queryKey: ['mp', 'order', id], queryFn: () => api.getOrder(id), enabled: !!user });
  const { data: gig } = useQuery({ queryKey: ['mp', 'gig', order?.gigId], queryFn: () => api.getGig(order!.gigId), enabled: !!order });
  const role: 'buyer' | 'seller' | null = order && user ? (order.buyerId === user.id ? 'buyer' : order.sellerId === user.id ? 'seller' : null) : null;
  const otherId = order ? (role === 'seller' ? order.buyerId : order.sellerId) : undefined;
  const { data: other } = useQuery({ queryKey: ['mp', 'user', otherId], queryFn: () => api.getUser(otherId!), enabled: !!otherId });

  const wrap = (c: React.ReactNode) => (
    <MarketplaceLayout><div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">{c}</div></MarketplaceLayout>
  );

  if (!loading && !user) return wrap(<div className="text-center space-y-4"><h1 className="text-2xl font-semibold">Sign in to view this order</h1><Button asChild><Link href="/marketplace/auth">Sign in</Link></Button></div>);
  if (loading || isLoading) return wrap(<Skeleton className="h-64 w-full" />);
  if (!order || (!role && user?.role !== 'admin')) return wrap(<div className="text-center space-y-4"><h1 className="text-2xl font-semibold">Order not found</h1><Button asChild variant="outline"><Link href="/marketplace/orders">Back to orders</Link></Button></div>);

  const earnings = order.priceCents - order.feeCents;
  return wrap(
    <>
      <Link href="/marketplace/orders" className="text-sm text-muted-foreground hover:text-foreground font-mono">← All orders</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{gig?.title ?? 'Order'}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Order #{order.id.slice(0, 8)} · <span className="capitalize">{order.tier}</span> · Placed {new Date(order.createdAt).toLocaleDateString()} · Due {new Date(order.dueAt).toLocaleDateString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <Card className="p-5"><OrderTimeline order={order} /></Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground">{role === 'seller' ? 'Buyer' : 'Seller'}</p><p className="font-medium">{other?.displayName ?? '…'}</p></Card>
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground">{role === 'seller' ? 'Order price' : 'Total paid'}</p><p className="font-medium font-mono">{formatPrice(order.priceCents)}</p></Card>
        <Card className="p-4">
          <p className="text-xs font-mono text-muted-foreground">{role === 'seller' ? 'Your earnings' : 'Service fee'}</p>
          <p className="font-medium font-mono">{formatPrice(role === 'seller' ? earnings : order.feeCents)}</p>
        </Card>
      </div>

      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-mono uppercase text-muted-foreground">Requirements</h2>
        <p className="text-sm whitespace-pre-wrap">{order.requirements?.trim() || 'No requirements provided.'}</p>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="text-sm font-mono uppercase text-muted-foreground">Deliveries ({order.deliveries.length})</h2>
        {order.deliveries.length === 0 && <p className="text-sm text-muted-foreground">Nothing delivered yet.</p>}
        {order.deliveries.map((d, i) => (
          <div key={d.id} className="border-l-2 border-primary/50 pl-3 space-y-1">
            <p className="text-xs font-mono text-muted-foreground">Delivery {i + 1} · {new Date(d.createdAt).toLocaleString()}</p>
            <p className="text-sm whitespace-pre-wrap">{d.message}</p>
            {d.files.map((f) => <p key={f} className="text-xs font-mono text-primary break-all">{f}</p>)}
          </div>
        ))}
      </Card>

      {role && <OrderActions order={order} role={role} />}
      {role === 'buyer' && order.status === 'completed' && <ReviewSlot order={order} />}
    </>,
  );
}
