import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UpcomingMeetingItem {
  id: string;
  day: string;
  date: string;
  title: string;
  campaign: string;
  time: string;
  status: "confirmed" | "pending";
}

interface UpcomingMeetingsProps {
  meetings?: UpcomingMeetingItem[];
}

export function UpcomingMeetings({ meetings = [] }: UpcomingMeetingsProps) {
  if (meetings.length === 0) {
    return (
      <section className="card-premium p-6">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
          Upcoming meetings
        </div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-primary">Next 7 days</h2>
        <p className="text-sm text-muted-foreground">Aucun meeting à venir.</p>
      </section>
    );
  }

  return (
    <section className="card-premium p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
            Upcoming meetings
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-primary">Next 7 days</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="-mx-6 overflow-x-auto px-6 pb-1">
        <div className="flex gap-3">
          {meetings.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              className="group relative w-[240px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border bg-card-elevated p-4 transition-colors hover:border-primary/40"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 px-2 py-1 text-primary">
                    <span className="text-[9px] font-semibold uppercase">{m.day.slice(0, 3)}</span>
                    <span className="text-sm font-bold leading-none">{m.date.split(" ")[1]}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      m.status === "confirmed"
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-warning/30 bg-warning/10 text-warning"
                    }
                  >
                    {m.status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 truncate text-sm font-semibold text-foreground">{m.title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.campaign}</div>
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" /> {m.time}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" /> {m.day}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
