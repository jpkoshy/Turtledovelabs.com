import { motion } from 'framer-motion';
import { Database, BrainCircuit, Activity, Network, Key, TerminalSquare } from 'lucide-react';

const capabilities = [
  {
    icon: BrainCircuit,
    title: "Custom LLM Training",
    description: "Fine-tuning and full-parameter training of open-source models tailored to your industry's taxonomy and workflows."
  },
  {
    icon: Database,
    title: "Vector Infrastructure",
    description: "Enterprise-grade RAG pipelines with semantic caching, hybrid search, and sub-millisecond retrieval latency."
  },
  {
    icon: Network,
    title: "Multi-Agent Systems",
    description: "Orchestrating swarms of specialized agents to handle complex, asynchronous tasks across your organization."
  },
  {
    icon: Activity,
    title: "Predictive Intelligence",
    description: "Time-series forecasting and anomaly detection running at the edge for real-time operational insights."
  },
  {
    icon: Key,
    title: "Air-Gapped Deployment",
    description: "Zero-trust environments. Models deployed securely on-premise or within isolated cloud enclaves."
  },
  {
    icon: TerminalSquare,
    title: "API-First Architecture",
    description: "Headless intelligence. Integrate our capabilities directly into your existing software stack with comprehensive REST/gRPC endpoints."
  }
];

export default function Capabilities() {
  return (
    <section id="capabilities" className="py-32 relative border-t border-border bg-background/50">
      <div className="container mx-auto px-6 md:px-12">
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Platform Architecture</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
              Full-Stack <span className="text-gradient">Intelligence.</span>
            </h3>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 border border-border bg-card hover:bg-card/50 transition-colors glow-border flex flex-col"
              >
                <div className="mb-6 w-12 h-12 flex items-center justify-center bg-background border border-border group-hover:border-primary/50 transition-colors">
                  <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h4 className="text-xl font-bold mb-4">{cap.title}</h4>
                <p className="text-muted-foreground font-mono text-sm leading-relaxed flex-1">
                  {cap.description}
                </p>
                
                <div className="mt-8 flex items-center text-xs font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                  Explore module <span className="ml-2">→</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  );
}
