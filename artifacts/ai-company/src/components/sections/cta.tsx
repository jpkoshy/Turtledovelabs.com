import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-32 relative border-t border-border bg-card overflow-hidden">
      {/* Abstract glowing background effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-50" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-border bg-background/50 backdrop-blur-sm p-12 md:p-20 relative glow-border"
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-primary" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-primary" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary" />

            <div className="w-16 h-16 mx-auto mb-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Terminal className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Let's <span className="text-gradient">Architect It.</span>
            </h2>
            
            <p className="text-muted-foreground font-mono leading-relaxed mb-10 max-w-xl mx-auto">
              We take on a small number of engagements at a time so each one gets real attention. Start with a no-cost architecture review to see if there's a fit.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto min-w-[260px]" asChild>
                <a href="mailto:hello@turtledovelabs.com?subject=Architecture%20Review">Book an Architecture Review →</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
