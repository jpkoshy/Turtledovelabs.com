import { Badge } from '@/components/ui/badge';
import type { SellerLevel } from '@/lib/marketplace/types';

const LABELS: Record<SellerLevel, string> = { new: 'New Seller', level1: 'Level 1', level2: 'Level 2', top: 'Top Rated' };

export function LevelBadge({ level }: { level: SellerLevel }) {
  return (
    <Badge variant={level === 'top' ? 'default' : 'secondary'} className="font-mono text-xs uppercase">
      {LABELS[level]}
    </Badge>
  );
}
