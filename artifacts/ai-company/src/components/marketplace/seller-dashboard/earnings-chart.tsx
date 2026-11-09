import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { Transaction } from '@/lib/marketplace/types';

const config = { earnings: { label: 'Earnings ($)', color: 'hsl(var(--primary))' } } satisfies ChartConfig;

export function buildSeries(txns: Transaction[]) {
  const byMonth = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== 'escrow_release' || t.status !== 'completed') continue;
    const key = t.createdAt.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + t.amountCents);
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, c]) => ({ month, earnings: c / 100 }));
}

export function EarningsChart({ txns }: { txns: Transaction[] }) {
  const data = buildSeries(txns);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Earnings over time</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No earnings yet. Completed orders will show up here.</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <AreaChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `$${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="earnings" type="monotone" stroke="var(--color-earnings)" fill="var(--color-earnings)" fillOpacity={0.2} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
