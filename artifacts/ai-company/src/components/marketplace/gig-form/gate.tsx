import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/marketplace/auth-context';
import MarketplaceLayout from '@/components/marketplace/layout';

/** Requires a signed-in seller (or admin); otherwise redirects to /marketplace/auth. */
export function SellerGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const allowed = !!user && (user.role === 'seller' || user.role === 'admin');
  useEffect(() => {
    if (!loading && !allowed) navigate('/marketplace/auth');
  }, [loading, allowed, navigate]);
  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        {loading || !allowed ? <p className="text-sm text-muted-foreground font-mono">Checking access…</p> : children}
      </div>
    </MarketplaceLayout>
  );
}
