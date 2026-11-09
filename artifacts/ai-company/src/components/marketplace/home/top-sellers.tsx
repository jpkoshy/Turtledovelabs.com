import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import type { User } from '@/lib/marketplace/types';
import { RatingStars } from '../rating-stars';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from './section-header';

interface SellerCard { user: User; ratingAvg: number; ratingCount: number; gigs: number }

async function loadTopSellers(): Promise<SellerCard[]> {
  const page = await api.searchGigs({ sort: 'rating', pageSize: 40 });
  const agg = new Map<string, { sum: number; count: number; gigs: number }>();
  for (const g of page.items) {
    const a = agg.get(g.sellerId) ?? { sum: 0, count: 0, gigs: 0 };
    a.sum += g.ratingAvg * g.ratingCount; a.count += g.ratingCount; a.gigs += 1;
    agg.set(g.sellerId, a);
  }
  const ranked = [...agg.entries()].sort((a, b) => b[1].sum / (b[1].count || 1) - a[1].sum / (a[1].count || 1)).slice(0, 10);
  const users = await Promise.all(ranked.map(([id]) => api.getUser(id)));
  const out: SellerCard[] = [];
  ranked.forEach(([, a], i) => {
    const user = users[i];
    if (user) out.push({ user, ratingAvg: a.count ? a.sum / a.count : 0, ratingCount: a.count, gigs: a.gigs });
  });
  return out;
}

const LEVEL: Record<string, string> = { new: 'New seller', level1: 'Level 1', level2: 'Level 2', top: 'Top rated' };

export function TopSellers() {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'home', 'top-sellers'], queryFn: loadTopSellers });
  const track = 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-6 px-6';
  return (
    <section className="container mx-auto px-6 py-12">
      <SectionHeader title="Top-rated sellers" />
      {isLoading ? (
        <div className={track}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-56 shrink-0" />)}</div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sellers to show yet.</p>
      ) : (
        <div className={track}>
          {data.map(({ user, ratingAvg, ratingCount, gigs }) => (
            <Link key={user.id} href={`/marketplace/seller/${user.username}`} className="snap-start shrink-0 w-56 rounded-lg border border-border bg-card p-4 text-center space-y-2 hover:border-primary transition-colors">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-xl font-semibold text-primary">{user.displayName.slice(0, 1).toUpperCase()}</div>
              )}
              <p className="font-medium truncate">{user.displayName}</p>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">{LEVEL[user.level] ?? user.level} · {gigs} gig{gigs === 1 ? '' : 's'}</p>
              <RatingStars value={ratingAvg} count={ratingCount} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
