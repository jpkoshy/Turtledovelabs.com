import { Link } from 'wouter';
import MarketplaceLayout from '@/components/marketplace/layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/marketplace/auth-context';
import { DisputesTab, GigModerationTab, OverviewTab, UsersTab } from '@/components/marketplace/admin';

export default function MarketAdmin() {
  const { user, loading } = useAuth();
  let body;
  if (loading) body = <Skeleton className="h-64 w-full" />;
  else if (!user || user.role !== 'admin') {
    body = (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Admins only</h1>
        <p className="text-sm text-muted-foreground">{user ? 'Your account does not have admin access.' : 'Sign in with an admin account to continue.'}</p>
        <Button asChild><Link href={user ? '/marketplace' : '/marketplace/auth'}>{user ? 'Back to marketplace' : 'Sign in'}</Link></Button>
      </div>
    );
  } else {
    body = (
      <>
        <h1 className="mb-6 text-2xl font-semibold">Admin</h1>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="gigs">Gig moderation</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab me={user} /></TabsContent>
          <TabsContent value="gigs"><GigModerationTab /></TabsContent>
          <TabsContent value="disputes"><DisputesTab /></TabsContent>
          <TabsContent value="users"><UsersTab me={user} /></TabsContent>
        </Tabs>
      </>
    );
  }
  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 py-10 sm:px-6">{body}</div>
    </MarketplaceLayout>
  );
}
