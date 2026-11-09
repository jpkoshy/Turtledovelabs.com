import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/marketplace/format';
import type { Gig, Order } from '@/lib/marketplace/types';

const LABEL: Record<string, string> = { pending: 'Awaiting start', active: 'Deliver work', revision: 'Revision requested' };

export function ActionOrders({ orders, gigs }: { orders: Order[]; gigs: Gig[] }) {
  const todo = orders.filter((o) => ['pending', 'active', 'revision'].includes(o.status)).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const title = (id: string) => gigs.find((g) => g.id === id)?.title ?? 'Gig';
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Orders needing action</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {todo.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nothing needs your attention.</p>}
        {todo.map((o) => {
          const overdue = new Date(o.dueAt).getTime() < Date.now();
          return (
            <Link key={o.id} href={`/marketplace/orders/${o.id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 hover:bg-muted/50">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{title(o.gigId)}</div>
                <div className={`text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>Due {new Date(o.dueAt).toLocaleDateString()}{overdue ? ' (overdue)' : ''}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{LABEL[o.status]}</Badge>
                <span className="font-mono text-sm">{formatPrice(o.priceCents - o.feeCents)}</span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
