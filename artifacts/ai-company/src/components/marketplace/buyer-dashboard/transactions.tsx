import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { formatPrice } from '@/lib/marketplace/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function TransactionHistory() {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'transactions'], queryFn: () => api.listTransactions() });
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const rows = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15);
  if (!rows.length) return <p className="text-sm text-muted-foreground">No transactions yet.</p>;
  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-mono text-xs">#{t.id.slice(-6)} · order {t.orderId.slice(-6)}</TableCell>
              <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="capitalize">{t.type.replace('_', ' ')}</TableCell>
              <TableCell className="capitalize">{t.status}</TableCell>
              <TableCell className="text-right font-mono">{t.type === 'refund' ? '+' : ''}{formatPrice(t.amountCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
