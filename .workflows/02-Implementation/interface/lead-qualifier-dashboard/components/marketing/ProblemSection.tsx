import { Clock, MailX, Network } from "lucide-react";

import { PROBLEMS } from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";

const PROBLEM_ICONS = { time: Clock, flat: MailX, scale: Network } as const;

export function ProblemSection() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="font-flinty text-3xl text-foreground sm:text-4xl">
            La prospection manuelle ne passe pas à l&apos;échelle
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {PROBLEMS.map((problem, index) => {
            const Icon = PROBLEM_ICONS[problem.id as keyof typeof PROBLEM_ICONS];
            return (
              <Reveal key={problem.id} delay={index * 0.1}>
                <div className="card-premium h-full p-6">
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{problem.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{problem.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
