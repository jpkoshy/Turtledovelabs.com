import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentNotifications() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'notifications'], queryFn: () => api.listNotifications() });
  const mark = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mp', 'notifications'] }); },
  });
  if (isLoading) return <Skeleton className="h-32 w-full" />;
  const items = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  if (!items.length) return <p className="text-sm text-muted-foreground">You're all caught up.</p>;
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((n) => (
        <li key={n.id} className="flex items-start justify-between gap-3 p-3 text-sm">
          <div className="min-w-0">
            <p className={n.read ? 'text-muted-foreground' : 'font-medium'}>{n.body}</p>
            <p className="font-mono text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
          </div>
          {!n.read && <Button size="sm" variant="ghost" disabled={mark.isPending} onClick={() => mark.mutate(n.id)}>Mark read</Button>}
        </li>
      ))}
    </ul>
  );
}
