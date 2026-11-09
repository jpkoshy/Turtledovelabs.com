import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import logo from '@assets/Turtledovelabs_1786244932892.png';
import CategoryBar from './category-bar';
import NotificationBell from './notification-bell';
import UserMenu from './user-menu';

const NAV = [
  { href: '/marketplace/orders', label: 'Orders' },
  { href: '/marketplace/inbox', label: 'Inbox' },
  { href: '/marketplace/sell/new', label: 'Sell' },
];

export default function MarketplaceHeader() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data: cats = [] } = useQuery({ queryKey: ['mp', 'categories'], queryFn: () => api.listCategories(), staleTime: 5 * 60_000 });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate(`/marketplace/browse?q=${encodeURIComponent(q.trim())}`);
  };

  const searchBox = (
    <form onSubmit={submit} role="search" className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services (e.g. chatbot, data pipeline)" aria-label="Search services" className="pl-9 font-mono text-sm" />
    </form>
  );

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-12 h-16 flex items-center gap-3 md:gap-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader><SheetTitle className="font-mono uppercase tracking-widest text-sm">Marketplace</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-6 px-4 pb-6 font-mono text-sm">
              {searchBox}
              <div className="flex flex-col gap-3">
                {NAV.map((n) => <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>)}
                {user && <Link href="/marketplace/dashboard/buyer" onClick={() => setOpen(false)}>Dashboard</Link>}
                {!user && <Link href="/marketplace/auth" onClick={() => setOpen(false)}>Sign in / Join</Link>}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Categories</div>
                <div className="flex flex-col gap-2">
                  {cats.filter((c) => !c.parentId).map((c) => (
                    <Link key={c.id} href={`/marketplace/browse?category=${encodeURIComponent(c.id)}`} onClick={() => setOpen(false)} className="text-muted-foreground">{c.name}</Link>
                  ))}
                </div>
              </div>
              <Link href="/" onClick={() => setOpen(false)} className="block text-muted-foreground">← Turtledove Labs</Link>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/marketplace" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="Turtledove Labs" className="h-8 w-auto bg-white rounded-md px-1.5 py-0.5" />
          <span className="hidden sm:inline font-mono text-xs uppercase tracking-widest text-primary">Marketplace</span>
        </Link>

        <div className="hidden md:block flex-1 max-w-xl">{searchBox}</div>

        <nav className="hidden md:flex items-center gap-5 font-mono text-sm ml-auto">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="text-muted-foreground hover:text-primary transition-colors">{n.label}</Link>)}
        </nav>

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
      <CategoryBar />
    </header>
  );
}
