import logo from '@/assets/logo.svg';
import { NAV_LINKS, NavLink } from '@/components/layout/navbar';
import { CONTACT_EMAIL } from '@/lib/contact';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-background pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-electric-grid opacity-20 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16 mb-16">
          <div>
            <div className="mb-6">
              <img src={logo} alt="Turtledove Labs" width={387} height={96} className="h-10 w-auto" />
            </div>
            <p className="text-muted-foreground font-mono text-xs leading-relaxed mb-6">
              Custom AI infrastructure, designed and deployed inside your own environment.
            </p>
          </div>

          <nav aria-label="Footer">
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-5">Explore</h4>
            <ul className="space-y-3 font-mono text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <NavLink {...link} className="text-muted-foreground hover:text-primary transition-colors" />
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:text-right">
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-5">Start a Conversation</h4>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-xl md:text-2xl font-bold hover:text-primary transition-colors break-all">
              {CONTACT_EMAIL}
            </a>
            <p className="mt-4 text-muted-foreground font-mono text-xs leading-relaxed">
              Tell us which workflow, decision, or document set is slowing your team down.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground font-mono text-xs">
            © {new Date().getFullYear()} Turtledove Labs. All systems described are custom-engineered per client; capabilities vary by engagement scope.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)] animate-pulse" />
            <span className="font-mono text-xs text-primary uppercase tracking-widest">Accepting pilot engagements</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
