import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";

export function FinalCta() {
  return (
    <section className="bg-primary">
      <div className="container py-20 text-center">
        <Reveal className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-flinty text-3xl text-primary-foreground sm:text-4xl">
            Laissez l&apos;IA remplir votre agenda
          </h2>
          <p className="text-primary-foreground/85">
            Créez votre compte, connectez vos canaux et lancez votre première campagne aujourd&apos;hui.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">Créer mon compte</Link>
          </Button>
          <p className="text-sm text-primary-foreground/70">
            Sans carte bancaire · Annulation en 1 clic
          </p>
        </Reveal>
      </div>
    </section>
  );
}
