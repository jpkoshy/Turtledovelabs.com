import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/marketplace/auth-context';
import { api } from '@/lib/marketplace/api';
import { StatTiles, ActiveOrders, Favorites, RecentNotifications, TransactionHistory, RecommendedGigs } from '@/components/marketplace/buyer-dashboard';

const Section = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between"><h2 className="font-mono text-sm uppercase tracking-wide text-muted-foreground">{title}</h2>{action}</div>
    {children}
  </section>
);

export default function BuyerDashboard() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: orders, isLoading } = useQuery({ queryKey: ['mp', 'orders', 'buyer', user?.id], queryFn: () => api.listOrders('buyer'), enabled: !!user });
  const switchRole = useMutation({
    mutationFn: () => api.updateProfile({ role: 'seller' }),
    onSuccess: (u) => { qc.setQueryData(['marketplace', 'me'], u); navigate('/marketplace/dashboard/seller'); },
  });

  if (loading) return <MarketplaceLayout><div className="container mx-auto px-6 py-12"><Skeleton className="h-40 w-full" /></div></MarketplaceLayout>;
  if (!user) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Sign in to view your dashboard</h1>
          <Button asChild><Link href="/marketplace/auth">Sign in</Link></Button>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-semibold">Welcome back, {user.displayName}</h1><p className="text-sm text-muted-foreground">Your buyer dashboard</p></div>
          {user.role === 'buyer' ? (
            <Button variant="outline" disabled={switchRole.isPending} onClick={() => switchRole.mutate()}>Switch to selling</Button>
          ) : (
            <Button variant="outline" asChild><Link href="/marketplace/dashboard/seller">Go to seller dashboard</Link></Button>
          )}
        </div>
        {isLoading ? <Skeleton className="h-24 w-full" /> : <StatTiles orders={orders ?? []} />}
        <Section title="Active orders" action={<Link href="/marketplace/orders" className="text-sm underline">All orders</Link>}>
          {isLoading ? <Skeleton className="h-24 w-full" /> : <ActiveOrders orders={orders ?? []} />}
        </Section>
        <Section title="Favorites"><Favorites /></Section>
        <Section title="Notifications"><RecentNotifications /></Section>
        <Section title="Transactions & receipts"><TransactionHistory /></Section>
        <Section title="Recommended for you"><RecommendedGigs /></Section>
      </div>
    </MarketplaceLayout>
  );
}
