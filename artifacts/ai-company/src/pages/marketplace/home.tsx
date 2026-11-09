import MarketplaceLayout from '@/components/marketplace/layout';
import { Hero, CategoryGrid, PopularGigs, TopSellers, HowItWorks, TrustStrip, SellerCta } from '@/components/marketplace/home';

export default function MarketplaceHome() {
  return (
    <MarketplaceLayout>
      <Hero />
      <CategoryGrid />
      <PopularGigs />
      <TopSellers />
      <TrustStrip />
      <HowItWorks />
      <SellerCta />
    </MarketplaceLayout>
  );
}
