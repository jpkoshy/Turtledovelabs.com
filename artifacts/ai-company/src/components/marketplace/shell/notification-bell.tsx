import { Bell } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ['mp', 'notifications', user?.id],
    queryFn: () => api.listNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });
  if (!user) return null;
  const unread = data.filter((n) => !n.read).length;
  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    qc.invalidateQueries({ queryKey: ['mp', 'notifications'] });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-mono flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border font-mono text-xs uppercase tracking-widest text-muted-foreground">Notifications</div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-border">
          {data.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground text-center">You're all caught up.</li>}
          {data.slice(0, 20).map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => !n.read && markRead(n.id)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted/50 flex gap-2"
              >
                {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                <span className={n.read ? 'text-muted-foreground' : ''}>{n.body}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
