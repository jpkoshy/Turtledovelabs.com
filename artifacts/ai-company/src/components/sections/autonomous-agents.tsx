import { motion } from 'framer-motion';
import agentsImg from '../../../attached_assets/generated_images/autonomous-agents.jpg';
import { Button } from '@/components/ui/button';

export default function AutonomousAgents() {
  return (
    <section className="py-32 relative border-t border-border bg-background overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1 relative"
          >
            <div className="absolute -inset-4 bg-accent/20 blur-[100px] z-0 rounded-full" />
            <div className="relative z-10 aspect-square md:aspect-[4/3] border border-border bg-card p-2">
              <div className="w-full h-full relative overflow-hidden">
                <img 
                  src={agentsImg} 
                  alt="Autonomous Agent Network" 
                  className="w-full h-full object-cover grayscale-[20%] contrast-125 mix-blend-lighten"
                />
                <div className="absolute inset-0 border border-accent/20" />
                
                {/* Node pulses */}
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`
                    }}
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.5
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Code snippet overlay */}
            <div className="absolute -left-4 -bottom-8 md:left-8 bg-card border border-border p-4 shadow-xl z-20 w-64 md:w-80">
              <div className="flex gap-2 mb-3 border-b border-border pb-2">
                <div className="w-2 h-2 rounded-full bg-destructive/80" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                <div className="w-2 h-2 rounded-full bg-green-500/80" />
              </div>
              <pre className="font-mono text-[10px] text-muted-foreground overflow-hidden">
                <code className="text-accent">{'>'} agent.initialize()</code><br/>
                {'[sys]'} loading sub-routines...<br/>
                {'[sys]'} acquiring target metrics...<br/>
                {'[exec]'} deploying parallel workers<br/>
                <code className="text-primary animate-pulse">{'[status]'} autonomous mode active_</code>
              </pre>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-border bg-card">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Module 03</span>
            </div>
            
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
              Workflows that <span className="text-gradient">execute themselves.</span>
            </h3>
            
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Move past conversational AI. We engineer specialized agent swarms that hook into your ERP, CRM, and internal databases to autonomously execute complex, multi-step processes 24/7.
            </p>
            
            <Button variant="outline" className="mt-4" asChild>
              <a href="mailto:hello@turtledovelabs.com?subject=Workflow%20Automation">Discuss a Workflow</a>
            </Button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
