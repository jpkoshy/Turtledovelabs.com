import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/marketplace/api';
import { useAuth } from '@/lib/marketplace/auth-context';
import { SellerGate } from '@/components/marketplace/gig-form/gate';
import { GigWizard } from '@/components/marketplace/gig-form';

function Editor({ id }: { id: string }) {
  const { user } = useAuth();
  const { data: gig, isLoading } = useQuery({ queryKey: ['mp', 'gig', id], queryFn: () => api.getGig(id) });
  if (isLoading) return <p className="text-sm text-muted-foreground font-mono">Loading gig…</p>;
  if (!gig) return <p>Gig not found.</p>;
  if (user && gig.sellerId !== user.id && user.role !== 'admin') return <p>You can only edit your own gigs.</p>;
  return <GigWizard key={gig.id} gig={gig} />;
}

export default function SellEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <SellerGate>
      <h1 className="text-2xl font-semibold mb-6">Edit gig</h1>
      <Editor id={id} />
    </SellerGate>
  );
}
