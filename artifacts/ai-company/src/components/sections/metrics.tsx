import { motion } from 'framer-motion';

const metrics = [
  { value: "47.2%", label: "Average Efficiency Gain", desc: "Across automated operational workflows" },
  { value: "<15ms", label: "Inference Latency", desc: "For edge-deployed quantized models" },
  { value: "$87.5M", label: "Capital Saved", desc: "By optimizing legacy processes in 2024" },
  { value: "0", label: "Data Breaches", desc: "Absolute guarantee with air-gapped deployments" }
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
          <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Performance Telemetry</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">
            Impact <span className="text-muted-foreground">quantified.</span>
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
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
