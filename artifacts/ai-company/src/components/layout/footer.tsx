import logo from '@assets/Turtledovelabs_1786244932892.png';

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border bg-background pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-electric-grid opacity-20 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 mb-16">
          <div>
            <div className="mb-6">
              <img
                src={logo}
                alt="Turtledove Labs"
                className="h-14 w-auto object-contain bg-white rounded-md px-3 py-1.5 opacity-90"
              />
            </div>
            <p className="text-muted-foreground font-mono text-xs leading-relaxed mb-6">
              Custom AI infrastructure, designed and deployed inside your own environment.
            </p>
          </div>
          
          <div className="md:text-right md:self-end">
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-5">Start a Conversation</h4>
            <a href="mailto:hello@turtledovelabs.com" className="text-xl md:text-2xl font-bold hover:text-primary transition-colors">
              hello@turtledovelabs.com
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
            <span className="font-mono text-xs text-primary uppercase tracking-widest">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
