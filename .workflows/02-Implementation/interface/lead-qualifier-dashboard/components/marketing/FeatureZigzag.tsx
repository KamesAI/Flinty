import { Check } from "lucide-react";

import { FEATURES } from "@/lib/marketing-content";
import { cn } from "@/components/lib/utils";
import { Reveal } from "@/components/marketing/Reveal";
import { FeatureMockup } from "@/components/marketing/mockups/FeatureMockups";

export function FeatureZigzag() {
  return (
    <section id="fonctionnalites" className="scroll-mt-20">
      <div className="container py-20">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="font-flinty text-3xl text-foreground sm:text-4xl">
            Toute la boucle outbound, <span className="text-gradient-primary">en pilote automatique</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Du sourcing au rendez-vous confirmé, six modules travaillent ensemble pour remplir votre
            agenda.
          </p>
        </Reveal>

        <div className="space-y-20 md:space-y-28">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.id}>
              <div
                className={cn(
                  "grid items-center gap-10 md:grid-cols-2 md:gap-16",
                  index % 2 === 1 && "md:[&>*:first-child]:order-2",
                )}
              >
                <div>
                  <span className="font-flinty text-sm text-primary">{feature.number}</span>
                  <h3 className="mt-2 font-flinty text-2xl text-foreground sm:text-3xl">{feature.title}</h3>
                  <p className="mt-2 text-lg font-medium text-foreground/80">{feature.hook}</p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">{feature.description}</p>
                  <ul className="mt-6 space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-foreground">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
                <FeatureMockup kind={feature.mockup} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
