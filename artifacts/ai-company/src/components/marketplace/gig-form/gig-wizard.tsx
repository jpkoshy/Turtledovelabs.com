import { useState } from 'react';
import { Link } from 'wouter';
import { useForm, useFieldArray, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/marketplace/api';
import { formatPrice } from '@/lib/marketplace/format';
import type { Gig } from '@/lib/marketplace/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { gigFormSchema, defaultValues, gigToForm, formToGigInput, STEPS, parseTags, type GigFormInput, type GigFormValues } from './schema';

function Err({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="text-xs text-destructive mt-1">{msg}</p> : null;
}
function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <Err msg={error} />
    </div>
  );
}

export default function GigWizard({ gig }: { gig?: Gig }) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<Gig | null>(null);
  const [submitError, setSubmitError] = useState('');
  const { data: categories = [] } = useQuery({ queryKey: ['mp', 'categories'], queryFn: () => api.listCategories() });

  const form = useForm<GigFormInput, unknown, GigFormValues>({
    resolver: zodResolver(gigFormSchema),
    defaultValues: gig ? gigToForm(gig) : defaultValues(),
    mode: 'onTouched',
  });
  const { register, control, trigger, handleSubmit, watch, formState: { errors } } = form;
  const faqs = useFieldArray({ control, name: 'faqs' });
  const images = useFieldArray({ control, name: 'images' });

  const save = useMutation({
    mutationFn: async ({ values, status }: { values: GigFormValues; status: 'draft' | 'active' }) => {
      const input = formToGigInput(values, status);
      return gig ? api.updateGig(gig.id, input) : api.createGig(input);
    },
    onSuccess: (g) => {
      setSaved(g);
      qc.invalidateQueries({ queryKey: ['mp'] });
    },
    onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Could not save gig'),
  });

  const submit = (status: 'draft' | 'active') => {
    setSubmitError('');
    if (status === 'draft') {
      // drafts only need the basics, but must still parse; validate everything the schema requires
      void handleSubmit((values) => save.mutate({ values, status }), () => setSubmitError('Please fix the highlighted fields on earlier steps before saving.'))();
    } else {
      void handleSubmit((values) => save.mutate({ values, status }), () => setSubmitError('Some steps have errors. Go back and fix them to publish.'))();
    }
  };

  const next = async () => {
    const fields = STEPS[step].fields as readonly string[];
    const ok = fields.length === 0 || (await trigger(fields as FieldPath<GigFormInput>[]));
    if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if (saved) {
    return (
      <Card className="p-8 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-xl font-semibold">{saved.status === 'active' ? 'Your gig is live' : 'Draft saved'}</h2>
        <p className="text-sm text-muted-foreground">{saved.title}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {saved.status === 'active' && <Button asChild><Link href={`/marketplace/gig/${saved.slug}`}>View gig</Link></Button>}
          <Button asChild variant="outline"><Link href={`/marketplace/sell/${saved.id}/edit`} onClick={() => setSaved(null)}>Keep editing</Link></Button>
          <Button asChild variant="outline"><Link href="/marketplace/dashboard/seller">Seller dashboard</Link></Button>
        </div>
      </Card>
    );
  }

  const values = watch();
  const pkgErr = errors.packages;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6" noValidate>
      <ol className="flex flex-wrap gap-2 text-xs font-mono" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`px-3 py-1.5 rounded border ${i === step ? 'bg-primary text-primary-foreground border-primary' : i < step ? 'border-primary/50 text-foreground' : 'text-muted-foreground'}`}
            >
              {i + 1}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      <Card className="p-5 sm:p-6 space-y-5">
        {step === 0 && (
          <>
            <Field label="Gig title" error={errors.title?.message} hint="e.g. I will build an AI agent that automates your support inbox">
              <Input {...register('title')} maxLength={80} placeholder="I will…" />
            </Field>
            <Field label="Category" error={errors.categoryId?.message}>
              <select {...register('categoryId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" error={errors.tagsText?.message} hint="Up to 5, comma separated">
              <Input {...register('tagsText')} placeholder="chatbot, automation, openai" />
            </Field>
          </>
        )}

        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-3">
            {(['basic', 'standard', 'premium'] as const).map((tier, i) => {
              const e = pkgErr?.[i];
              return (
                <div key={tier} className="space-y-3 rounded-lg border p-4">
                  <h3 className="font-mono text-sm uppercase tracking-wide">{tier}</h3>
                  <Field label="Package name" error={e?.name?.message}><Input {...register(`packages.${i}.name`)} /></Field>
                  <Field label="Description" error={e?.description?.message}><Textarea rows={3} {...register(`packages.${i}.description`)} /></Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Price ($)" error={e?.price?.message}><Input type="number" min={5} step="1" {...register(`packages.${i}.price`)} /></Field>
                    <Field label="Days" error={e?.deliveryDays?.message}><Input type="number" min={1} {...register(`packages.${i}.deliveryDays`)} /></Field>
                    <Field label="Revisions" error={e?.revisions?.message}><Input type="number" min={0} {...register(`packages.${i}.revisions`)} /></Field>
                  </div>
                  <Field label="Features" hint="One per line" error={e?.featuresText?.message}><Textarea rows={4} {...register(`packages.${i}.featuresText`)} /></Field>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <>
            <Field label="Description" error={errors.description?.message} hint="What you deliver, your process, what you need from buyers (50+ chars)">
              <Textarea rows={8} {...register('description')} />
            </Field>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>FAQ (optional)</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => faqs.append({ question: '', answer: '' })} disabled={faqs.fields.length >= 10}>
                  <Plus className="h-4 w-4 mr-1" /> Add question
                </Button>
              </div>
              {faqs.fields.map((f, i) => (
                <div key={f.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Question" aria-label={`FAQ ${i + 1} question`} {...register(`faqs.${i}.question`)} />
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove FAQ" onClick={() => faqs.remove(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Err msg={errors.faqs?.[i]?.question?.message} />
                  <Textarea rows={2} placeholder="Answer" aria-label={`FAQ ${i + 1} answer`} {...register(`faqs.${i}.answer`)} />
                  <Err msg={errors.faqs?.[i]?.answer?.message} />
                </div>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Gallery image URLs (up to 6)</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => images.append({ url: '' })} disabled={images.fields.length >= 6}>
                <Plus className="h-4 w-4 mr-1" /> Add image
              </Button>
            </div>
            {images.fields.length === 0 && <p className="text-sm text-muted-foreground">No images yet. Add a link to a hosted image (https://…). You can skip this and add later.</p>}
            {images.fields.map((f, i) => {
              const url = values.images?.[i]?.url;
              return (
                <div key={f.id} className="space-y-1">
                  <div className="flex gap-2 items-center">
                    {url && /^https?:\/\//.test(url) && <img src={url} alt="" className="h-10 w-14 rounded object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />}
                    <Input placeholder="https://…" aria-label={`Image ${i + 1} URL`} {...register(`images.${i}.url`)} />
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove image" onClick={() => images.remove(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Err msg={errors.images?.[i]?.url?.message} />
                </div>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review & publish</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-[140px_1fr]">
              <dt className="text-muted-foreground">Title</dt><dd>{values.title || '—'}</dd>
              <dt className="text-muted-foreground">Category</dt><dd>{categories.find((c) => c.id === values.categoryId)?.name ?? '—'}</dd>
              <dt className="text-muted-foreground">Tags</dt><dd>{parseTags(values.tagsText ?? '').join(', ') || '—'}</dd>
              <dt className="text-muted-foreground">Packages</dt>
              <dd>{(values.packages ?? []).map((p) => `${p.name}: ${formatPrice(Math.round(Number(p.price) * 100) || 0)} / ${p.deliveryDays}d`).join('  ·  ')}</dd>
              <dt className="text-muted-foreground">FAQs</dt><dd>{values.faqs?.length ?? 0}</dd>
              <dt className="text-muted-foreground">Images</dt><dd>{values.images?.length ?? 0}</dd>
            </dl>
            <p className="text-xs text-muted-foreground">Publishing makes the gig visible in the marketplace. Drafts stay private. A 20% platform fee applies to orders.</p>
          </div>
        )}
      </Card>

      {submitError && <Alert variant="destructive"><AlertDescription>{submitError}</AlertDescription></Alert>}

      <div className="flex flex-wrap gap-3 justify-between">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</Button>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={save.isPending} onClick={() => submit('draft')}>Save draft</Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>Next</Button>
          ) : (
            <Button type="button" disabled={save.isPending} onClick={() => submit('active')}>{save.isPending ? 'Saving…' : gig?.status === 'active' ? 'Update & publish' : 'Publish gig'}</Button>
          )}
        </div>
      </div>
    </form>
  );
}
