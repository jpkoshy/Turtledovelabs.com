import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { User } from '@/lib/marketplace/types';
import { useAdminUsers } from './hooks';

export function UsersTab({ me }: { me: User | null }) {
  const { data, isLoading } = useAdminUsers(me);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No users found.</p>;
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Level</TableHead><TableHead>Joined</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {data.map((u) => (
            <TableRow key={u.id}>
              <TableCell><Link href={`/marketplace/seller/${u.username}`} className="hover:underline">{u.displayName}</Link><div className="text-xs text-muted-foreground">@{u.username}</div></TableCell>
              <TableCell className="text-xs">{u.email}</TableCell>
              <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
              <TableCell className="text-xs">{u.level}</TableCell>
              <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
