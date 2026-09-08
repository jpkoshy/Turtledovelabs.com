import { motion } from 'framer-motion';
import dataImg from '../../../attached_assets/generated_images/data-intelligence.jpg';

export default function DataIntelligence() {
  return (
    <section className="py-32 relative border-t border-border bg-background/50 overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 border border-border bg-card">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Module 02</span>
            </div>
            
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
              Data pipelines that <span className="text-gradient">actually scale.</span>
            </h3>
            
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Transform chaotic, unstructured enterprise data into high-signal vector representations. We build the ingestion, embedding, and retrieval infrastructure required for production-grade AI.
            </p>
            
            <div className="grid grid-cols-2 gap-8 mt-12">
              <div>
                <div className="text-primary text-3xl font-bold font-mono mb-2">&lt; 10ms</div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Retrieval Latency</div>
              </div>
              <div>
                <div className="text-primary text-3xl font-bold font-mono mb-2">99.9%</div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Semantic Accuracy</div>
              </div>
              <div>
                <div className="text-primary text-3xl font-bold font-mono mb-2">PBs</div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Scale Capacity</div>
              </div>
              <div>
                <div className="text-primary text-3xl font-bold font-mono mb-2">Zero</div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Data Leakage</div>
              </div>
            </div>
            <p className="mt-8 border-l border-primary/40 pl-4 text-muted-foreground font-mono text-sm leading-relaxed">
              A first engagement here usually starts with a single high-volume document set — support tickets, internal wikis, or contracts — rather than your entire data estate.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-secondary/20 blur-[100px] z-0 rounded-full" />
            <div className="relative z-10 aspect-square md:aspect-[4/3] border border-border bg-card p-2">
              <div className="w-full h-full relative overflow-hidden">
                <img 
                  src={dataImg} 
                  alt="Data Intelligence Streams" 
                  className="w-full h-full object-cover grayscale-[20%] contrast-125 mix-blend-lighten"
                />
                <div className="absolute inset-0 border border-secondary/20" />
                
                {/* Simulated data flowing overlay */}
                <div className="absolute inset-0 flex flex-col justify-between py-8 opacity-30">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      className="h-[1px] w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ 
                        duration: 3 + Math.random() * 2, 
                        repeat: Infinity, 
                        delay: Math.random() * 2,
                        ease: "linear"
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
