import { useState } from 'react';
import { cn } from '@/lib/utils';

export function GigGallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return <div className="aspect-video rounded-lg border border-border bg-muted" />;
  const current = images[Math.min(idx, images.length - 1)];
  return (
    <div className="space-y-3">
      <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
        <img src={current} alt={title} className="h-full w-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={src + i} type="button" onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`}
              className={cn('h-16 w-24 shrink-0 overflow-hidden rounded-md border bg-muted', i === idx ? 'border-primary' : 'border-border opacity-70 hover:opacity-100')}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
