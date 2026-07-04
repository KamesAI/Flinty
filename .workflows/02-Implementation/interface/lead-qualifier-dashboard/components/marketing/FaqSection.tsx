import { FAQ_ITEMS } from "@/lib/marketing-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/marketing/Reveal";

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="container max-w-3xl py-20">
        <Reveal className="mb-10 text-center">
          <h2 className="font-flinty text-3xl text-foreground sm:text-4xl">Questions fréquentes</h2>
        </Reveal>
        <Reveal>
          <Accordion type="single" collapsible>
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
