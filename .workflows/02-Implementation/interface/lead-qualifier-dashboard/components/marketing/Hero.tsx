import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";
import { HeroMockup } from "@/components/marketing/mockups/HeroMockup";

const TRUST_ITEMS = ["Email + LinkedIn", "Pacing anti-ban", "Conforme AI Act"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="container relative flex flex-col items-center gap-12 py-20 text-center md:py-28">
        <Reveal className="max-w-3xl space-y-6">
          <h1 className="font-flinty text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            L&apos;IA qui prospecte, relance, qualifie et{" "}
            <span className="text-gradient-primary">book vos rendez-vous</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Sur email et LinkedIn, Flinty contacte vos prospects, répond à leurs objections et
            propose vos créneaux Calendly. Sans que vous touchiez un message.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Créer mon compte</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#fonctionnalites">Voir les fonctionnalités</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Sans carte bancaire · Annulation en 1 clic</p>
        </Reveal>

        <Reveal delay={0.15} className="w-full">
          <HeroMockup />
        </Reveal>

        <Reveal delay={0.25}>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {TRUST_ITEMS.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Check className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
