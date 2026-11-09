import { motion } from 'framer-motion';

const stats = [
  {
    value: '39%',
    label: 'See Enterprise-Level Impact',
    desc: 'Of organizations report any enterprise-wide EBIT impact from AI, even though 88% now use it in at least one function.',
    source: 'McKinsey, State of AI 2025 (Nov 2025)',
    href: 'https://www.mckinsey.com/no/our-insights/the-state-of-ai',
  },
  {
    value: '40%+',
    label: 'Agentic Projects At Risk',
    desc: 'Of agentic AI projects are forecast to be canceled by the end of 2027, citing cost, unclear value, and weak risk controls.',
    source: 'Gartner (Jun 2025)',
    href: 'https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027',
  },
  {
    value: '56%',
    label: 'Run Inference Privately',
    desc: 'Of large enterprises run production AI inference on private cloud, as cost and data sovereignty reshape infrastructure plans.',
    source: 'Broadcom, Private Cloud Outlook 2026 (1,800 IT leaders)',
    href: 'https://www.vmware.com/docs/private-cloud-outlook-2026',
  },
  {
    value: '19.2%',
    label: 'Canadian Businesses Using AI',
    desc: 'Of Canadian businesses used AI to produce goods or deliver services in the past year, up from 12.2% a year earlier.',
    source: 'Statistics Canada, Q2 2026',
    href: 'https://www150.statcan.gc.ca/n1/pub/11-621-m/11-621-m2026010-eng.htm',
  },
];

export default function MarketContext() {
  return (
    <section id="market" className="py-32 relative border-t border-border bg-background/50">
      <div className="container mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-3xl"
        >
          <h2 className="font-mono text-primary text-xs uppercase tracking-widest mb-6">Market Context</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            Adoption is everywhere. <span className="text-muted-foreground">Results are not.</span>
          </h3>
          <p className="text-muted-foreground font-mono text-sm md:text-base leading-relaxed">
            Most organizations now use AI, but few have turned it into measurable enterprise value. The gap is rarely the model. It is scope, integration, and control over where the data lives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {stats.map((stat, i) => (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background p-8 flex flex-col"
            >
              <div className="text-5xl font-bold font-sans tracking-tighter mb-4 text-gradient-primary">
                {stat.value}
              </div>
              <div className="font-mono text-sm text-foreground uppercase tracking-widest mb-3">
                {stat.label}
              </div>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed flex-1">{stat.desc}</p>
              <a
                href={stat.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 font-mono text-[10px] uppercase tracking-widest text-primary/80 hover:text-primary transition-colors"
              >
                {stat.source} ↗
              </a>
            </motion.article>
          ))}
        </div>

        <p className="mt-8 font-mono text-xs text-muted-foreground leading-relaxed max-w-3xl">
          This is why we start with one bounded use case, keep deployments inside your own environment, and add human oversight where decisions matter. Open-weight models now trail the best closed model by only about 3% on public benchmarks (
          <a
            href="https://hai.stanford.edu/ai-index"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/80 hover:text-primary"
          >
            Stanford AI Index 2026
          </a>
          ), so a private model no longer means giving up capability.
        </p>
      </div>
    </section>
  );
}
