import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import Home from '@/pages/home';
import Architecture from '@/pages/architecture';
import { AuthProvider } from '@/lib/marketplace/auth-context';
import MarketplaceHome from '@/pages/marketplace/home';
import Browse from '@/pages/marketplace/browse';
import GigDetail from '@/pages/marketplace/gig';
import SellerProfile from '@/pages/marketplace/seller';
import SellNew from '@/pages/marketplace/sell-new';
import SellEdit from '@/pages/marketplace/sell-edit';
import Checkout from '@/pages/marketplace/checkout';
import Orders from '@/pages/marketplace/orders';
import OrderDetail from '@/pages/marketplace/order-detail';
import Inbox from '@/pages/marketplace/inbox';
import SellerDashboard from '@/pages/marketplace/seller-dashboard';
import BuyerDashboard from '@/pages/marketplace/buyer-dashboard';
import MarketAuth from '@/pages/marketplace/auth';
import MarketAdmin from '@/pages/marketplace/admin';

const queryClient = new QueryClient();

function ScrollToTop() {
  const [pathname] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/architecture" component={Architecture} />
        <Route path="/marketplace" component=MarketplaceHome />
        <Route path="/marketplace/browse" component=Browse />
        <Route path="/marketplace/gig/:slug" component=GigDetail />
        <Route path="/marketplace/seller/:username" component=SellerProfile />
        <Route path="/marketplace/sell/new" component=SellNew />
        <Route path="/marketplace/sell/:id/edit" component=SellEdit />
        <Route path="/marketplace/checkout/:gigId/:tier" component=Checkout />
        <Route path="/marketplace/orders" component=Orders />
        <Route path="/marketplace/orders/:id" component=OrderDetail />
        <Route path="/marketplace/inbox" component=Inbox />
        <Route path="/marketplace/dashboard/seller" component=SellerDashboard />
        <Route path="/marketplace/dashboard/buyer" component=BuyerDashboard />
        <Route path="/marketplace/auth" component=MarketAuth />
        <Route path="/marketplace/admin" component=MarketAdmin />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative">
            <div className="noise-overlay" />
            <Router />
          </div>
        </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
