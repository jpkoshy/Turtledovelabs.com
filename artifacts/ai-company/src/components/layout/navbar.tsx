import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContact } from '@/components/contact-provider';
import logo from '@/assets/logo.svg';

export const NAV_LINKS = [
  { href: '/#thesis', label: 'Thesis' },
  { href: '/#capabilities', label: 'Platform' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/architecture', label: 'Architecture' },
];

export function NavLink({ href, label, className, onClick }: { href: string; label: string; className?: string; onClick?: () => void }) {
  // Section anchors are plain links so the browser scrolls to them, including
  // from another route; real routes go through the client-side router.
  if (href.startsWith('/#')) {
    return <a href={href} className={className} onClick={onClick}>{label}</a>;
  }
  return <Link href={href} className={className} onClick={onClick}>{label}</Link>;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openContact = useContact();

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
        scrolled || menuOpen ? 'bg-background/90 backdrop-blur-md border-border py-4' : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center group shrink-0" aria-label="Turtledove Labs home">
          <img
            src={logo}
            alt="Turtledove Labs"
            width={387}
            height={96}
            className="h-9 md:h-10 w-auto group-hover:opacity-90 transition-opacity"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 font-mono text-sm" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
            />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => openContact('navbar')}>
            Talk to Us
          </Button>
          <button
            type="button"
            className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden container mx-auto px-6 md:px-12 pt-4 flex flex-col font-mono text-sm" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              {...link}
              onClick={() => setMenuOpen(false)}
              className="py-3 border-t border-border text-muted-foreground hover:text-primary uppercase tracking-widest"
            />
          ))}
        </nav>
      )}
    </header>
  );
}
