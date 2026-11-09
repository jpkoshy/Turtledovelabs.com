import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import type { Conversation } from '@/lib/marketplace/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export const initials = (n?: string) => (n ?? '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export function counterpartId(c: Conversation, me: string) {
  return c.participantIds.find((id) => id !== me) ?? c.participantIds[0];
}

function Row({ c, meId, active, onSelect }: { c: Conversation; meId: string; active: boolean; onSelect: () => void }) {
  const otherId = counterpartId(c, meId);
  const { data: other } = useQuery({ queryKey: ['mp', 'user', otherId], queryFn: () => api.getUser(otherId) });
  const { data: msgs } = useQuery({ queryKey: ['mp', 'messages', c.id], queryFn: () => api.listMessages(c.id), refetchInterval: 5000 });
  const last = msgs?.[msgs.length - 1];
  return (
    <button
      onClick={onSelect}
      className={cn('flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50', active && 'bg-muted')}
    >
      <Avatar className="h-10 w-10">
        {other?.avatarUrl && <AvatarImage src={other.avatarUrl} alt="" />}
        <AvatarFallback className="font-mono text-xs">{initials(other?.displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{other?.displayName ?? '...'}</span>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{last ? `${last.senderId === meId ? 'You: ' : ''}${last.body}` : 'No messages yet'}</p>
      </div>
    </button>
  );
}

export function ConversationList({ meId, activeId, onSelect }: { meId: string; activeId?: string; onSelect: (id: string) => void }) {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'conversations'], queryFn: () => api.listConversations(), refetchInterval: 5000 });
  if (isLoading) return <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  if (!data?.length)
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
        <MessageSquare className="h-8 w-8" />
        <p className="text-sm font-medium text-foreground">No conversations yet</p>
        <p className="text-xs">Message a seller from a gig page to start chatting.</p>
      </div>
    );
  const sorted = [...data].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  return <div>{sorted.map((c) => <Row key={c.id} c={c} meId={meId} active={c.id === activeId} onSelect={() => onSelect(c.id)} />)}</div>;
}
