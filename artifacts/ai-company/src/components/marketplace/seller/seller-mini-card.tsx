import { Link } from 'wouter';
import type { User } from '@/lib/marketplace/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LevelBadge } from './level-badge';

export function SellerMiniCard({ seller }: { seller: User }) {
  return (
    <Link
      href={`/marketplace/seller/${seller.username}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary transition-colors"
    >
      <Avatar className="h-12 w-12">
        {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt={seller.displayName} />}
        <AvatarFallback>{seller.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium">{seller.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">@{seller.username}{seller.country ? ` · ${seller.country}` : ''}</p>
        <LevelBadge level={seller.level} />
      </div>
    </Link>
  );
}
