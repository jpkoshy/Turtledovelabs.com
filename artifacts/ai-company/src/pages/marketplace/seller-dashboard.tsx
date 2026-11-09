import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/marketplace/auth-context';
import { api } from '@/lib/marketplace/api';
import { ActionOrders, EarningsChart, GigsTable, KpiTiles, RecentReviews, type Kpis } from '@/components/marketplace/seller-dashboard';

function Gate({ children }: { children: React.ReactNode }) {
  return <MarketplaceLayout><div className="container mx-auto max-w-lg px-6 py-24 text-center">{children}</div></MarketplaceLayout>;
}

export default function SellerDashboard() {
  const { user, loading } = useAuth();
  const enabled = !!user && (user.role === 'seller' || user.role === 'admin');
  const uid = user?.id;
  const gigsQ = useQuery({ queryKey: ['mp', 'seller-gigs', uid], queryFn: () => api.listGigsBySeller(uid!), enabled });
  const ordersQ = useQuery({ queryKey: ['mp', 'orders', 'seller', uid], queryFn: () => api.listOrders('seller'), enabled });
  const txQ = useQuery({ queryKey: ['mp', 'transactions', uid], queryFn: () => api.listTransactions(), enabled });
  const gigs = gigsQ.data ?? [];
  const reviewsQ = useQuery({
    queryKey: ['mp', 'seller-reviews', uid, gigs.map((g) => g.id).join(',')],
    queryFn: async () => (await Promise.all(gigs.map((g) => api.listReviewsForGig(g.id)))).flat(),
    enabled: enabled && gigsQ.isSuccess,
  });

  if (loading) return <Gate><Skeleton className="mx-auto h-8 w-48" /></Gate>;
  if (!user) return <Gate><h1 className="text-2xl font-semibold">Sign in to view your dashboard</h1><Button asChild className="mt-6"><Link href="/marketplace/auth">Sign in</Link></Button></Gate>;
  if (!enabled) return <Gate><h1 className="text-2xl font-semibold">Seller dashboard</h1><p className="mt-2 text-muted-foreground">This area is for seller accounts. Switch your account to a seller in your profile to start selling.</p><Button asChild className="mt-6"><Link href="/marketplace">Back to marketplace</Link></Button></Gate>;

  const orders = ordersQ.data ?? [];
  const txns = txQ.data ?? [];
  const sum = (f: (t: (typeof txns)[number]) => boolean) => txns.filter(f).reduce((s, t) => s + t.amountCents, 0);
  const released = sum((t) => t.type === 'escrow_release' && t.status === 'completed');
  const paidOut = sum((t) => t.type === 'payout' && t.status !== 'failed');
  const pending = orders.filter((o) => ['pending', 'active', 'delivered', 'revision'].includes(o.status)).reduce((s, o) => s + o.priceCents - o.feeCents, 0);
  const done = orders.filter((o) => o.status === 'completed').length;
  const closed = done + orders.filter((o) => o.status === 'cancelled' || o.status === 'disputed').length;
  const rated = gigs.filter((g) => g.ratingCount > 0);
  const ratingCount = rated.reduce((s, g) => s + g.ratingCount, 0);
  const kpis: Kpis = {
    available: Math.max(0, released - paidOut),
    pending,
    activeOrders: orders.filter((o) => ['active', 'revision', 'delivered'].includes(o.status)).length,
    completionRate: closed ? done / closed : null,
    avgRating: ratingCount ? rated.reduce((s, g) => s + g.ratingAvg * g.ratingCount, 0) / ratingCount : null,
  };
  const busy = gigsQ.isLoading || ordersQ.isLoading || txQ.isLoading;

  return (
    <MarketplaceLayout>
      <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Seller dashboard</h1>
          <Button asChild><Link href="/marketplace/sell/new">New gig</Link></Button>
        </div>
        {busy ? <Skeleton className="h-24 w-full" /> : <KpiTiles k={kpis} />}
        <EarningsChart txns={txns} />
        <GigsTable gigs={gigs} />
        <div className="grid gap-6 lg:grid-cols-2">
          <ActionOrders orders={orders} gigs={gigs} />
          <RecentReviews reviews={reviewsQ.data ?? []} gigs={gigs} />
        </div>
      </div>
    </MarketplaceLayout>
  );
}
