import { Link } from 'wouter';
import type { Order } from '@/lib/marketplace/types';
import { formatPrice } from '@/lib/marketplace/format';

const ACTIVE = ['pending', 'active', 'delivered', 'revision'];
export const isActiveOrder = (o: Order) => ACTIVE.includes(o.status);
export const totalSpentCents = (orders: Order[]) => orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.priceCents, 0);

export function StatTiles({ orders }: { orders: Order[] }) {
  const active = orders.filter(isActiveOrder);
  const completed = orders.filter((o) => o.status === 'completed').length;
  const tiles = [
    { label: 'Active orders', value: String(active.length), href: '/marketplace/orders' },
    { label: 'Completed', value: String(completed), href: '/marketplace/orders' },
    { label: 'Total spent', value: formatPrice(totalSpentCents(orders)) },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiles.map((t) => {
        const body = (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-mono text-xs uppercase text-muted-foreground">{t.label}</p>
            <p className="mt-2 text-2xl font-semibold">{t.value}</p>
          </div>
        );
        return t.href ? <Link key={t.label} href={t.href} className="block hover:opacity-90">{body}</Link> : <div key={t.label}>{body}</div>;
      })}
    </div>
  );
}

export function ActiveOrders({ orders }: { orders: Order[] }) {
  const active = orders.filter(isActiveOrder).slice(0, 5);
  if (!active.length) return <p className="text-sm text-muted-foreground">No active orders right now.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {active.map((o) => (
        <li key={o.id}>
          <Link href={`/marketplace/orders/${o.id}`} className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-muted/50">
            <span className="font-mono text-xs">#{o.id.slice(-6)} · {o.tier}</span>
            <span className="text-muted-foreground capitalize">{o.status}</span>
            <span className="text-muted-foreground hidden sm:inline">Due {new Date(o.dueAt).toLocaleDateString()}</span>
            <span className="font-medium">{formatPrice(o.priceCents)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
