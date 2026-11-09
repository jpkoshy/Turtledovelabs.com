import { SellerGate } from '@/components/marketplace/gig-form/gate';
import { GigWizard } from '@/components/marketplace/gig-form';

export default function SellNew() {
  return (
    <SellerGate>
      <h1 className="text-2xl font-semibold mb-6">Create a new gig</h1>
      <GigWizard />
    </SellerGate>
  );
}
