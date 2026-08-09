import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ChevronRight, User, Building2, Mail, Briefcase, MessageSquare } from 'lucide-react';

interface FormData {
  name: string;
  company: string;
  email: string;
  role: string;
  message: string;
}

const EMPTY: FormData = { name: '', company: '', email: '', role: '', message: '' };

interface FieldProps {
  label: string;
  icon: React.ElementType;
  id: keyof FormData;
  type?: string;
  placeholder: string;
  multiline?: boolean;
  value: string;
  onChange: (id: keyof FormData, val: string) => void;
  error?: string;
}

function Field({ label, icon: Icon, id, type = 'text', placeholder, multiline, value, onChange, error }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-[10px] uppercase tracking-widest text-primary flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(id, e.target.value)}
          className={`w-full bg-card border ${error ? 'border-destructive' : 'border-border focus:border-primary'} px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(id, e.target.value)}
          className={`w-full bg-card border ${error ? 'border-destructive' : 'border-border focus:border-primary'} px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors`}
        />
      )}
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContactModal({ open, onOpenChange }: ContactModalProps) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (id: keyof FormData, val: string) => {
    setForm(f => ({ ...f, [id]: val }));
    if (errors[id]) setErrors(e => ({ ...e, [id]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.name.trim())    e.name    = 'Full name is required';
    if (!form.company.trim()) e.company = 'Company name is required';
    if (!form.email.trim())   e.email   = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.message.trim()) e.message = 'Tell us what you are looking to solve';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Simulate network latency — swap for a real endpoint later
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      // Reset after close animation
      setTimeout(() => {
        setForm(EMPTY);
        setErrors({});
        setSubmitted(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] border-border bg-background p-0 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,119,255,0.8)]" />
              <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Initialize Protocol</span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Start a Conversation
            </DialogTitle>
            <DialogDescription className="font-mono text-sm text-muted-foreground leading-relaxed mt-1">
              Tell us about your AI challenge. Our engineering team will respond within one business day.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center py-8 gap-5"
              >
                <div className="w-16 h-16 flex items-center justify-center border border-primary/30 bg-primary/10 shadow-[0_0_32px_rgba(0,119,255,0.2)]">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Request Received</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-sm">
                    We have logged your submission, {form.name.split(' ')[0]}. An engineer will reach out to <span className="text-foreground">{form.email}</span> within one business day.
                  </p>
                </div>
                <div className="w-full border border-border bg-card p-4 text-left space-y-2">
                  <p className="font-mono text-[10px] text-primary uppercase tracking-widest mb-3">Submission Summary</p>
                  {[
                    { label: 'Name',    val: form.name },
                    { label: 'Company', val: form.company },
                    { label: 'Email',   val: form.email },
                    { label: 'Role',    val: form.role || '—' },
                  ].map(r => (
                    <div key={r.label} className="flex gap-3">
                      <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0 pt-px">{r.label}</span>
                      <span className="font-mono text-xs text-foreground">{r.val}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => handleClose(false)}
                >
                  Close
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name"    icon={User}         id="name"    placeholder="Jane Smith"             value={form.name}    onChange={update} error={errors.name} />
                  <Field label="Company"      icon={Building2}    id="company" placeholder="Acme Corp"              value={form.company} onChange={update} error={errors.company} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Work Email"   icon={Mail}         id="email"   placeholder="jane@acme.com" type="email" value={form.email} onChange={update} error={errors.email} />
                  <Field label="Role (optional)" icon={Briefcase} id="role"    placeholder="Head of Engineering"   value={form.role}    onChange={update} />
                </div>
                <Field
                  label="What are you looking to solve?"
                  icon={MessageSquare}
                  id="message"
                  placeholder="Describe your AI challenge, current stack, and what outcomes matter most..."
                  multiline
                  value={form.message}
                  onChange={update}
                  error={errors.message}
                />

                <div className="flex items-center justify-between pt-2">
                  <p className="font-mono text-[10px] text-muted-foreground">
                    No commitment required. We respond within 24 h.
                  </p>
                  <Button type="submit" className="gap-2 font-mono text-xs" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
