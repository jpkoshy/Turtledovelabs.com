import logo from '@assets/Turtledovelabs_1786244932892.png';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background pt-24 pb-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-electric-grid opacity-20 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
          <div className="md:col-span-1">
            <div className="mb-6">
              <img
                src={logo}
                alt="Turtledovelabs"
                className="h-14 w-auto object-contain bg-white rounded-md px-3 py-1.5 opacity-90"
              />
            </div>
            <p className="text-muted-foreground font-mono text-xs leading-relaxed mb-6">
              Engineering intelligence for the enterprise layer. We build autonomous systems that redefine operational limits.
            </p>
          </div>
          
          <div>
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Custom Models</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Data Intelligence</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Autonomous Agents</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Infrastructure</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Research</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">System Status</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground font-mono text-xs">
            © {new Date().getFullYear()} Turtledovelabs. All rights reserved.
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
