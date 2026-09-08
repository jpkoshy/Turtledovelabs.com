import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    title: 'Architecture Review',
    description: 'A working session to map your current workflows, data sources, and the specific bottleneck you want solved. No cost, no commitment.',
  },
  {
    number: '02',
    title: 'Pilot',
    description: 'A scoped, time-boxed build against one real use case — usually the fastest way to prove the approach before expanding it.',
  },
  {
    number: '03',
    title: 'Deployment',
    description: 'The proven pilot moves into your production environment — VPC, on-prem, or air-gapped — with monitoring and handoff documentation.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 border-t border-border bg-card/40 relative overflow-hidden">
      <div className="absolute inset-0 bg-electric-grid opacity-10 pointer-events-none" />
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">How It Works</h2>
          <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
            A bounded path from <span className="text-gradient">problem to production.</span>
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {steps.map((step, index) => (
            <motion.article
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="bg-background p-8 md:p-10"
            >
              <span className="font-mono text-primary text-sm">{step.number} —</span>
              <h4 className="text-2xl font-bold mt-6 mb-4">{step.title}</h4>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-10">
          <Button size="lg" asChild>
            <a href="mailto:hello@turtledovelabs.com?subject=Architecture%20Review">Book an Architecture Review →</a>
          </Button>
        </div>
      </div>
    </section>
  );
}