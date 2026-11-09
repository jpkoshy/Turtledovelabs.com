import { Link } from 'wouter';
import type { User } from '@/lib/marketplace/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const LEVELS: Record<User['level'], string> = { new: 'New seller', level1: 'Level 1', level2: 'Level 2', top: 'Top rated' };

export function SellerMiniCard({ seller }: { seller: User }) {
  return (
    <Link href={`/marketplace/seller/${seller.username}`} className="inline-flex items-center gap-3 hover:opacity-80">
      <Avatar className="h-9 w-9">
        {seller.avatarUrl && <AvatarImage src={seller.avatarUrl} alt={seller.displayName} />}
        <AvatarFallback>{seller.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{seller.displayName}</span>
      <Badge variant="secondary" className="font-mono text-[10px] uppercase">{LEVELS[seller.level]}</Badge>
    </Link>
  );
}
