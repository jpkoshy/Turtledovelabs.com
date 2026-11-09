import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/marketplace/api';
import { formatPrice, startingPrice } from '@/lib/marketplace/format';
import type { Gig } from '@/lib/marketplace/types';

export function GigsTable({ gigs }: { gigs: Gig[] }) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (g: Gig) => api.updateGig(g.id, { status: g.status === 'active' ? 'paused' : 'active' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mp'] }),
  });
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">My gigs</CardTitle>
        <Button asChild size="sm"><Link href="/marketplace/sell/new">New gig</Link></Button>
      </CardHeader>
      <CardContent>
        {gigs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">You have no gigs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Gig</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">From</TableHead><TableHead className="hidden sm:table-cell">Orders</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {gigs.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="max-w-[16rem] truncate font-medium">{g.title}</TableCell>
                  <TableCell><Badge variant={g.status === 'active' ? 'default' : 'secondary'}>{g.status}</Badge></TableCell>
                  <TableCell className="hidden font-mono sm:table-cell">{formatPrice(startingPrice(g))}</TableCell>
                  <TableCell className="hidden sm:table-cell">{g.ordersCompleted}</TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap text-right">
                    {(g.status === 'active' || g.status === 'paused') && (
                      <Button size="sm" variant="outline" disabled={toggle.isPending} onClick={() => toggle.mutate(g)}>
                        {g.status === 'active' ? 'Pause' : 'Activate'}
                      </Button>
                    )}
                    <Button asChild size="sm" variant="ghost"><Link href={`/marketplace/sell/${g.id}/edit`}>Edit</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
