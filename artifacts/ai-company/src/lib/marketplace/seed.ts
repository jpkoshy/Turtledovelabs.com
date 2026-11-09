import type { Category, Faq, Gig, Order, Package, Review, Tier, Transaction, User } from './types';
import { feeFor } from './format';

// Deterministic PRNG so seeds are stable.
let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const DAY = 86400000;
const NOW = Date.parse('2026-11-01T12:00:00Z');
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();
const slugify = (t: string) => t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const DEMO_EMAILS = { buyer: 'buyer@demo.test', seller: 'seller@demo.test', admin: 'admin@demo.test' };

const catDefs: [string, string][] = [
  ['AI Agents & Automation', 'bot'], ['Custom ML Models', 'brain'], ['Data Engineering', 'database'],
  ['LLM Apps & Chatbots', 'message-square'], ['Prompt Engineering', 'terminal'], ['Computer Vision', 'eye'],
  ['Analytics & Dashboards', 'bar-chart'], ['Web Development', 'code'], ['Content & Copy', 'pen-tool'],
  ['Voice & Audio AI', 'mic'], ['Consulting & Strategy', 'compass'], ['MLOps', 'server'],
];
export const categories: Category[] = catDefs.map(([name, icon], i) => ({ id: `cat_${i + 1}`, slug: slugify(name), name, icon }));

const sellerDefs: [string, string, string, User['level'], string[]][] = [
  ['seller', 'Sam Seller', 'US', 'top', ['Python', 'LLMs', 'Automation']],
  ['ada_ml', 'Ada Okafor', 'NG', 'top', ['PyTorch', 'MLOps', 'Computer Vision']],
  ['lukas_data', 'Lukas Meier', 'DE', 'level2', ['Spark', 'dbt', 'Airflow']],
  ['priya_llm', 'Priya Nair', 'IN', 'level2', ['LangChain', 'RAG', 'OpenAI']],
  ['mateo_web', 'Mateo Silva', 'BR', 'level1', ['React', 'TypeScript', 'Node']],
  ['chloe_copy', 'Chloe Martin', 'GB', 'level1', ['Copywriting', 'SEO', 'Prompting']],
  ['kenji_voice', 'Kenji Tanaka', 'JP', 'level2', ['ASR', 'TTS', 'Whisper']],
  ['sofia_bi', 'Sofia Rossi', 'IT', 'level1', ['Tableau', 'SQL', 'Looker']],
  ['omar_strat', 'Omar Haddad', 'AE', 'level2', ['AI Strategy', 'Roadmaps', 'Audits']],
  ['nina_ops', 'Nina Kowalski', 'PL', 'new', ['Kubernetes', 'MLflow', 'CI/CD']],
];
export const sellers: User[] = sellerDefs.map(([username, displayName, country, level, skills], i) => ({
  id: `usr_s${i + 1}`, email: username === 'seller' ? DEMO_EMAILS.seller : `${username}@example.com`, username, displayName,
  avatarUrl: `https://picsum.photos/seed/${username}/200/200`, role: 'seller', country, languages: ['English'], skills, level,
  bio: `${displayName} builds production AI systems for startups and enterprises. Specialties: ${skills.join(', ')}.`,
  createdAt: iso(400 - i * 20),
}));
export const demoBuyer: User = { id: 'usr_b1', email: DEMO_EMAILS.buyer, username: 'buyer', displayName: 'Bea Buyer', avatarUrl: 'https://picsum.photos/seed/buyer/200/200', role: 'buyer', languages: ['English'], skills: [], level: 'new', country: 'US', bio: 'Demo buyer account.', createdAt: iso(200) };
export const demoAdmin: User = { id: 'usr_a1', email: DEMO_EMAILS.admin, username: 'admin', displayName: 'Alex Admin', avatarUrl: 'https://picsum.photos/seed/admin/200/200', role: 'admin', languages: ['English'], skills: [], level: 'new', bio: 'Marketplace administrator.', createdAt: iso(500) };
export const extraBuyers: User[] = ['Jo Park', 'Rae Lin', 'Tom Hale', 'Eva Cruz', 'Dan Wu'].map((n, i) => ({
  id: `usr_b${i + 2}`, email: `buyer${i + 2}@example.com`, username: n.toLowerCase().replace(' ', '_'), displayName: n, role: 'buyer' as const,
  languages: ['English'], skills: [], level: 'new' as const, createdAt: iso(150 - i * 10),
}));
export const users: User[] = [...sellers, demoBuyer, demoAdmin, ...extraBuyers];

// [category index, seller index, title, base price USD]
const gigDefs: [number, number, string, number][] = [
  [0, 0, 'I will build an autonomous AI agent to automate your workflow', 150],
  [0, 3, 'I will create a multi-agent system with tool use and memory', 300],
  [0, 4, 'I will automate your business processes with n8n and LLMs', 100],
  [1, 1, 'I will train a custom classification model on your data', 250],
  [1, 1, 'I will build a time-series forecasting model', 200],
  [1, 2, 'I will develop a recommendation engine for your product', 350],
  [2, 2, 'I will build a reliable ELT pipeline with Airflow and dbt', 400],
  [2, 2, 'I will design your cloud data warehouse on BigQuery or Snowflake', 500],
  [2, 9, 'I will migrate your batch jobs to streaming with Kafka', 450],
  [3, 3, 'I will build a RAG chatbot on your documents', 200],
  [3, 0, 'I will ship a custom GPT-powered support assistant', 175],
  [3, 3, 'I will integrate an LLM into your existing app', 250],
  [3, 4, 'I will build a Slack or Discord AI bot for your team', 120],
  [4, 5, 'I will engineer high-converting prompts for your use case', 40],
  [4, 0, 'I will build a prompt library and evaluation harness', 150],
  [4, 5, 'I will optimise prompts to cut your LLM costs', 90],
  [5, 1, 'I will build an object detection model with YOLO', 300],
  [5, 1, 'I will create an OCR and document extraction pipeline', 220],
  [5, 9, 'I will deploy computer vision on edge devices', 380],
  [6, 7, 'I will build an executive dashboard in Tableau or Looker', 180],
  [6, 7, 'I will clean and analyse your sales data with SQL', 90],
  [6, 2, 'I will create a self-serve KPI dashboard with Metabase', 160],
  [7, 4, 'I will build your AI SaaS landing page and app in React', 350],
  [7, 4, 'I will add an AI chat widget to your website', 80],
  [7, 0, 'I will build a Next.js dashboard with AI features', 420],
  [8, 5, 'I will write SEO blog posts using an AI-assisted workflow', 60],
  [8, 5, 'I will produce product descriptions at scale', 45],
  [8, 8, 'I will write technical whitepapers on AI topics', 200],
  [9, 6, 'I will build a speech-to-text transcription pipeline', 130],
  [9, 6, 'I will create a natural-sounding AI voice for your brand', 110],
  [9, 6, 'I will build a voice assistant with real-time streaming', 320],
  [10, 8, 'I will audit your AI readiness and deliver a roadmap', 250],
  [10, 8, 'I will advise on build vs buy for LLM platforms', 180],
  [10, 0, 'I will coach your team on shipping AI products', 220],
  [11, 9, 'I will set up MLflow experiment tracking and model registry', 200],
  [11, 9, 'I will build CI/CD for your ML models on Kubernetes', 400],
  [11, 1, 'I will add monitoring and drift detection to your models', 280],
  [1, 2, 'I will fine-tune an open-source LLM on your domain', 500],
  [0, 3, 'I will build a web research agent that writes reports', 140],
  [5, 1, 'I will build an image generation pipeline with diffusion models', 260],
];

const tierMeta: Record<Tier, { name: string; mult: number; days: number; revs: number }> = {
  basic: { name: 'Starter', mult: 1, days: 3, revs: 1 },
  standard: { name: 'Pro', mult: 2.2, days: 6, revs: 3 },
  premium: { name: 'Enterprise', mult: 4.5, days: 12, revs: 99 },
};
function makePackages(base: number, topic: string): Package[] {
  const feats = ['Source code included', 'Documentation', 'Deployment support', 'Priority support', 'Training session', 'Commercial use'];
  return (['basic', 'standard', 'premium'] as Tier[]).map((tier, i) => ({
    tier, name: tierMeta[tier].name,
    description: [`Quick, focused delivery for ${topic}.`, `Full solution for ${topic} with iteration.`, `End-to-end ${topic} with premium support.`][i],
    priceCents: Math.round((base * tierMeta[tier].mult) / 5) * 500,
    deliveryDays: tierMeta[tier].days, revisions: tierMeta[tier].revs,
    features: feats.slice(0, 2 + i * 2),
  }));
}
const faqs = (topic: string): Faq[] => [
  { question: 'What do you need from me to get started?', answer: `Share your goals, any existing data or systems, and access needed for ${topic}. I will confirm scope before starting.` },
  { question: 'Do you offer revisions?', answer: 'Yes, the number of revisions depends on the package you choose.' },
  { question: 'Can you sign an NDA?', answer: 'Absolutely. I am happy to sign an NDA before you share any sensitive material.' },
];

export const gigs: Gig[] = gigDefs.map(([ci, si, title, base], i) => {
  const topic = title.replace(/^I will /, '');
  const slug = slugify(title.replace(/^I will /, '')) + '-' + (i + 1);
  return {
    id: `gig_${i + 1}`, sellerId: sellers[si].id, categoryId: categories[ci].id, slug, title,
    description: `${topic.charAt(0).toUpperCase() + topic.slice(1)}.\n\nI have delivered dozens of similar projects for clients ranging from seed-stage startups to enterprises. You get clear communication, clean documentation and results you can rely on.\n\nWhat you get:\n- A scoped plan before work begins\n- Regular progress updates\n- Production-ready deliverables`,
    tags: [slugify(categories[ci].name).split('-')[0], ...sellers[si].skills.slice(0, 2).map((x) => x.toLowerCase())],
    images: [0, 1, 2].map((k) => `https://picsum.photos/seed/${slug}-${k}/640/360`),
    status: 'active', ratingAvg: 0, ratingCount: 0, ordersCompleted: 0,
    packages: makePackages(base, topic), faqs: faqs(topic), createdAt: iso(300 - i * 6),
  };
});

const comments = [
  'Fantastic work, delivered ahead of schedule and exactly what I needed.', 'Very professional and great communication throughout.',
  'Solid result. A couple of small revisions and it was perfect.', 'Exceeded expectations. Will hire again.',
  'Good quality, clear documentation. Recommended.', 'Understood our requirements quickly and executed well.',
  'Great value for the price. Smooth collaboration.', 'Outstanding expertise. Saved us weeks of effort.',
];
export const seedOrders: Order[] = [];
export const seedReviews: Review[] = [];
export const seedTransactions: Transaction[] = [];
const buyers = [demoBuyer, ...extraBuyers];
let oi = 0;
for (const g of gigs) {
  const n = 2 + Math.floor(rnd() * 4);
  let sum = 0;
  for (let k = 0; k < n; k++) {
    oi++;
    const tier = pick<Tier>(['basic', 'standard', 'standard', 'premium']);
    const pkg = g.packages.find((p) => p.tier === tier)!;
    const buyer = buyers[(oi + k) % buyers.length];
    const created = iso(20 + Math.floor(rnd() * 200));
    const order: Order = {
      id: `ord_seed${oi}`, gigId: g.id, buyerId: buyer.id, sellerId: g.sellerId, tier, priceCents: pkg.priceCents, feeCents: feeFor(pkg.priceCents),
      status: 'completed', requirements: 'Seeded demo order.',
      deliveries: [{ id: `dlv_seed${oi}`, message: 'Delivered as agreed. Let me know if you need tweaks.', files: [], createdAt: created }],
      dueAt: new Date(Date.parse(created) + pkg.deliveryDays * DAY).toISOString(), createdAt: created,
    };
    seedOrders.push(order);
    const rating = rnd() < 0.7 ? 5 : rnd() < 0.7 ? 4 : 3;
    sum += rating;
    seedReviews.push({ id: `rev_seed${oi}`, orderId: order.id, gigId: g.id, buyerId: buyer.id, rating, comment: pick(comments), createdAt: created, ...(rnd() < 0.3 ? { sellerReply: 'Thank you, a pleasure working with you!' } : {}) });
    seedTransactions.push(
      { id: `txn_seed${oi}a`, orderId: order.id, type: 'charge', amountCents: order.priceCents, status: 'completed', createdAt: created },
      { id: `txn_seed${oi}b`, orderId: order.id, type: 'fee', amountCents: order.feeCents, status: 'completed', createdAt: created },
      { id: `txn_seed${oi}c`, orderId: order.id, type: 'escrow_release', amountCents: order.priceCents - order.feeCents, status: 'completed', createdAt: created },
    );
  }
  g.ratingCount = n;
  g.ratingAvg = Math.round((sum / n) * 10) / 10;
  g.ordersCompleted = n + Math.floor(rnd() * 20);
}
