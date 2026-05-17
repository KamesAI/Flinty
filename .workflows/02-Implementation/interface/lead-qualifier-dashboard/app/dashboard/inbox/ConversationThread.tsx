"use client";

import { useEffect, useRef } from "react";
import { Linkedin, Mail } from "lucide-react";
import type { ConversationTurn } from "@/lib/conversations";

interface ConversationThreadProps {
  turns?: ConversationTurn[];
  thread?: ConversationTurn[];
  leadName?: string;
  onSend?: (turnId: string) => void;
  onEscalate?: (turnId: string) => void;
}

const relativeFormatter = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });

function formatRelativeDate(iso: string): string {
  if (!iso) return "";
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 60) return relativeFormatter.format(diffSeconds, "second");
  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) return relativeFormatter.format(diffDays, "day");
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function roleLabel(role: ConversationTurn["role"]) {
  if (role === "prospect") return "Prospect";
  if (role === "human") return "Thomas";
  return "Setter IA";
}

function ChannelBadge({ channel }: { channel: ConversationTurn["channel"] }) {
  const isLinkedIn = channel === "linkedin";
  const Icon = isLinkedIn ? Linkedin : Mail;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      <Icon className="size-3" />
      {isLinkedIn ? "LinkedIn" : "Email"}
    </span>
  );
}

export function ConversationThread({ turns, thread, leadName = "ce lead" }: ConversationThreadProps) {
  const resolvedTurns = turns ?? thread ?? [];
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [resolvedTurns.length]);

  if (resolvedTurns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
        Aucun historique pour ce lead.
      </div>
    );
  }

  return (
    <div className="space-y-3" role="feed" aria-label={`Conversation avec ${leadName}`}>
      {resolvedTurns.map((turn) => {
        const isProspect = turn.role === "prospect";
        const isHuman = turn.role === "human";
        const isDraft = turn.role === "setter" && !turn.validated_by;
        return (
          <div
            key={turn.turn_id}
            className={`flex ${isProspect ? "justify-start" : "justify-end"}`}
            role="article"
            aria-label={`${roleLabel(turn.role)} via ${turn.channel} ${formatRelativeDate(turn.sent_at)}`}
          >
            <div
              className={`max-w-[86%] rounded-lg border px-4 py-3 text-sm leading-6 ${
                isProspect
                  ? "border-slate-200 bg-white text-slate-900"
                  : isHuman
                    ? "border-emerald-200 bg-emerald-50 text-slate-950"
                    : isDraft
                      ? "border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] text-slate-950"
                      : "border-[hsl(var(--primary)/0.18)] bg-white text-slate-950"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>{roleLabel(turn.role)}</span>
                <ChannelBadge channel={turn.channel} />
                {turn.intent ? <span>{turn.intent}</span> : null}
                <time dateTime={turn.sent_at}>{formatRelativeDate(turn.sent_at)}</time>
              </div>
              {isDraft ? (
                <div className="mb-2 rounded-md border border-[hsl(var(--primary)/0.22)] bg-white/70 px-2 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
                  Draft — en attente de validation
                </div>
              ) : null}
              <p className="whitespace-pre-wrap">{turn.content}</p>
            </div>
          </div>
        );
      })}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
