"use client";

import { ChevronLeft, ChevronRight, Clock3, Video } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { MeetingCarouselDay } from "@/lib/meetings";

interface UpcomingMeetingItem {
  meetingId: string;
  dayKey: string;
  title: string;
  campaignName: string;
  dateTimeLabel: string;
  timeLabel: string;
  statusLabel: string;
  statusClassName: string;
}

function getInitialSelectedDay(days: MeetingCarouselDay[]) {
  return days.find((day) => day.meetingCount > 0)?.key ?? days[0]?.key ?? "";
}

export function getMeetingCountTextClass(meetingCount: number) {
  return meetingCount > 0 ? "text-[#006596]" : "text-white";
}

export function UpcomingMeetingsCarousel({
  days,
  meetings,
}: {
  days: MeetingCarouselDay[];
  meetings: UpcomingMeetingItem[];
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState(() => getInitialSelectedDay(days));

  const meetingsForSelectedDay = useMemo(
    () => meetings.filter((meeting) => meeting.dayKey === selectedDayKey),
    [meetings, selectedDayKey]
  );

  const scrollRail = (direction: "left" | "right") => {
    railRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="rounded-[30px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg)]/85 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--dashboard-text-primary)]">
            Planning a venir
          </p>
          <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
            Vue glissante des 10 prochains jours avec focus par date.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollRail("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)] text-[var(--dashboard-text-secondary)] transition-all duration-200 hover:border-[var(--dashboard-border-strong)] hover:text-[var(--dashboard-text-primary)]"
            aria-label="Defiler vers la gauche"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => scrollRail("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)] text-[var(--dashboard-text-secondary)] transition-all duration-200 hover:border-[var(--dashboard-border-strong)] hover:text-[var(--dashboard-text-primary)]"
            aria-label="Defiler vers la droite"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => {
          const active = day.key === selectedDayKey;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDayKey(day.key)}
              className={`group relative snap-start shrink-0 rounded-[999px] border transition-all duration-300 ${
                active
                  ? "border-[#006596] bg-transparent"
                  : "border-[var(--dashboard-border)] bg-transparent hover:border-[var(--dashboard-border-strong)]"
              }`}
              aria-pressed={active}
            >
              <span
                className={`flex h-[62px] min-w-[92px] flex-col items-center justify-center rounded-[999px] px-3 text-center transition-all duration-300 ${
                  active
                    ? "bg-transparent text-white"
                    : "bg-[color:var(--dashboard-card-bg-muted)] text-[var(--dashboard-text-primary)]"
                }`}
              >
                <span className={`text-[13px] font-semibold leading-none ${active ? "text-white" : "text-[var(--dashboard-text-primary)]"}`}>
                  {day.weekdayLabel}
                </span>
                <span className={`mt-0.5 text-[11px] leading-none ${active ? "text-white/70" : "text-[var(--dashboard-text-secondary)]"}`}>
                  {day.dayLabel} {day.monthLabel}
                </span>
                <span className={`mt-1 text-[15px] font-semibold leading-none tracking-[-0.02em] ${active ? "text-white" : getMeetingCountTextClass(day.meetingCount)}`}>
                  {day.meetingCount}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {meetingsForSelectedDay.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {meetingsForSelectedDay.map((meeting) => (
              <article
                key={meeting.meetingId}
                className="group rounded-[24px] border border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--dashboard-border-strong)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--dashboard-text-primary)]">
                      {meeting.title}
                    </p>
                    <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
                      {meeting.campaignName}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${meeting.statusClassName}`}>
                    {meeting.statusLabel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--dashboard-text-secondary)]">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                    {meeting.dateTimeLabel}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Video className="h-4 w-4" strokeWidth={1.8} />
                    {meeting.timeLabel}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[var(--dashboard-border)] bg-[color:var(--dashboard-card-bg-muted)] px-5 py-8">
            <p className="text-sm font-medium text-[var(--dashboard-text-primary)]">
              Aucun meeting prevu sur cette date.
            </p>
            <p className="mt-1 text-sm text-[var(--dashboard-text-secondary)]">
              Le carrousel reste visible pour garder la lecture des prochains jours, meme quand l'agenda est vide.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
