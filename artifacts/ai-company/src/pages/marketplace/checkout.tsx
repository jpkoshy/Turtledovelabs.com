import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import MarketplaceLayout from '@/components/marketplace/layout';
import { OrderSummary, DemoPaymentForm, OrderConfirmation } from '@/components/marketplace/checkout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { feeFor, formatPrice } from '@/lib/marketplace/format';
import type { Order, Tier } from '@/lib/marketplace/types';

const TIERS: Tier[] = ['basic', 'standard', 'premium'];

function Notice({ title, body, href, cta }: { title: string; body: string; href: string; cta: string }) {
  return (
    <div className="mx-auto max-w-md text-center space-y-3 py-16">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <Button asChild><Link href={href}>{cta}</Link></Button>
    </div>
  );
}

export default function Checkout() {
  const { gigId, tier } = useParams<{ gigId: string; tier: string }>();
  const { user, loading: authLoading } = useAuth();
  const [requirements, setRequirements] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  const gigQ = useQuery({ queryKey: ['mp', 'gig', gigId], queryFn: () => api.getGig(gigId) });
  const place = useMutation({
    mutationFn: () => api.placeOrder({ gigId, tier: tier as Tier, requirements: requirements.trim() || undefined }),
    onSuccess: setOrder,
  });

  const gig = gigQ.data;
  const pkg = gig && TIERS.includes(tier as Tier) ? gig.packages.find((p) => p.tier === tier) : undefined;

  let body;
  if (order) {
    body = <OrderConfirmation order={order} gigTitle={gig?.title ?? 'your order'} />;
  } else if (gigQ.isLoading || authLoading) {
    body = <Skeleton className="h-96 w-full" />;
  } else if (!gig || gig.status !== 'active') {
    body = <Notice title="Gig not found" body="This gig doesn't exist or isn't available." href="/marketplace/browse" cta="Browse gigs" />;
  } else if (!pkg) {
    body = <Notice title="Package not found" body="That package tier doesn't exist for this gig." href={`/marketplace/gig/${gig.slug}`} cta="Back to gig" />;
  } else if (!user) {
    body = <Notice title="Sign in to continue" body="You need an account to place an order." href="/marketplace/auth" cta="Sign in or sign up" />;
  } else if (user.id === gig.sellerId) {
    body = <Notice title="Can't order your own gig" body="Sellers cannot purchase their own services." href={`/marketplace/gig/${gig.slug}`} cta="Back to gig" />;
  } else {
    body = (
      <>
        <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
        <form
          className="grid gap-8 lg:grid-cols-[1fr_360px]"
          onSubmit={(e) => { e.preventDefault(); if (!place.isPending) place.mutate(); }}
        >
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="requirements">Requirements for the seller (optional)</Label>
              <Textarea id="requirements" rows={6} maxLength={2000} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Describe what you need, links, preferred formats…" />
            </div>
            <DemoPaymentForm />
            {place.isError && (
              <p role="alert" className="text-sm text-destructive">{place.error instanceof Error ? place.error.message : 'Could not place order.'}</p>
            )}
          </div>
          <div className="space-y-4 lg:sticky lg:top-28 self-start">
            <OrderSummary gig={gig} pkg={pkg} />
            <Button type="submit" size="lg" className="w-full" disabled={place.isPending}>
              {place.isPending ? 'Placing order…' : `Place order · ${formatPrice(pkg.priceCents + feeFor(pkg.priceCents))}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">Demo — no real payment is taken.</p>
          </div>
        </form>
      </>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 sm:px-6 pb-16">{body}</div>
    </MarketplaceLayout>
  );
}
