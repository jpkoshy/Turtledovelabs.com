import { Link, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { GigCard } from '@/components/marketplace/gig-card';
import { SellerHeader, SellerReviews } from '@/components/marketplace/seller';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/marketplace/api';

export default function SellerProfile() {
  const { username = '' } = useParams<{ username: string }>();

  const sellerQ = useQuery({ queryKey: ['mp', 'seller', username], queryFn: () => api.getUserByUsername(username) });
  const seller = sellerQ.data;

  const dataQ = useQuery({
    queryKey: ['mp', 'seller-data', seller?.id],
    enabled: !!seller,
    queryFn: async () => {
      const all = await api.listGigsBySeller(seller!.id);
      const gigs = all.filter((g) => g.status === 'active');
      const reviews = (await Promise.all(gigs.map((g) => api.listReviewsForGig(g.id)))).flat();
      reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { gigs, reviews };
    },
  });

  if (sellerQ.isLoading) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto space-y-6 px-6 py-8"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>
      </MarketplaceLayout>
    );
  }

  if (!seller) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Seller not found</h1>
          <p className="text-muted-foreground">We couldn't find a seller named @{username}.</p>
          <Button asChild><Link href="/marketplace/browse">Browse gigs</Link></Button>
        </div>
      </MarketplaceLayout>
    );
  }

  const gigs = dataQ.data?.gigs ?? [];
  const reviews = dataQ.data?.reviews ?? [];
  const ratingCount = gigs.reduce((n, g) => n + g.ratingCount, 0);
  const ratingAvg = ratingCount ? gigs.reduce((s, g) => s + g.ratingAvg * g.ratingCount, 0) / ratingCount : 0;

  return (
    <MarketplaceLayout>
      <div className="container mx-auto space-y-10 px-6 py-8">
        <SellerHeader seller={seller} ratingAvg={ratingAvg} ratingCount={ratingCount} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="max-w-3xl whitespace-pre-line text-sm text-muted-foreground">{seller.bio || 'This seller has not added a bio yet.'}</p>
          {seller.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {seller.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Active gigs ({gigs.length})</h2>
          {dataQ.isLoading ? <Skeleton className="h-48 w-full" /> : gigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active gigs right now.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gigs.map((g) => <GigCard key={g.id} gig={g} />)}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Recent reviews</h2>
          <SellerReviews reviews={reviews.slice(0, 10)} gigs={gigs} />
        </section>
      </div>
    </MarketplaceLayout>
  );
}
