import { useState } from 'react';
import { useLocation } from 'wouter';
import { Globe, Languages, MapPin, CalendarDays, MessageSquare } from 'lucide-react';
import type { User } from '@/lib/marketplace/types';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RatingStars } from '../rating-stars';
import { LevelBadge } from './level-badge';

export function SellerHeader({ seller, ratingAvg, ratingCount }: { seller: User; ratingAvg: number; ratingCount: number }) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [busy, setBusy] = useState(false);
  const own = user?.id === seller.id;

  async function contact() {
    if (!user) return navigate('/marketplace/auth');
    setBusy(true);
    try {
      await api.startConversation(seller.id);
      navigate('/marketplace/inbox');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
      <Avatar className="h-24 w-24">
        {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt={seller.displayName} />}
        <AvatarFallback className="text-2xl">{seller.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{seller.displayName}</h1>
          <LevelBadge level={seller.level} />
        </div>
        <p className="font-mono text-xs text-muted-foreground">@{seller.username}</p>
        <RatingStars value={ratingAvg} count={ratingCount} />
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {seller.country && <li className="flex items-center gap-1"><MapPin className="h-4 w-4" />{seller.country}</li>}
          {seller.languages.length > 0 && <li className="flex items-center gap-1"><Languages className="h-4 w-4" />{seller.languages.join(', ')}</li>}
          <li className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />Member since {new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</li>
        </ul>
      </div>
      {!own && (
        <Button onClick={contact} disabled={busy}>
          <MessageSquare className="mr-2 h-4 w-4" />Contact me
        </Button>
      )}
    </section>
  );
}
