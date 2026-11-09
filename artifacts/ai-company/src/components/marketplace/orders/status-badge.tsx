import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/marketplace/types';

const STYLE: Record<OrderStatus, string> = {
  pending: 'border-yellow-500/40 text-yellow-500',
  active: 'border-blue-500/40 text-blue-400',
  delivered: 'border-purple-500/40 text-purple-400',
  revision: 'border-orange-500/40 text-orange-400',
  completed: 'border-green-500/40 text-green-500',
  cancelled: 'border-muted-foreground/40 text-muted-foreground',
  disputed: 'border-red-500/40 text-red-500',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant="outline" className={`font-mono capitalize ${STYLE[status]}`}>{status}</Badge>;
}
