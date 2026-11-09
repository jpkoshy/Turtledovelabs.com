import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/marketplace/auth-context';
import { api } from '@/lib/marketplace/api';
import { OrderCard } from '@/components/marketplace/orders';
import type { OrderStatus } from '@/lib/marketplace/types';

const TABS: { value: 'all' | OrderStatus | 'in_progress'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'revision', label: 'Revision' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' },
];

export default function Orders() {
  const { user, loading } = useAuth();
  const [as, setAs] = useState<'buyer' | 'seller'>(user?.role === 'seller' ? 'seller' : 'buyer');
  const [tab, setTab] = useState<string>('all');
  const { data: orders, isLoading } = useQuery({ queryKey: ['mp', 'orders', as, user?.id], queryFn: () => api.listOrders(as), enabled: !!user });

  if (!loading && !user) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-6 py-16 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in to view your orders</h1>
          <Button asChild><Link href="/marketplace/auth">Sign in</Link></Button>
        </div>
      </MarketplaceLayout>
    );
  }

  const filtered = (orders ?? []).filter((o) => tab === 'all' || o.status === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (v: string) => (v === 'all' ? orders?.length : orders?.filter((o) => o.status === v).length) ?? 0;

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="View as">
            {(['buyer', 'seller'] as const).map((r) => (
              <Button key={r} size="sm" variant={as === r ? 'default' : 'ghost'} onClick={() => setAs(r)}>{r === 'buyer' ? 'As buyer' : 'As seller'}</Button>
            ))}
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto">
            <TabsList>
              {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label} ({count(t.value)})</TabsTrigger>)}
            </TabsList>
          </div>
        </Tabs>
        <div className="space-y-3">
          {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <p>No orders here yet.</p>
              {as === 'buyer' && <Button asChild variant="outline"><Link href="/marketplace/browse">Browse gigs</Link></Button>}
            </div>
          )}
          {filtered.map((o) => <OrderCard key={o.id} order={o} as={as} />)}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
