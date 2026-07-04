import Link from "next/link";
import { CheckCircle2, Clock, Video } from "lucide-react";

import { BOOK_DEMO } from "@/lib/marketing-content";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/Reveal";
import { SectionBadge } from "@/components/marketing/SectionBadge";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const SLOT_TIMES = ["10:00", "11:30", "14:00", "16:30"];

function CalendarMockup() {
  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Démo Flinty — 30 min</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Video className="h-3.5 w-3.5" /> Visio
        </span>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] text-muted-foreground">
        {DAYS.map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className={`flex h-7 items-center justify-center rounded-md tabular-nums ${
              i === 9
                ? "bg-primary font-semibold text-primary-foreground"
                : i % 7 >= 5
                  ? "text-muted-foreground/40"
                  : "bg-secondary text-foreground"
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SLOT_TIMES.map((slot) => (
          <span
            key={slot}
            className="rounded-lg border border-border py-2 text-center text-xs font-medium text-foreground"
          >
            {slot}
          </span>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Calendrier de réservation en ligne — bientôt disponible
      </p>
    </div>
  );
}

export function BookDemoSection() {
  return (
    <section id="demo" className="scroll-mt-20 bg-dot-grid">
      <div className="container py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <SectionBadge>Réserver une démo</SectionBadge>
            <h2 className="mt-5 font-flinty text-3xl text-foreground sm:text-4xl">
              {BOOK_DEMO.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{BOOK_DEMO.description}</p>
            <ul className="mt-6 space-y-3">
              {BOOK_DEMO.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {bullet}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" asChild>
                <Link href="/signup">{BOOK_DEMO.cta}</Link>
              </Button>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Réponse sous 24h
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <CalendarMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
