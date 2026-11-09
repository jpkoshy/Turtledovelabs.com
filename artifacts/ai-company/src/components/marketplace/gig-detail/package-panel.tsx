import { useState } from 'react';
import { Link } from 'wouter';
import { Check, Clock, RefreshCw } from 'lucide-react';
import type { Gig, Tier } from '@/lib/marketplace/types';
import { formatPrice } from '@/lib/marketplace/format';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ORDER: Tier[] = ['basic', 'standard', 'premium'];

export function PackagePanel({ gig, onContact, contacting }: { gig: Gig; onContact: () => void; contacting?: boolean }) {
  const pkgs = ORDER.map((t) => gig.packages.find((p) => p.tier === t)).filter((p): p is NonNullable<typeof p> => !!p);
  const [tier, setTier] = useState<Tier>(pkgs.find((p) => p.tier === 'standard')?.tier ?? pkgs[0]?.tier ?? 'basic');
  if (!pkgs.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card">
      <Tabs value={tier} onValueChange={(v) => setTier(v as Tier)}>
        <TabsList className="grid w-full grid-cols-3 rounded-b-none">
          {pkgs.map((p) => <TabsTrigger key={p.tier} value={p.tier} className="font-mono text-xs uppercase">{p.tier}</TabsTrigger>)}
        </TabsList>
        {pkgs.map((p) => (
          <TabsContent key={p.tier} value={p.tier} className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium">{p.name}</h3>
              <span className="font-mono text-xl font-semibold">{formatPrice(p.priceCents)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{p.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{p.deliveryDays}-day delivery</span>
              <span className="inline-flex items-center gap-1"><RefreshCw className="h-4 w-4" />{p.revisions} revisions</span>
            </div>
            <ul className="space-y-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}</li>)}
            </ul>
            <Button asChild className="w-full">
              <Link href={`/marketplace/checkout/${gig.id}/${p.tier}`}>Continue ({formatPrice(p.priceCents)})</Link>
            </Button>
          </TabsContent>
        ))}
      </Tabs>
      <div className="border-t border-border p-5">
        <Button variant="outline" className="w-full" onClick={onContact} disabled={contacting}>Contact seller</Button>
      </div>
    </div>
  );
}
