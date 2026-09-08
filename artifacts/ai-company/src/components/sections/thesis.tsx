import { motion } from 'framer-motion';
import { Target, ShieldAlert, Cpu } from 'lucide-react';

const thesisPoints = [
  {
    icon: Target,
    title: "Precision over Generalization",
    description: "Off-the-shelf models dilute your edge. We train bespoke architectures on your proprietary data streams to solve your specific operational bottlenecks with surgical accuracy."
  },
  {
    icon: ShieldAlert,
    title: "Absolute Sovereignty",
    description: "Your data is your moat. We deploy entirely within your VPC or bare-metal infrastructure. No API calls to third parties. Zero data leakage."
  },
  {
    icon: Cpu,
    title: "Agentic Autonomy",
    description: "Moving beyond chat interfaces to autonomous networks. We build systems that observe, reason, and execute complex multi-step workflows without human intervention."
  }
];

export default function Thesis() {
  return (
    <section id="thesis" className="py-32 relative border-t border-border bg-background z-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Our Thesis</h2>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-8 leading-tight">
                General AI is a commodity. <br />
                <span className="text-muted-foreground">Specific AI is an unfair advantage.</span>
              </h3>
              <p className="text-muted-foreground font-mono leading-relaxed text-sm md:text-base">
                The next era of enterprise value isn't about using the same chat interfaces as your competitors. It's about fundamentally rewiring how your organization makes decisions, processes information, and executes tasks. Turtledove Labs builds the underlying intelligence infrastructure that makes this possible.
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col gap-12">
            {thesisPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <motion.div 
                  key={index}
                  className="flex gap-6"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 flex items-center justify-center border border-primary/20 bg-primary/5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-3">{point.title}</h4>
                    <p className="text-muted-foreground font-mono text-sm leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
