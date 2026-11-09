import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import MarketplaceLayout from '@/components/marketplace/layout';
import { useAuth } from '@/lib/marketplace/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const emailSchema = z.string().trim().email('Enter a valid email address');
const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  username: z.string().trim().regex(/^[a-z0-9_]{3,20}$/, 'Username: 3-20 chars, lowercase letters, numbers, underscore'),
  email: emailSchema,
  role: z.enum(['buyer', 'seller']),
});

const DEMOS = [
  { email: 'buyer@demo.test', label: 'Demo buyer', hint: 'Browse and hire' },
  { email: 'seller@demo.test', label: 'Demo seller', hint: 'Manage gigs and orders' },
  { email: 'admin@demo.test', label: 'Demo admin', hint: 'Moderation and disputes' },
];

function safeNext(): string {
  const n = new URLSearchParams(window.location.search).get('next');
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/marketplace';
}

const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.');
const FieldError = ({ msg }: { msg?: string }) => (msg ? <p role="alert" className="text-xs text-destructive mt-1">{msg}</p> : null);

export default function MarketAuth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<'signin' | 'join'>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ displayName: '', username: '', email: '', role: 'buyer' as 'buyer' | 'seller' });

  useEffect(() => {
    if (!loading && user && !busy) navigate(safeNext(), { replace: true });
  }, [loading, user, busy, navigate]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      navigate(safeNext(), { replace: true });
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  }

  const onSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const r = emailSchema.safeParse(email);
    if (!r.success) return setErrors({ email: r.error.issues[0].message });
    setErrors({});
    run(() => signIn(r.data.toLowerCase()));
  };

  const onJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const r = signUpSchema.safeParse({ ...form, username: form.username.trim().toLowerCase() });
    if (!r.success) {
      const out: Record<string, string> = {};
      for (const i of r.error.issues) out[String(i.path[0])] ??= i.message;
      return setErrors(out);
    }
    setErrors({});
    run(() => signUp({ ...r.data, email: r.data.email.toLowerCase() }));
  };

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-md">
        <h1 className="text-2xl font-semibold mb-1">Welcome to the marketplace</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in or join to hire talent or sell your services.</p>

        {error && <div role="alert" className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        <Tabs value={tab} onValueChange={(v) => { setTab(v as 'signin' | 'join'); setError(null); setErrors({}); }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="join">Join</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={onSignIn} noValidate className="space-y-4 mt-4">
              <div>
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} />
                <FieldError msg={errors.email} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</Button>
            </form>
          </TabsContent>

          <TabsContent value="join">
            <form onSubmit={onJoin} noValidate className="space-y-4 mt-4">
              <div>
                <Label htmlFor="j-name">Display name</Label>
                <Input id="j-name" autoComplete="name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} aria-invalid={!!errors.displayName} />
                <FieldError msg={errors.displayName} />
              </div>
              <div>
                <Label htmlFor="j-user">Username</Label>
                <Input id="j-user" autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="e.g. jane_doe" aria-invalid={!!errors.username} />
                <FieldError msg={errors.username} />
              </div>
              <div>
                <Label htmlFor="j-email">Email</Label>
                <Input id="j-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} />
                <FieldError msg={errors.email} />
              </div>
              <fieldset>
                <legend className="text-sm font-medium mb-2">I want to</legend>
                <div className="grid grid-cols-2 gap-2">
                  {([['buyer', 'Hire talent'], ['seller', 'Sell services']] as const).map(([r, label]) => (
                    <button type="button" key={r} aria-pressed={form.role === r} onClick={() => setForm({ ...form, role: r })}
                      className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${form.role === r ? 'border-primary bg-primary/10' : 'hover:bg-muted'}`}>
                      <span className="block font-medium capitalize">{r}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-8 border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-medium">Try a demo account</h2>
            <Badge variant="outline">Demo</Badge>
          </div>
          <div className="grid gap-2">
            {DEMOS.map((d) => (
              <Button key={d.email} type="button" variant="outline" disabled={busy} className="justify-between h-auto py-2" onClick={() => run(() => signIn(d.email))}>
                <span className="font-medium">{d.label}</span>
                <span className="text-xs text-muted-foreground font-normal">{d.hint}</span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Demo accounts use sample data stored in your browser. No password needed.</p>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
