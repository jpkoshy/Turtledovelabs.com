import { motion } from 'framer-motion';
import customModelsImg from '../../../attached_assets/generated_images/custom-models.jpg';

export default function CustomModels() {
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
            <div className="absolute -inset-4 bg-primary/20 blur-[100px] z-0 rounded-full" />
            <div className="relative z-10 aspect-square md:aspect-[4/3] border border-border bg-card p-2">
              <div className="w-full h-full relative overflow-hidden">
                <img 
                  src={customModelsImg} 
                  alt="Custom AI Models Architecture" 
                  className="w-full h-full object-cover grayscale-[20%] contrast-125 mix-blend-lighten"
                />
                <div className="absolute inset-0 border border-primary/20" />
                {/* Overlay Scanning Line */}
                <motion.div 
                  className="absolute left-0 right-0 h-1 bg-primary/50 shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </div>
            
            {/* Tech stats floating */}
            <div className="absolute -right-8 -bottom-8 bg-card border border-border p-4 shadow-xl z-20 font-mono text-xs">
              <div className="flex justify-between items-center gap-8 mb-2">
                <span className="text-muted-foreground">Parameters</span>
                <span className="text-primary">70B+</span>
              </div>
              <div className="flex justify-between items-center gap-8 mb-2">
                <span className="text-muted-foreground">Context Window</span>
                <span className="text-primary">128k</span>
              </div>
              <div className="flex justify-between items-center gap-8">
                <span className="text-muted-foreground">Fine-tuning</span>
                <span className="text-primary">LoRA/QLoRA</span>
              </div>
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
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Module 01</span>
            </div>
            
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
              Models that <span className="text-gradient">speak your language.</span>
            </h3>
            
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              We don't prompt-engineer generic models. We fundamentally alter their weights to understand your domain-specific taxonomy, internal documentation, and operational protocols.
            </p>
            
            <ul className="space-y-6">
              {[
                "Continuous pre-training on proprietary corpora",
                "Domain-specific RLHF (Reinforcement Learning from Human Feedback)",
                "Quantized deployment for edge inferencing"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-1.5 w-1.5 h-1.5 bg-primary shrink-0 rounded-full shadow-[0_0_5px_rgba(0,255,255,0.8)]" />
                  <span className="text-sm font-mono text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-l border-primary/40 pl-4 text-muted-foreground font-mono text-sm leading-relaxed">
              A first engagement here is typically scoped around one well-defined task — for example, classifying inbound requests using your existing taxonomy — before expanding to broader fine-tuning.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
