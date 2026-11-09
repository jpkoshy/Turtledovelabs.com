import { useParams, useLocation, Link } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import MarketplaceLayout from '@/components/marketplace/layout';
import { GigCard } from '@/components/marketplace/gig-card';
import { RatingStars } from '@/components/marketplace/rating-stars';
import { GigFaq, GigGallery, PackagePanel, ReviewsSection, SellerMiniCard } from '@/components/marketplace/gig-detail';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function GigDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const gigQ = useQuery({ queryKey: ['mp', 'gig', slug], queryFn: () => api.getGigBySlug(slug) });
  const gig = gigQ.data;
  const sellerQ = useQuery({ queryKey: ['mp', 'user', gig?.sellerId], queryFn: () => api.getUser(gig!.sellerId), enabled: !!gig });
  const favsQ = useQuery({ queryKey: ['mp', 'favorites'], queryFn: () => api.listFavorites(), enabled: !!user });
  const relatedQ = useQuery({
    queryKey: ['mp', 'related', gig?.categoryId, gig?.id],
    queryFn: () => api.searchGigs({ categoryId: gig!.categoryId, pageSize: 5 }),
    enabled: !!gig,
  });
  const related = (relatedQ.data?.items ?? []).filter((g) => g.id !== gig?.id).slice(0, 4);
  const isFav = !!favsQ.data?.some((g) => g.id === gig?.id);

  const needAuth = () => { toast({ title: 'Sign in required', description: 'Please sign in to continue.' }); navigate('/marketplace/auth'); };

  const fav = useMutation({
    mutationFn: () => api.toggleFavorite(gig!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mp', 'favorites'] }),
    onError: (e: Error) => toast({ title: 'Could not update favorite', description: e.message, variant: 'destructive' }),
  });
  const contact = useMutation({
    mutationFn: () => api.startConversation(gig!.sellerId, gig!.id),
    onSuccess: () => navigate('/marketplace/inbox'),
    onError: (e: Error) => toast({ title: 'Could not start conversation', description: e.message, variant: 'destructive' }),
  });

  if (gigQ.isLoading) {
    return <MarketplaceLayout><div className="container mx-auto px-6 py-12 space-y-4"><Skeleton className="h-8 w-2/3" /><Skeleton className="aspect-video w-full max-w-3xl" /></div></MarketplaceLayout>;
  }
  if (!gig || gig.status === 'rejected') {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-6 py-24 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Gig not found</h1>
          <p className="text-muted-foreground">This gig doesn't exist or is no longer available.</p>
          <Button asChild><Link href="/marketplace/browse">Browse gigs</Link></Button>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-6 py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8 min-w-0">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold leading-tight">{gig.title}</h1>
                <Button variant="outline" size="icon" aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={isFav} disabled={fav.isPending}
                  onClick={() => (user ? fav.mutate() : needAuth())}>
                  <Heart className={isFav ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4'} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {sellerQ.data && <SellerMiniCard seller={sellerQ.data} />}
                <RatingStars value={gig.ratingAvg} count={gig.ratingCount} />
                <span className="text-sm text-muted-foreground">{gig.ordersCompleted} orders completed</span>
              </div>
            </div>
            <GigGallery images={gig.images} title={gig.title} />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">About this gig</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{gig.description}</p>
              {gig.tags.length > 0 && <div className="flex flex-wrap gap-2">{gig.tags.map((t) => <span key={t} className="rounded border border-border px-2 py-0.5 font-mono text-xs">{t}</span>)}</div>}
            </section>
            <div className="lg:hidden"><PackagePanel gig={gig} contacting={contact.isPending} onContact={() => (user ? contact.mutate() : needAuth())} /></div>
            <GigFaq faqs={gig.faqs} />
            <ReviewsSection gigId={gig.id} ratingAvg={gig.ratingAvg} ratingCount={gig.ratingCount} />
          </div>
          <aside className="hidden lg:block">
            <div className="sticky top-24"><PackagePanel gig={gig} contacting={contact.isPending} onContact={() => (user ? contact.mutate() : needAuth())} /></div>
          </aside>
        </div>
        {related.length > 0 && (
          <section className="mt-16 space-y-4">
            <h2 className="text-lg font-semibold">Related gigs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{related.map((g) => <GigCard key={g.id} gig={g} />)}</div>
          </section>
        )}
      </div>
    </MarketplaceLayout>
  );
}
