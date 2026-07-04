import { CalendarCheck } from "lucide-react";

import { FUNNEL_NOTE, FUNNEL_STEPS, RESULT_STATS } from "@/lib/marketing-content";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionBadge } from "@/components/marketing/SectionBadge";

const FUNNEL_SHADES = ["bg-primary/35", "bg-primary/55", "bg-primary/75", "bg-primary"];

export function ResultsSection() {
  const maxValue = FUNNEL_STEPS[0].value;

  return (
    <section className="bg-dot-grid">
      <div className="container py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <SectionBadge>Objectifs produit — campagne type</SectionBadge>
          <h2 className="mt-5 font-flinty text-3xl text-foreground sm:text-4xl">
            Les chiffres qu&apos;on vise, noir sur blanc.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pas de promesses en l&apos;air : voici ce que Flinty est conçu pour atteindre sur
            chaque compte, dès les premières campagnes.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RESULT_STATS.map((stat, index) => (
            <Reveal key={stat.id} delay={index * 0.08}>
              <div className="card-premium flex h-full flex-col p-6">
                <p className="font-flinty text-4xl text-primary sm:text-5xl">{stat.value}</p>
                <p className="mt-3 text-sm font-medium text-foreground">{stat.label}</p>
                <p className="mt-1 flex-1 text-xs text-muted-foreground">{stat.sublabel}</p>
                <div className="mt-4 h-1 w-full rounded-full bg-primary/10">
                  <div
                    className="h-1 rounded-full bg-primary"
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <div className="card-premium p-6 sm:p-8">
            <div className="space-y-3">
              {FUNNEL_STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <div
                    className={`flex h-11 items-center rounded-lg px-4 ${FUNNEL_SHADES[index] ?? "bg-primary"}`}
                    style={{ width: `${Math.max((step.value / maxValue) * 100, 14)}%`, minWidth: "4.5rem" }}
                  >
                    <span className="text-sm font-semibold text-primary-foreground tabular-nums">
                      {step.value}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-foreground">{step.label}</span>
                    {step.rate && <span className="ml-2 font-medium text-primary">({step.rate})</span>}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="font-flinty text-lg text-foreground">12+ rendez-vous / mois</p>
                  <p className="text-xs text-muted-foreground">l&apos;objectif d&apos;une campagne type, sans travail manuel</p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Temps gagné estimé</p>
                <p className="font-semibold text-primary">45 min / jour sur le tri des réponses</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">{FUNNEL_NOTE}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
