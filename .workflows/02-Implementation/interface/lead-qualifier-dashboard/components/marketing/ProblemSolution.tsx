import { HOW_IT_WORKS_STEPS, PROBLEMS } from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionBadge } from "@/components/marketing/SectionBadge";

/**
 * Fusion constat + « Comment ça marche » : à gauche le quotidien sans système
 * (liste éditoriale), à droite ce que Flinty change (timeline 4 étapes).
 */
export function ProblemSolution() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-20">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <SectionBadge>Le constat</SectionBadge>
          <h2 className="mt-5 font-flinty text-3xl text-foreground sm:text-4xl">
            Prospecter à la main vous coûte des rendez-vous
          </h2>
          <p className="mt-4 text-muted-foreground">
            Le problème n&apos;est pas votre offre, ni votre volume d&apos;envoi. C&apos;est tout ce
            qui se passe après le premier message — et que personne n&apos;a le temps de suivre.
          </p>
        </Reveal>

        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-8 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Aujourd&apos;hui, sans système
            </p>
            <div className="space-y-8">
              {PROBLEMS.map((problem, index) => (
                <Reveal key={problem.id} delay={index * 0.1}>
                  <div className="relative pl-6">
                    <span
                      aria-hidden
                      className="absolute inset-y-1 left-0 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent"
                    />
                    <h3 className="text-lg font-semibold text-foreground">{problem.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {problem.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={0.15}>
            <div className="card-premium relative p-8 sm:p-10">
              <div
                aria-hidden
                className="absolute inset-0 bg-dot-grid [mask-image:radial-gradient(80%_80%_at_50%_0%,black,transparent)]"
              />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
                  Avec Flinty
                </p>
                <h3 className="mt-3 font-flinty text-2xl text-foreground">
                  Quinze minutes de configuration, puis l&apos;outil travaille pour vous
                </h3>
                <ol className="relative mt-8 space-y-8">
                  <span
                    aria-hidden
                    className="absolute bottom-5 left-5 top-5 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent"
                  />
                  {HOW_IT_WORKS_STEPS.map((step) => (
                    <li key={step.step} className="relative flex gap-5">
                      <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-flinty text-primary-foreground shadow-glow">
                        {step.step}
                      </span>
                      <div className="pt-1">
                        <h4 className="font-semibold text-foreground">{step.title}</h4>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
