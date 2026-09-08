import { motion } from 'framer-motion';

const metrics = [
  { value: "<15ms", label: "Target Inference Latency", desc: "For edge-deployed quantized models, based on internal benchmarks" },
  { value: "Zero", label: "Third-Party Exposure", desc: "By design: air-gapped and VPC deployments keep data inside your infrastructure" },
  { value: "Pilot", label: "Your Engagement Here", desc: "We are taking on a small number of pilot engagements — book an architecture review to be considered" }
];

export default function Metrics() {
  return (
    <section id="metrics" className="py-32 relative border-t border-border bg-background">
      <div className="absolute inset-0 bg-electric-grid opacity-10 pointer-events-none" />
      
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">What to Expect</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">
            Built for <span className="text-muted-foreground">measurable impact.</span>
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {metrics.map((metric, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background p-8 lg:p-12 flex flex-col justify-center text-center group hover:bg-card transition-colors relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="text-5xl md:text-6xl font-bold font-sans tracking-tighter mb-4 text-gradient-primary">
                {metric.value}
              </div>
              <div className="font-mono text-sm text-foreground uppercase tracking-widest mb-2">
                {metric.label}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {metric.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
