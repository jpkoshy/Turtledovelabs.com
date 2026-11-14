import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/navbar';
import { usePageMeta } from '@/lib/page-meta';

export default function NotFound() {
  usePageMeta('Page Not Found — Turtledove Labs', '/');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-6 md:px-12 py-32">
          <p className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Error 404</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            This route <span className="text-gradient">doesn't exist.</span>
          </h1>
          <p className="font-mono text-muted-foreground max-w-xl leading-relaxed mb-10">
            The page you were looking for has moved or was never here. Head back to the overview or explore the reference architecture.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/architecture">View architecture →</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
