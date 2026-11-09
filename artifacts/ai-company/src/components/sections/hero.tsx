import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import heroBg from '../../../attached_assets/generated_images/hero-bg.jpg';
import ContactModal from '@/components/contact-modal';
import { trackEvent } from '@/lib/analytics';

export default function Hero() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <section className="relative min-h-[100dvh] flex items-center pt-20 overflow-hidden">
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} />
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBg} 
          alt="Neural Network Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        <div className="absolute inset-0 bg-electric-grid opacity-30 mix-blend-overlay" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 border border-primary/30 bg-primary/5">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
              <span className="font-mono text-xs text-primary uppercase tracking-widest">System v4.2 Online</span>
            </div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Intelligence <br />
            <span className="text-gradient">Engineered for</span> <br />
            <span className="text-gradient-primary">Scale.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-foreground font-mono max-w-3xl mb-5 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            We build custom AI systems — trained on your own data, deployed inside your own infrastructure — that automate the specific, high-volume decisions your business currently pays people to make by hand.
          </motion.p>

          <motion.p
            className="text-sm md:text-base text-muted-foreground font-mono max-w-2xl mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            Turtledove Labs designs and deploys bespoke AI models and autonomous agent networks for teams that need more than a chat interface: precision tuned to your operations, and data that never leaves your control.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-start gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <Button
              size="lg"
              className="group w-full sm:w-auto"
              onClick={() => {
                trackEvent('contact_form_opened', { location: 'hero' });
                setContactOpen(true);
              }}
            >
              Book an Architecture Review
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link
              href="/architecture"
              onClick={() => trackEvent('architecture_viewed', { location: 'hero' })}
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Architecture →
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Decorative side element */}
      <div className="hidden lg:flex absolute right-12 bottom-12 flex-col items-end gap-2 font-mono text-[10px] text-muted-foreground opacity-50">
        <span>LAT: 37.7749° N</span>
        <span>LNG: 122.4194° W</span>
        <span>STATUS: NOMINAL</span>
      </div>
    </section>
  );
}
