import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowLeft, X, Zap, Database, Brain, Network, Cpu, GitBranch, Shield, BarChart3, Radio, FileCode, Globe, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@assets/Turtledovelabs_1786244932892.png';
import { trackEvent } from '@/lib/analytics';

/* ─── Data ──────────────────────────────────────────────────────────────── */

type NodeId = string;

interface ArchNode {
  id: NodeId;
  layer: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;          // tailwind bg
  glow: string;           // box-shadow color (hex)
  detail: {
    title: string;
    description: string;
    specs: string[];
    status: 'active' | 'beta' | 'enterprise';
  };
}

interface ArchEdge {
  from: NodeId;
  to: NodeId;
  label?: string;
  animated?: boolean;
}

const NODES: ArchNode[] = [
  // Layer 0 – Inputs
  {
    id: 'structured',
    layer: 0,
    label: 'Structured Data',
    sublabel: 'SQL · CSV · Parquet',
    icon: Database,
    color: 'bg-[#0a1a3e]',
    glow: '#1a5fff',
    detail: {
      title: 'Structured Data Sources',
      description: 'Ingest from relational databases, data warehouses, and flat-file exports. Schema-aware parsing with automatic type inference and null-handling.',
      specs: ['PostgreSQL, MySQL, Redshift', 'S3, GCS, Azure Blob', 'Streaming CDC via Debezium', 'Up to 10 TB/day ingestion'],
      status: 'active',
    },
  },
  {
    id: 'unstructured',
    layer: 0,
    label: 'Unstructured Data',
    sublabel: 'Docs · Audio · Video',
    icon: FileCode,
    color: 'bg-[#0a1a3e]',
    glow: '#1a5fff',
    detail: {
      title: 'Unstructured Data Sources',
      description: 'PDF, DOCX, email threads, call recordings, and video transcripts processed through our proprietary multi-modal pre-processing pipeline.',
      specs: ['OCR + layout parsing', 'Whisper-class ASR', 'Video frame sampling', 'Metadata extraction'],
      status: 'active',
    },
  },
  {
    id: 'streams',
    layer: 0,
    label: 'Real-time Streams',
    sublabel: 'Kafka · Kinesis · Events',
    icon: Radio,
    color: 'bg-[#0a1a3e]',
    glow: '#1a5fff',
    detail: {
      title: 'Event Stream Ingestion',
      description: 'Sub-100ms latency ingestion for high-throughput event streams. Exactly-once semantics with back-pressure control and automatic schema registry.',
      specs: ['Apache Kafka native', 'AWS Kinesis + Firehose', 'WebSocket event taps', '<50ms p99 latency'],
      status: 'active',
    },
  },

  // Layer 1 – Processing
  {
    id: 'etl',
    layer: 1,
    label: 'Data Pipeline',
    sublabel: 'Clean · Transform · Enrich',
    icon: GitBranch,
    color: 'bg-[#071230]',
    glow: '#0077ff',
    detail: {
      title: 'Intelligent Data Pipeline',
      description: 'Automated data quality scoring, deduplication, and schema normalization. Declarative transform DSL with lineage tracking on every record.',
      specs: ['Auto-dedup + anomaly flagging', 'PII redaction & masking', 'Declarative YAML transforms', 'Full lineage graph'],
      status: 'active',
    },
  },
  {
    id: 'embeddings',
    layer: 1,
    label: 'Embedding Engine',
    sublabel: 'Multi-modal · Contextual',
    icon: Zap,
    color: 'bg-[#071230]',
    glow: '#0077ff',
    detail: {
      title: 'Multi-modal Embedding Engine',
      description: 'Domain-adapted embedding generation across text, image, audio, and tabular modalities. Batched GPU inference with dynamic caching.',
      specs: ['Text, image, audio, tabular', 'Domain fine-tuned encoders', '1024–4096 dim vectors', 'ANN index updates <1s'],
      status: 'active',
    },
  },
  {
    id: 'vectorstore',
    layer: 1,
    label: 'Vector Store',
    sublabel: 'Retrieval · Index · Cache',
    icon: Database,
    color: 'bg-[#071230]',
    glow: '#0077ff',
    detail: {
      title: 'Private Vector Store',
      description: 'On-premise or VPC-isolated vector database with hybrid BM25 + ANN retrieval. Namespace isolation per business unit with RBAC at the collection level.',
      specs: ['pgvector + HNSW index', 'Hybrid BM25 + dense', 'Namespace RBAC', '<10ms p99 retrieval'],
      status: 'active',
    },
  },

  // Layer 2 – Core AI
  {
    id: 'training',
    layer: 2,
    label: 'Custom Model Training',
    sublabel: 'Fine-tune · Distill · Evaluate',
    icon: Brain,
    color: 'bg-[#050d24]',
    glow: '#005ce6',
    detail: {
      title: 'Bespoke Model Training',
      description: 'Full-cycle model development on your proprietary data. From architecture selection to hyperparameter search, evaluation harness, and regression testing.',
      specs: ['SFT, RLHF, DPO pipelines', 'Distributed multi-GPU training', 'Automated evals + red-teaming', 'Model card + drift monitoring'],
      status: 'enterprise',
    },
  },
  {
    id: 'rag',
    layer: 2,
    label: 'RAG System',
    sublabel: 'Retrieve · Augment · Generate',
    icon: Cpu,
    color: 'bg-[#050d24]',
    glow: '#005ce6',
    detail: {
      title: 'Production RAG System',
      description: 'Advanced retrieval-augmented generation with re-ranking, query expansion, and multi-hop reasoning. Fully observable with per-query citation trails.',
      specs: ['Hybrid retrieval + re-ranking', 'Query expansion + HyDE', 'Multi-hop chain-of-thought', 'Per-query citation audit'],
      status: 'active',
    },
  },

  // Layer 3 – Orchestration
  {
    id: 'agents',
    layer: 3,
    label: 'Autonomous Agent Network',
    sublabel: 'Plan · Act · Observe · Adapt',
    icon: Network,
    color: 'bg-[#030a1c]',
    glow: '#0044cc',
    detail: {
      title: 'Autonomous Agent Network',
      description: 'Multi-agent orchestration framework with hierarchical task decomposition, tool use, and self-correction. Agents operate within verifiable guardrails.',
      specs: ['Supervisor + worker topology', 'Tool registry (100+ tools)', 'Long-horizon memory', 'Verifiable constraint engine'],
      status: 'enterprise',
    },
  },
  {
    id: 'workflow',
    layer: 3,
    label: 'Workflow Engine',
    sublabel: 'DAG · Trigger · Retry',
    icon: GitBranch,
    color: 'bg-[#030a1c]',
    glow: '#0044cc',
    detail: {
      title: 'Enterprise Workflow Engine',
      description: 'DAG-based task scheduler with event-driven triggers, fault-tolerant retries, and SLA enforcement. Full audit trail for every workflow execution.',
      specs: ['Cron + event triggers', 'Exponential backoff retry', 'SLA breach alerting', 'Immutable audit log'],
      status: 'active',
    },
  },
  {
    id: 'safety',
    layer: 3,
    label: 'Safety & Guardrails',
    sublabel: 'Validate · Filter · Monitor',
    icon: Shield,
    color: 'bg-[#030a1c]',
    glow: '#0044cc',
    detail: {
      title: 'Safety & Guardrail Layer',
      description: 'Multi-stage output validation including content filtering, PII detection, hallucination scoring, and policy enforcement before any response is surfaced.',
      specs: ['Content policy engine', 'Hallucination scorer', 'PII + secrets detection', 'Real-time kill switch'],
      status: 'active',
    },
  },

  // Layer 4 – Delivery
  {
    id: 'api',
    layer: 4,
    label: 'API Gateway',
    sublabel: 'REST · GraphQL · gRPC',
    icon: Globe,
    color: 'bg-[#020817]',
    glow: '#1a5fff',
    detail: {
      title: 'Enterprise API Gateway',
      description: 'OpenAPI-compliant gateway with rate limiting, key rotation, and per-tenant quota enforcement. Deploy inside your VPC or through our managed edge.',
      specs: ['REST, GraphQL, gRPC', 'mTLS + API key auth', 'Per-tenant rate limits', 'SLA: 99.99% uptime'],
      status: 'active',
    },
  },
  {
    id: 'integrations',
    layer: 4,
    label: 'Enterprise Integrations',
    sublabel: 'Salesforce · SAP · Slack',
    icon: Zap,
    color: 'bg-[#020817]',
    glow: '#1a5fff',
    detail: {
      title: 'Pre-built Integrations',
      description: '200+ pre-built connectors for the enterprise software layer. Bi-directional sync with CRM, ERP, ITSM, and communication platforms.',
      specs: ['Salesforce, HubSpot, SAP', 'Slack, Teams, Jira', 'Webhook + event bus', '200+ connectors'],
      status: 'beta',
    },
  },
  {
    id: 'observability',
    layer: 4,
    label: 'Observability',
    sublabel: 'Metrics · Traces · Alerts',
    icon: BarChart3,
    color: 'bg-[#020817]',
    glow: '#1a5fff',
    detail: {
      title: 'Full-stack Observability',
      description: 'End-to-end tracing from raw input through model inference to final output. Token usage, latency histograms, error rates, and cost attribution per team.',
      specs: ['OpenTelemetry native', 'Per-model cost attribution', 'Latency + error dashboards', 'Anomaly alerting'],
      status: 'active',
    },
  },
];

const EDGES: ArchEdge[] = [
  { from: 'structured',    to: 'etl',           animated: true },
  { from: 'unstructured',  to: 'etl',           animated: true },
  { from: 'streams',       to: 'etl',           animated: true },
  { from: 'etl',           to: 'embeddings',    animated: true },
  { from: 'etl',           to: 'vectorstore',   animated: true },
  { from: 'embeddings',    to: 'vectorstore',   animated: true },
  { from: 'embeddings',    to: 'training',      animated: true },
  { from: 'vectorstore',   to: 'rag',           animated: true },
  { from: 'training',      to: 'rag',           animated: true },
  { from: 'training',      to: 'agents',        animated: true },
  { from: 'rag',           to: 'agents',        animated: true },
  { from: 'rag',           to: 'workflow',      animated: true },
  { from: 'agents',        to: 'safety',        animated: true },
  { from: 'workflow',      to: 'safety',        animated: true },
  { from: 'safety',        to: 'api',           animated: true },
  { from: 'safety',        to: 'integrations',  animated: true },
  { from: 'safety',        to: 'observability', animated: true },
];

const LAYER_LABELS = [
  { label: 'Data Ingestion',    sublabel: 'Layer 0' },
  { label: 'Processing',        sublabel: 'Layer 1' },
  { label: 'Intelligence Core', sublabel: 'Layer 2' },
  { label: 'Orchestration',     sublabel: 'Layer 3' },
  { label: 'Delivery',          sublabel: 'Layer 4' },
];

const STATUS_COLOR: Record<string, string> = {
  active:     'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  beta:       'text-amber-400  border-amber-400/30  bg-amber-400/10',
  enterprise: 'text-primary    border-primary/30    bg-primary/10',
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function Architecture() {
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [hovered, setHovered] = useState<NodeId | null>(null);

  const selectedNode = NODES.find(n => n.id === selected);
  const layerGroups = [0, 1, 2, 3, 4].map(l => NODES.filter(n => n.layer === l));

  const isHighlighted = (id: NodeId) => {
    if (!hovered && !selected) return true;
    const ref = hovered ?? selected;
    if (!ref) return true;
    if (ref === id) return true;
    return EDGES.some(e => (e.from === ref && e.to === id) || (e.to === ref && e.from === id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border py-4">
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            </Link>
            <div className="hidden md:block w-px h-5 bg-border" />
            <img src={logo} alt="Turtledovelabs" className="hidden md:block h-8 w-auto bg-white rounded px-2 py-0.5" />
          </div>

          <div className="text-center">
            <h1 className="font-mono text-xs text-primary uppercase tracking-widest">AI Architecture</h1>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">End-to-end intelligence stack</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest hidden sm:inline">All systems nominal</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 lg:px-12">

          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
              The <span className="text-gradient-primary">Intelligence Stack</span>
            </h2>
            <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Five layers. One sovereign system. Click any component to inspect its role in your enterprise AI infrastructure.
            </p>
          </motion.div>

          {/* Architecture Diagram */}
          <div className="relative">
            {/* Flow background lines */}
            <div className="absolute inset-0 bg-electric-grid opacity-20 pointer-events-none rounded-xl" />

            <div className="relative flex flex-col gap-3 p-4 md:p-8">
              {layerGroups.map((nodes, layerIdx) => (
                <motion.div
                  key={layerIdx}
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: layerIdx * 0.1 }}
                >
                  {/* Layer label */}
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] text-primary uppercase tracking-widest">
                      {LAYER_LABELS[layerIdx].sublabel}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {LAYER_LABELS[layerIdx].label}
                    </span>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  {/* Nodes row */}
                  <div className={`grid gap-3 ${nodes.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : nodes.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {nodes.map((node) => {
                      const Icon = node.icon;
                      const active = selected === node.id;
                      const dimmed = !isHighlighted(node.id);

                      return (
                        <motion.button
                          key={node.id}
                          className={`
                            relative text-left border rounded-sm p-4 transition-all duration-200 cursor-pointer group
                            ${active
                              ? 'border-primary bg-primary/10 shadow-[0_0_24px_rgba(0,119,255,0.35)]'
                              : 'border-border hover:border-primary/50 hover:bg-card'
                            }
                            ${dimmed ? 'opacity-30' : 'opacity-100'}
                          `}
                          style={active ? { boxShadow: `0 0 28px ${node.glow}55` } : {}}
                          onClick={() => {
                            if (!active) {
                              trackEvent('architecture_component_inspected', {
                                component: node.id,
                                layer: node.layer,
                                status: node.detail.status,
                              });
                            }
                            setSelected(active ? null : node.id);
                          }}
                          onMouseEnter={() => setHovered(node.id)}
                          onMouseLeave={() => setHovered(null)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.12 }}
                        >
                          {/* Animated glow top bar */}
                          <div
                            className={`absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}
                            style={{ background: `linear-gradient(90deg, transparent, ${node.glow}, transparent)` }}
                          />

                          <div className="flex items-start gap-3">
                            <div
                              className="shrink-0 w-9 h-9 flex items-center justify-center border border-primary/20 mt-0.5"
                              style={{ background: `${node.glow}18` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: node.glow }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground leading-tight">{node.label}</span>
                                <span
                                  className={`font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded-full ${STATUS_COLOR[node.detail.status]}`}
                                >
                                  {node.detail.status}
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{node.sublabel}</p>
                            </div>

                            {/* Connection dots */}
                            <div className="shrink-0 flex flex-col gap-1 items-end self-center">
                              {EDGES.filter(e => e.from === node.id || e.to === node.id).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: node.glow, opacity: active ? 1 : 0.3 }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Active chevron */}
                          {active && (
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:flex">
                              <ChevronRight className="w-5 h-5 text-primary" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Layer connector arrow */}
                  {layerIdx < 4 && (
                    <div className="flex justify-center py-1">
                      <motion.div
                        className="flex flex-col items-center gap-0.5"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: layerIdx * 0.4 }}
                      >
                        {[0, 1, 2].map(i => (
                          <div
                            key={i}
                            className="w-px h-2 rounded-full"
                            style={{ background: `hsl(207 100% 55% / ${1 - i * 0.25})` }}
                          />
                        ))}
                        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent"
                          style={{ borderTopColor: 'hsl(207 100% 55% / 0.5)' }}
                        />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <motion.div
            className="mt-12 flex flex-wrap items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Status:</span>
            {(['active', 'beta', 'enterprise'] as const).map(s => (
              <div key={s} className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-2 py-1 border rounded-full ${STATUS_COLOR[s]}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                {s}
              </div>
            ))}
            <span className="font-mono text-[10px] text-muted-foreground">Click any node to inspect</span>
          </motion.div>
        </div>
      </main>

      {/* ── Detail Panel (slides in from right) ── */}
      <AnimatePresence>
        {selectedNode && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />

            <motion.aside
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] z-50 bg-card border-l border-border flex flex-col overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              {/* Panel header */}
              <div className="flex items-start justify-between p-6 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-full ${STATUS_COLOR[selectedNode.detail.status]}`}>
                      {selectedNode.detail.status}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      {LAYER_LABELS[selectedNode.layer].sublabel} · {LAYER_LABELS[selectedNode.layer].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mt-1">{selectedNode.detail.title}</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 ml-4 p-1.5 hover:bg-muted transition-colors rounded-sm"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Panel icon + glow */}
              <div className="p-6 border-b border-border">
                <div
                  className="inline-flex items-center justify-center w-14 h-14 border mb-4"
                  style={{
                    background: `${selectedNode.glow}15`,
                    borderColor: `${selectedNode.glow}40`,
                    boxShadow: `0 0 24px ${selectedNode.glow}30`,
                  }}
                >
                  <selectedNode.icon className="w-6 h-6" style={{ color: selectedNode.glow }} />
                </div>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  {selectedNode.detail.description}
                </p>
              </div>

              {/* Specs */}
              <div className="p-6 border-b border-border">
                <h4 className="font-mono text-[10px] text-primary uppercase tracking-widest mb-4">Specifications</h4>
                <ul className="space-y-3">
                  {selectedNode.detail.specs.map((spec, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center gap-3 font-mono text-sm text-foreground"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: selectedNode.glow }} />
                      {spec}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Connected nodes */}
              <div className="p-6">
                <h4 className="font-mono text-[10px] text-primary uppercase tracking-widest mb-4">Connected Components</h4>
                <div className="space-y-2">
                  {EDGES.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).map((edge, i) => {
                    const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                    const dir = edge.from === selectedNode.id ? 'out' : 'in';
                    const other = NODES.find(n => n.id === otherId);
                    if (!other) return null;
                    const OtherIcon = other.icon;
                    return (
                      <motion.button
                        key={i}
                        className="w-full flex items-center gap-3 p-3 border border-border hover:border-primary/40 hover:bg-muted transition-all text-left"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        onClick={() => {
                          trackEvent('architecture_connection_followed', {
                            from_component: selectedNode.id,
                            to_component: otherId,
                          });
                          setSelected(otherId);
                        }}
                      >
                        <OtherIcon className="w-3.5 h-3.5 shrink-0" style={{ color: other.glow }} />
                        <span className="font-mono text-xs text-foreground flex-1">{other.label}</span>
                        <span className="font-mono text-[10px] text-muted-foreground uppercase">
                          {dir === 'out' ? '→ feeds' : '← feeds'}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
