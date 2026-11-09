import { Clock, RefreshCw, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { feeFor, formatPrice } from '@/lib/marketplace/format';
import type { Gig, Package } from '@/lib/marketplace/types';

export function OrderSummary({ gig, pkg }: { gig: Gig; pkg: Package }) {
  const fee = feeFor(pkg.priceCents);
  return (
    <Card className="p-5 space-y-4" data-testid="order-summary">
      <div>
        <p className="text-xs font-mono uppercase text-muted-foreground">Order summary</p>
        <h2 className="mt-1 font-semibold leading-snug">{gig.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{pkg.name} · <span className="capitalize">{pkg.tier}</span></p>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> {pkg.deliveryDays}-day delivery</li>
        <li className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> {pkg.revisions} revision{pkg.revisions === 1 ? '' : 's'}</li>
        {pkg.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
        ))}
      </ul>
      <Separator />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt>Package price</dt><dd>{formatPrice(pkg.priceCents)}</dd></div>
        <div className="flex justify-between text-muted-foreground"><dt>Service fee (20%)</dt><dd>{formatPrice(fee)}</dd></div>
        <Separator />
        <div className="flex justify-between font-semibold text-base"><dt>Total</dt><dd data-testid="order-total">{formatPrice(pkg.priceCents + fee)}</dd></div>
      </dl>
    </Card>
  );
}
