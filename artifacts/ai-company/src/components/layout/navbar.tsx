import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import logo from '@assets/Turtledovelabs_1786244932892.png';

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
        <Link href="/" className="flex items-center group">
          <img
            src={logo}
            alt="Turtledove Labs"
            className="h-11 w-auto object-contain bg-white rounded-md px-2 py-1 group-hover:opacity-90 transition-opacity"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-sm">
          <a href="#thesis" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Thesis</a>
          <a href="#capabilities" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Platform</a>
          <a href="#metrics" className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Impact</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" className="hidden md:inline-flex" asChild>
            <a href="#how-it-works">See How It Works</a>
          </Button>
          <Button size="sm" asChild>
            <a href="mailto:hello@turtledovelabs.com?subject=Architecture%20Review">Talk to Us</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
