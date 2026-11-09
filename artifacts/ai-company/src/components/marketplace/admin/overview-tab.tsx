import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/marketplace/format';
import type { User } from '@/lib/marketplace/types';
import { useAdminGigs, useAdminOrders, useAdminTransactions, useAdminUsers } from './hooks';

export function OverviewTab({ me }: { me: User | null }) {
  const users = useAdminUsers(me);
  const gigs = useAdminGigs();
  const orders = useAdminOrders();
  const tx = useAdminTransactions();
  const loading = users.isLoading || gigs.isLoading || orders.isLoading || tx.isLoading;
  const ok = (t: { type: string; status: string }) => t.status === 'completed';
  const gmv = (orders.data ?? []).filter((o) => o.status === 'completed').reduce((s, o) => s + o.priceCents, 0);
  const fees = (tx.data ?? []).filter((t) => t.type === 'fee' && ok(t)).reduce((s, t) => s + t.amountCents, 0);
  const stats = [
    { label: 'Users', value: String(users.data?.length ?? 0) },
    { label: 'Gigs', value: `${gigs.data?.length ?? 0}`, sub: `${(gigs.data ?? []).filter((g) => g.status === 'active').length} active` },
    { label: 'Orders', value: String(orders.data?.length ?? 0), sub: `${(orders.data ?? []).filter((o) => o.status === 'completed').length} completed` },
    { label: 'GMV (completed)', value: formatPrice(gmv) },
    { label: 'Platform fees', value: formatPrice(fees) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-1"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">{s.label}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-semibold">{s.value}</div>}
            {s.sub && !loading && <div className="text-xs text-muted-foreground">{s.sub}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
