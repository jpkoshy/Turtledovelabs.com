import { Link } from 'wouter';
import type { Gig } from '@/lib/marketplace/types';
import { formatPrice, startingPrice } from '@/lib/marketplace/format';
import { RatingStars } from './rating-stars';
export function GigCard({ gig }: { gig: Gig }) {
  return (
    <Link href={`/marketplace/gig/${gig.slug}`} className="group block rounded-lg border border-border bg-card overflow-hidden hover:border-primary transition-colors">
      <div className="aspect-video bg-muted overflow-hidden">{gig.images[0] && <img src={gig.images[0]} alt={gig.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />}</div>
      <div className="p-4 space-y-2">
        <h3 className="line-clamp-2 text-sm font-medium">{gig.title}</h3>
        <RatingStars value={gig.ratingAvg} count={gig.ratingCount} />
        <p className="font-mono text-xs uppercase text-muted-foreground">Starting at <span className="text-foreground text-sm">{formatPrice(startingPrice(gig))}</span></p>
      </div>
    </Link>
  );
}
