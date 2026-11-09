import type { Faq } from '@/lib/marketplace/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function GigFaq({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">FAQ</h2>
      <Accordion type="single" collapsible>
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">{f.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
