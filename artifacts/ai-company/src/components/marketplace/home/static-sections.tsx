import { Link } from 'wouter';
import { Search, CreditCard, PackageCheck, PenSquare, MessageSquare, Wallet, ShieldCheck, Lock, BadgeCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionHeader } from './section-header';

const BUY = [
  { icon: Search, t: 'Find a gig', d: 'Search or browse vetted AI, data and automation services.' },
  { icon: CreditCard, t: 'Order securely', d: 'Pick Basic, Standard or Premium. Funds are held in escrow.' },
  { icon: PackageCheck, t: 'Receive and approve', d: 'Review the delivery, request revisions, then release payment.' },
];
const SELL = [
  { icon: PenSquare, t: 'Create your gig', d: 'Describe your service and set three clear packages.' },
  { icon: MessageSquare, t: 'Get orders', d: 'Chat with buyers, gather requirements and deliver on time.' },
  { icon: Wallet, t: 'Get paid', d: 'Keep 80% of every order once the buyer approves.' },
];

function Steps({ title, steps }: { title: string; steps: typeof BUY }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h3 className="font-mono text-xs uppercase tracking-widest text-primary">{title}</h3>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><s.icon className="h-4 w-4" /></span>
            <div><p className="font-medium">{i + 1}. {s.t}</p><p className="text-sm text-muted-foreground">{s.d}</p></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="container mx-auto px-6 py-12">
      <SectionHeader title="How it works" />
      <div className="grid gap-4 md:grid-cols-2">
        <Steps title="Buying" steps={BUY} />
        <Steps title="Selling" steps={SELL} />
      </div>
    </section>
  );
}

const TRUST = [
  { icon: Lock, t: 'Escrow protection', d: 'Sellers are paid only when you approve.' },
  { icon: ShieldCheck, t: 'Dispute resolution', d: 'Our team steps in if something goes wrong.' },
  { icon: BadgeCheck, t: 'Verified reviews', d: 'Only buyers who completed an order can review.' },
  { icon: Headphones, t: 'Built-in messaging', d: 'Talk to sellers before and during every order.' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="container mx-auto px-6 py-8 grid gap-6 grid-cols-2 lg:grid-cols-4">
        {TRUST.map((x) => (
          <div key={x.t} className="flex gap-3">
            <x.icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div><p className="text-sm font-medium">{x.t}</p><p className="text-xs text-muted-foreground">{x.d}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SellerCta() {
  return (
    <section className="container mx-auto px-6 py-16">
      <div className="rounded-xl border border-primary/40 bg-primary/10 px-6 py-12 text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold">Turn your expertise into income</h2>
        <p className="mx-auto max-w-xl text-muted-foreground">List your AI, automation or data service in minutes and reach buyers looking for exactly what you do.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link href="/marketplace/sell/new">Become a seller</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/marketplace/auth">Sign in</Link></Button>
        </div>
      </div>
    </section>
  );
}
