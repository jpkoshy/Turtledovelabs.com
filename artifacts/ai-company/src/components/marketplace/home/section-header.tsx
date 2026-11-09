import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

export function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 font-mono text-xs uppercase text-primary hover:underline">
          {linkLabel ?? 'See all'} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
