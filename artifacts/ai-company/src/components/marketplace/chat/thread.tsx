import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import type { Conversation } from '@/lib/marketplace/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { counterpartId, initials } from './conversation-list';

export function Thread({ conversation, meId, onBack }: { conversation: Conversation; meId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const otherId = counterpartId(conversation, meId);
  const { data: other } = useQuery({ queryKey: ['mp', 'user', otherId], queryFn: () => api.getUser(otherId) });
  const { data: gig } = useQuery({ queryKey: ['mp', 'gig', conversation.gigId], queryFn: () => api.getGig(conversation.gigId!), enabled: !!conversation.gigId });
  const { data: msgs, isLoading } = useQuery({ queryKey: ['mp', 'messages', conversation.id], queryFn: () => api.listMessages(conversation.id), refetchInterval: 3000 });
  const send = useMutation({
    mutationFn: (body: string) => api.sendMessage(conversation.id, body),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['mp', 'messages', conversation.id] });
      qc.invalidateQueries({ queryKey: ['mp', 'conversations'] });
    },
  });
  const count = msgs?.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [count, conversation.id]);
  const submit = () => { const b = draft.trim(); if (b && !send.isPending) send.mutate(b); };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to conversations"><ArrowLeft className="h-4 w-4" /></Button>
        <Avatar className="h-8 w-8">
          {other?.avatarUrl && <AvatarImage src={other.avatarUrl} alt="" />}
          <AvatarFallback className="font-mono text-xs">{initials(other?.displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{other?.displayName ?? '...'}</div>
          {gig && <div className="truncate text-xs text-muted-foreground">Re: {gig.title}</div>}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
        {isLoading && <Skeleton className="h-10 w-2/3" />}
        {!isLoading && !count && <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>}
        {msgs?.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <time className="mt-1 block text-right font-mono text-[10px] opacity-60">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form className="flex items-end gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
          placeholder="Write a message... (Enter to send, Shift+Enter for newline)"
          rows={1}
          className="max-h-32 min-h-10 resize-none"
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || send.isPending} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
