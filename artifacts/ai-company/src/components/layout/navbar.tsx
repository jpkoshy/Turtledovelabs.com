import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Network } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-transparent',
        scrolled ? 'bg-background/80 backdrop-blur-md border-border py-4' : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Network className="w-8 h-8 text-primary group-hover:text-primary/80 transition-colors" />
          <span className="font-sans font-bold text-xl tracking-tight text-foreground">
            NEURAL<span className="text-muted-foreground font-light">EDGE</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-sm">
          <a href="#thesis" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Thesis</a>
          <a href="#capabilities" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Platform</a>
          <a href="#metrics" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Impact</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:inline-flex">
            Client Portal
          </Button>
          <Button size="sm">
            Deploy Now
          </Button>
        </div>
      </div>
    </header>
  );
}
