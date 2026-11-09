import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from 'wouter';
import { MessageSquare } from 'lucide-react';
import MarketplaceLayout from '@/components/marketplace/layout';
import { ConversationList, Thread } from '@/components/marketplace/chat';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { cn } from '@/lib/utils';

export default function Inbox() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const activeId = new URLSearchParams(useSearch()).get('c') ?? undefined;
  const { data: convs } = useQuery({ queryKey: ['mp', 'conversations'], queryFn: () => api.listConversations(), enabled: !!user, refetchInterval: 5000 });
  const active = convs?.find((c) => c.id === activeId);
  const select = (id?: string) => navigate(id ? `/marketplace/inbox?c=${encodeURIComponent(id)}` : '/marketplace/inbox');

  if (loading) return <MarketplaceLayout><div className="container mx-auto px-6 py-12"><Skeleton className="h-96 w-full" /></div></MarketplaceLayout>;
  if (!user)
    return (
      <MarketplaceLayout>
        <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-24 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Sign in to view your inbox</h1>
          <Button asChild><Link href="/marketplace/auth">Sign in</Link></Button>
        </div>
      </MarketplaceLayout>
    );

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 pb-8 md:px-6">
        <h1 className="mb-4 text-2xl font-semibold">Inbox</h1>
        <div className="grid h-[70vh] min-h-[420px] overflow-hidden rounded-lg border border-border md:grid-cols-[320px_1fr]">
          <aside className={cn('min-h-0 overflow-y-auto border-border md:border-r', active ? 'hidden md:block' : 'block')}>
            <ConversationList meId={user.id} activeId={active?.id} onSelect={select} />
          </aside>
          <section className={cn('min-h-0', active ? 'block' : 'hidden md:block')}>
            {active ? (
              <Thread key={active.id} conversation={active} meId={user.id} onBack={() => select()} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
