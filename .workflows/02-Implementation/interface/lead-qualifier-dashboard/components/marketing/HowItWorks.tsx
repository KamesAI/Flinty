import { HOW_IT_WORKS_STEPS } from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";

export function HowItWorks() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-flinty text-3xl text-foreground sm:text-4xl">Comment ça marche</h2>
          <p className="mt-4 text-muted-foreground">
            Quinze minutes de configuration, puis Flinty travaille pour vous.
          </p>
        </Reveal>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <Reveal key={step.step} delay={index * 0.1}>
              <div className="relative h-full">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-flinty text-lg text-primary-foreground shadow-glow">
                  {step.step}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
