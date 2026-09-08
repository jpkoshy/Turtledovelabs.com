import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import Hero from '@/components/sections/hero';
import Thesis from '@/components/sections/thesis';
import Capabilities from '@/components/sections/capabilities';
import CustomModels from '@/components/sections/custom-models';
import DataIntelligence from '@/components/sections/data-intelligence';
import AutonomousAgents from '@/components/sections/autonomous-agents';
import Metrics from '@/components/sections/metrics';
import CTA from '@/components/sections/cta';
import HowItWorks from '@/components/sections/how-it-works';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Thesis />
        <Capabilities />
        <CustomModels />
        <DataIntelligence />
        <AutonomousAgents />
        <HowItWorks />
        <Metrics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
