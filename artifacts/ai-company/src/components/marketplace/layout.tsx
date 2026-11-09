import type { ReactNode } from 'react';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
// STUB — owned by agent B2. Build the marketplace header (search, categories, sell, inbox, orders, user menu) and footer.
export default function MarketplaceLayout({ children }: { children: ReactNode }) {
  return (<><Navbar /><main className="flex-1 pt-24">{children}</main><Footer /></>);
}
