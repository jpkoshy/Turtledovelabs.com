import { Check } from 'lucide-react';
import type { Order } from '@/lib/marketplace/types';

const STEPS = ['Ordered', 'In progress', 'Delivered', 'Completed'] as const;

function stepIndex(o: Order): number {
  switch (o.status) {
    case 'pending': return 0;
    case 'active': case 'revision': return 1;
    case 'delivered': case 'disputed': return o.deliveries.length ? 2 : 1;
    case 'completed': return 3;
    default: return -1;
  }
}

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === 'cancelled') return <p className="text-sm text-muted-foreground font-mono">This order was cancelled.</p>;
  const cur = stepIndex(order);
  return (
    <ol className="flex items-center w-full" aria-label="Order progress">
      {STEPS.map((label, i) => {
        const done = i < cur || order.status === 'completed';
        const active = i === cur && order.status !== 'completed';
        return (
          <li key={label} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-px ${i <= cur ? 'bg-primary' : 'bg-border'}`} />}
            <span className={`relative z-10 h-6 w-6 rounded-full border flex items-center justify-center text-xs ${done ? 'bg-primary border-primary text-primary-foreground' : active ? 'border-primary text-primary bg-background' : 'border-border text-muted-foreground bg-background'}`}>
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`mt-2 text-[11px] sm:text-xs font-mono ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
