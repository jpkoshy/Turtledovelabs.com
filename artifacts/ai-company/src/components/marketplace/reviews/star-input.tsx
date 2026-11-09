import { useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Accessible radio-group star picker: arrow keys / Home / End change value, Tab focuses. */
export function StarInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover || value;

  const move = (next: number) => {
    const v = Math.min(5, Math.max(1, next));
    onChange(v);
    refs.current[v - 1]?.focus();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); move((value || 0) + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); move((value || 2) - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(1); }
    else if (e.key === 'End') { e.preventDefault(); move(5); }
  };

  return (
    <div className="flex items-center gap-2">
      <div role="radiogroup" aria-label="Rating" className="inline-flex gap-1" onMouseLeave={() => setHover(0)} onKeyDown={onKey}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => { refs.current[n - 1] = el; }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} – ${LABELS[n - 1]}`}
            tabIndex={value === n || (!value && n === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <Star className={cn('h-7 w-7 transition-colors', n <= shown ? 'fill-primary text-primary' : 'text-muted-foreground')} />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground" aria-live="polite">{shown ? LABELS[shown - 1] : 'Select a rating'}</span>
    </div>
  );
}
