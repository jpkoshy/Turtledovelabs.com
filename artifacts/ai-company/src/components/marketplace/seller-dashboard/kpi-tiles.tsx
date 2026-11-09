import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/marketplace/format';

export interface Kpis { available: number; pending: number; activeOrders: number; completionRate: number | null; avgRating: number | null }

export function KpiTiles({ k }: { k: Kpis }) {
  const tiles = [
    { label: 'Available earnings', value: formatPrice(k.available) },
    { label: 'Pending earnings', value: formatPrice(k.pending) },
    { label: 'Active orders', value: String(k.activeOrders) },
    { label: 'Completion rate', value: k.completionRate == null ? '—' : `${Math.round(k.completionRate * 100)}%` },
    { label: 'Avg rating', value: k.avgRating == null ? '—' : k.avgRating.toFixed(2) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{t.label}</div>
            <div className="mt-1 font-mono text-xl font-semibold">{t.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
