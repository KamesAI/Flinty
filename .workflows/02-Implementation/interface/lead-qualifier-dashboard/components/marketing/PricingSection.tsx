"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { PRICING_PLANS } from "@/lib/marketing-content";
import { displayedMonthlyPrice, formatEuro, type BillingPeriod } from "@/lib/pricing-model";
import { cn } from "@/components/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";

export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="tarifs" className="scroll-mt-20 border-y border-border bg-secondary/40">
      <div className="container py-20">
        <Reveal className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-flinty text-3xl text-foreground sm:text-4xl">Trois plans. Zéro engagement.</h2>
          <p className="mt-4 text-muted-foreground">
            Essai gratuit sur tous les plans, sans carte bancaire.
          </p>
        </Reveal>

        <Reveal className="mb-12 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
            {(
              [
                { value: "monthly", label: "Mensuel" },
                { value: "annual", label: "Annuel −20 %" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  period === option.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.1}>
              <div
                className={cn(
                  "card-premium relative flex h-full flex-col overflow-visible p-8",
                  plan.popular && "border-primary/50 shadow-glow",
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Populaire</Badge>
                )}
                <h3 className="font-flinty text-xl text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                <p className="mt-6">
                  <span className="font-flinty text-4xl text-foreground">
                    {formatEuro(displayedMonthlyPrice(plan.monthlyPrice, period))}
                  </span>
                  <span className="text-sm text-muted-foreground"> /mois</span>
                </p>
                {period === "annual" && (
                  <p className="mt-1 text-xs text-muted-foreground">facturé annuellement</p>
                )}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">{plan.cta}</Link>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Essai gratuit, sans carte
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
