import { useState } from 'react';
import { useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const POPULAR = ['AI chatbot', 'Data pipeline', 'Workflow automation', 'Prompt engineering', 'Web scraping', 'Dashboard'];

export function Hero() {
  const [q, setQ] = useState('');
  const [, navigate] = useLocation();
  const go = (term: string) => {
    const t = term.trim();
    navigate(t ? `/marketplace/browse?q=${encodeURIComponent(t)}` : '/marketplace/browse');
  };
  return (
    <section className="border-b border-border bg-gradient-to-b from-primary/10 to-transparent">
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-3xl text-center space-y-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Turtledove Marketplace</p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Hire expert AI &amp; automation talent, fixed price.</h1>
        <p className="text-muted-foreground">Browse ready-to-order gigs in three clear packages. Pay into escrow, release when delighted.</p>
        <form onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex flex-col sm:flex-row gap-2" role="search">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search gigs"
              placeholder='Try "AI chatbot for support"'
              className="h-12 w-full rounded-md border border-border bg-background pl-10 pr-3 text-base outline-none focus:border-primary"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8">Search</Button>
        </form>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Popular:</span>
          {POPULAR.map((t) => (
            <button key={t} type="button" onClick={() => go(t)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors">{t}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
