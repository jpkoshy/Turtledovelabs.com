import { Star } from 'lucide-react';
export function RatingStars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-primary text-primary" />
      <span className="font-semibold">{value ? value.toFixed(1) : 'New'}</span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  );
}
