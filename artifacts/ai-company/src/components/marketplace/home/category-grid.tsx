import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Bot, Code, Database, FileText, Layers, LineChart, Megaphone, Palette, PenTool, Sparkles, Workflow, Brain, type LucideIcon } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from './section-header';

const ICONS: Record<string, LucideIcon> = {
  bot: Bot, code: Code, database: Database, 'file-text': FileText, layers: Layers, 'line-chart': LineChart, megaphone: Megaphone,
  palette: Palette, 'pen-tool': PenTool, sparkles: Sparkles, workflow: Workflow, brain: Brain,
};

export function CategoryGrid() {
  const { data, isLoading } = useQuery({ queryKey: ['mp', 'categories'], queryFn: () => api.listCategories() });
  const cats = (data ?? []).filter((c) => !c.parentId);
  return (
    <section className="container mx-auto px-6 py-12">
      <SectionHeader title="Browse by category" href="/marketplace/browse" linkLabel="All gigs" />
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : cats.length === 0 ? (
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cats.map((c) => {
            const Icon = ICONS[c.icon] ?? Sparkles;
            return (
              <Link key={c.id} href={`/marketplace/browse?category=${encodeURIComponent(c.slug)}`} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center hover:border-primary transition-colors">
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
