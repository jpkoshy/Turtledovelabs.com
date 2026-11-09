import type { ReactNode } from 'react';
import MarketplaceHeader from './shell/header';
import MarketplaceFooter from './shell/footer';

export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketplaceHeader />
      <main className="flex-1">{children}</main>
      <MarketplaceFooter />
    </div>
  );
}
