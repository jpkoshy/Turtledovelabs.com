import { useState } from 'react';
import { CreditCard, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Mock payment form. Values live only in this component's local state for display
 * formatting; they are never stored, logged, or sent anywhere.
 */
export function DemoPaymentForm() {
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const fmtNumber = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };
  return (
    <fieldset className="space-y-3 rounded-lg border border-dashed p-4">
      <legend className="px-2 text-sm font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</legend>
      <p className="flex items-start gap-2 rounded-md bg-primary/10 p-2 text-xs font-medium" role="note">
        <Info className="h-4 w-4 shrink-0 mt-px" /> Demo — no real payment is taken. Card fields are optional, are not stored and are never sent anywhere.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="demo-card">Card number (optional)</Label>
        <Input id="demo-card" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={number} onChange={(e) => setNumber(fmtNumber(e.target.value))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="demo-exp">Expiry</Label>
          <Input id="demo-exp" inputMode="numeric" autoComplete="off" placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(fmtExpiry(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="demo-cvc">CVC</Label>
          <Input id="demo-cvc" inputMode="numeric" autoComplete="off" placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        </div>
      </div>
    </fieldset>
  );
}
