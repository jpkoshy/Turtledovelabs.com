import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';

/** Horizontally scrollable category strip. Links use ?categoryId=<id> (matches GigQuery). */
export default function CategoryBar() {
  const { data = [] } = useQuery({ queryKey: ['mp', 'categories'], queryFn: () => api.listCategories(), staleTime: 5 * 60_000 });
  const top = data.filter((c) => !c.parentId);
  if (top.length === 0) return null;
  return (
    <div className="hidden md:block border-t border-border">
      <nav aria-label="Categories" className="container mx-auto px-6 md:px-12 flex gap-6 overflow-x-auto whitespace-nowrap py-2 font-mono text-xs [scrollbar-width:none]">
        {top.map((c) => (
          <Link key={c.id} href={`/marketplace/browse?category=${encodeURIComponent(c.id)}`} className="text-muted-foreground hover:text-primary transition-colors">
            {c.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
