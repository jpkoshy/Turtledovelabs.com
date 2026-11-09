import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [, navigate] = useLocation();
  if (loading) return <div className="h-8 w-20" />;
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="font-mono" asChild><Link href="/marketplace/auth">Sign in</Link></Button>
        <Button size="sm" className="font-mono" asChild><Link href="/marketplace/auth?mode=join">Join</Link></Button>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
            <AvatarFallback className="font-mono text-xs">{user.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">{user.displayName}</div>
          <div className="text-xs font-normal text-muted-foreground font-mono">@{user.username} · {user.role}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/marketplace/dashboard/buyer')}>Buyer dashboard</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/marketplace/dashboard/seller')}>Seller dashboard</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/marketplace/orders')}>Orders</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/marketplace/inbox')}>Inbox</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(`/marketplace/seller/${user.username}`)}>My profile</DropdownMenuItem>
        {user.role === 'admin' && <DropdownMenuItem onSelect={() => navigate('/marketplace/admin')}>Admin</DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={async () => { await signOut(); navigate('/marketplace'); }}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
