import { Link } from 'wouter';

export default function MarketplaceFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row gap-4 md:items-center md:justify-between font-mono text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} Turtledove Labs Marketplace · Demo environment, no real payments</div>
        <nav className="flex flex-wrap gap-5">
          <Link href="/marketplace/browse" className="hover:text-primary">Browse</Link>
          <Link href="/marketplace/sell/new" className="hover:text-primary">Become a seller</Link>
          <Link href="/marketplace/inbox" className="hover:text-primary">Inbox</Link>
          <Link href="/" className="hover:text-primary">Turtledove Labs</Link>
        </nav>
      </div>
    </footer>
  );
}
