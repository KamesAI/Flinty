import Link from "next/link";
import { Bot, CalendarCheck, Inbox, MessageSquareReply } from "lucide-react";
import { getMeetings } from "@/lib/sheets";
import { listEscalatedSetterThreads, listSetterDraftQueue } from "@/lib/replies";
import { ConversationThread } from "./ConversationThread";
import { SetterDraftCard } from "./SetterDraftCard";
import { WarmupPositiveButton } from "./WarmupPositiveButton";
import { InboxSummaryCounters } from "./InboxSummaryCounters";

type TabKey = "validate" | "reply" | "bookings";

const TABS: { key: TabKey; label: string; emptyLabel: string }[] = [
  { key: "validate", label: "À valider", emptyLabel: "Aucun draft Setter à valider." },
  { key: "reply", label: "À répondre", emptyLabel: "Aucun thread en réponse manuelle." },
  { key: "bookings", label: "Bookings", emptyLabel: "Aucun booking à afficher." },
];

function relativeDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

async function readDraftQueue() {
  try {
    return await listSetterDraftQueue();
  } catch (error) {
    console.error("[InboxPage] Unable to read Setter drafts", error);
    return [];
  }
}

async function readBookings() {
  try {
    return await getMeetings();
  } catch (error) {
    console.error("[InboxPage] Unable to read meetings", error);
    return [];
  }
}

async function readEscalatedThreads() {
  try {
    return await listEscalatedSetterThreads();
  } catch (error) {
    console.error("[InboxPage] Unable to read escalated Setter threads", error);
    return [];
  }
}

function getLeadName(lead: { prénom?: string; nom?: string }) {
  return `${lead.prénom ? `${lead.prénom} ` : ""}${lead.nom ?? ""}`.trim() || "Lead";
}

function getEscalationReason(value: string) {
  const [, , reason] = value.split(":");
  return reason || "Escalade manuelle";
}

function getWeekStart(dateInput: string) {
  const date = new Date(dateInput);
  const day = date.getDay() || 7;
  const start = new Date(date);
  start.setDate(date.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatWeekLabel(dateInput: string) {
  const start = getWeekStart(dateInput);
  return `Semaine du ${start.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

function groupBookingsByWeek<T extends { start_at: string }>(bookings: T[]) {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const booking of bookings) {
    const key = getWeekStart(booking.start_at).toISOString().slice(0, 10);
    const group = groups.get(key) ?? { label: formatWeekLabel(booking.start_at), items: [] };
    group.items.push(booking);
    groups.set(key, group);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, group]) => ({
      ...group,
      items: group.items.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    }));
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; campaign_id?: string }>;
}) {
  const { tab = "validate", campaign_id } = await searchParams;
  const activeTab = (TABS.find((candidate) => candidate.key === tab)?.key ?? "validate") as TabKey;

  const [drafts, escalatedThreads, bookings] = await Promise.all([
    readDraftQueue(),
    readEscalatedThreads(),
    readBookings(),
  ]);
  const filteredDrafts = campaign_id
    ? drafts.filter((item) => item.campaign.campaign_id === campaign_id)
    : drafts;
  const filteredEscalatedThreads = campaign_id
    ? escalatedThreads.filter((item) => item.campaign.campaign_id === campaign_id)
    : escalatedThreads;
  const filteredBookings = campaign_id
    ? bookings.filter((meeting) => meeting.campaign_id === campaign_id)
    : bookings.filter((meeting) => ["booked", "scheduled"].includes(String(meeting.status)));
  const bookingWeeks = groupBookingsByWeek(filteredBookings);

  const campaignFilters = Array.from(
    new Map(
      [...drafts, ...escalatedThreads].map((item) => [item.campaign.campaign_id, item.campaign])
    ).values()
  );

  const counts: Record<TabKey, number> = {
    validate: filteredDrafts.length,
    reply: filteredEscalatedThreads.length,
    bookings: filteredBookings.length,
  };
  const currentTab = TABS.find((candidate) => candidate.key === activeTab)!;

  return (
    <div className="max-w-6xl px-1 py-2 sm:px-2 sm:py-3">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#006596]">
            Inbox Setter
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Conversations
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Validation des réponses email générées par le Setter avant passage à WF8.
          </p>
        </div>
        <InboxSummaryCounters initialCounts={counts} campaignId={campaign_id} />
      </div>

      <div className="mb-4 flex items-center gap-1 border-b border-border">
        {TABS.map((item) => {
          const isActive = item.key === activeTab;
          const params = new URLSearchParams();
          params.set("tab", item.key);
          if (campaign_id) params.set("campaign_id", campaign_id);
          return (
            <Link
              key={item.key}
              href={`/dashboard/inbox?${params.toString()}`}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "-mb-px border-b-2 border-[#006596] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.key === "validate" ? <Bot className="size-4" /> : null}
              {item.key === "reply" ? <MessageSquareReply className="size-4" /> : null}
              {item.key === "bookings" ? <CalendarCheck className="size-4" /> : null}
              {item.label}
              {counts[item.key] > 0 ? (
                <span className={isActive ? "rounded-full bg-[#006596] px-1.5 py-0.5 text-xs font-bold leading-none text-white" : "rounded-full bg-muted px-1.5 py-0.5 text-xs font-bold leading-none text-muted-foreground"}>
                  {counts[item.key]}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {campaignFilters.length > 1 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Campagne
          </span>
          {[{ campaign_id: "", nom: "Toutes" }, ...campaignFilters].map((campaign) => {
            const selected = (campaign_id ?? "") === campaign.campaign_id;
            const params = new URLSearchParams();
            params.set("tab", activeTab);
            if (campaign.campaign_id) params.set("campaign_id", campaign.campaign_id);
            return (
              <Link
                key={campaign.campaign_id || "all"}
                href={`/dashboard/inbox?${params.toString()}`}
                className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                  selected
                    ? "border-[#006596] bg-[#006596]/10 text-[#006596]"
                    : "border-border text-muted-foreground hover:border-[#006596]/40 hover:text-foreground"
                }`}
              >
                {campaign.nom}
              </Link>
            );
          })}
        </div>
      ) : null}

      {activeTab === "validate" && (
        filteredDrafts.length === 0 ? (
          <EmptyState label={currentTab.emptyLabel} />
        ) : (
          <div className="space-y-4">
            {filteredDrafts.map((item) => (
              <section
                key={item.draft.turn_id}
                className="grid gap-4 rounded-lg border border-border bg-slate-50 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_380px]"
              >
                <div className="min-w-0">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="text-lg font-bold text-slate-950">
                          {item.lead.prénom ? `${item.lead.prénom} ` : ""}{item.lead.nom}
                        </h2>
                        {item.lead.email ? (
                          <span className="text-xs text-muted-foreground">{item.lead.email}</span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#006596]/10 px-2 py-0.5 text-xs font-semibold text-[#006596]">
                          {item.campaign.nom}
                        </span>
                        {item.lead.poste ? (
                          <span className="text-xs text-muted-foreground">{item.lead.poste}</span>
                        ) : null}
                        {item.lead.secteur ? (
                          <span className="text-xs text-muted-foreground">· {item.lead.secteur}</span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">· {relativeDate(item.draft.sent_at)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/campaigns/${item.campaign.campaign_id}/leads/${item.lead.lead_id}`}
                      className="shrink-0 text-xs font-semibold text-[#006596] hover:underline"
                    >
                      Fiche lead →
                    </Link>
                  </div>
                  {item.lastProspectTurn ? (
                    <div className="mb-4 rounded-lg border border-border bg-white p-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Dernier message prospect
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">
                        {item.lastProspectTurn.content}
                      </p>
                    </div>
                  ) : null}
                  <ConversationThread turns={item.thread} leadName={getLeadName(item.lead)} />
                </div>
                <SetterDraftCard
                  leadId={item.lead.lead_id}
                  turn={item.draft}
                />
              </section>
            ))}
          </div>
        )
      )}

      {activeTab === "reply" && (
        filteredEscalatedThreads.length === 0 ? (
          <EmptyState label={currentTab.emptyLabel} />
        ) : (
          <div className="space-y-4">
            {filteredEscalatedThreads.map((item) => (
              <section key={item.escalatedTurn.turn_id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950">
                        {getLeadName(item.lead)}
                      </h2>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {item.escalatedTurn.intent || "intent inconnu"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.lead.poste || "Lead"} · {item.campaign.nom} · {relativeDate(item.escalatedTurn.sent_at)}
                    </p>
                  </div>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    {getEscalationReason(item.escalatedTurn.validated_by)}
                  </span>
                </div>
                {item.lastProspectTurn ? (
                  <div className="mb-4 rounded-lg border border-border bg-slate-50 p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Dernier message prospect
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">
                      {item.lastProspectTurn.content}
                    </p>
                    <div className="mt-3">
                      <WarmupPositiveButton
                        leadId={item.lead.lead_id}
                        turnId={item.lastProspectTurn.turn_id}
                        alreadyTagged={(item.lastProspectTurn.tags ?? "").includes("warmup_positive_reply")}
                      />
                    </div>
                  </div>
                ) : null}
                <ConversationThread turns={item.thread} leadName={getLeadName(item.lead)} />
              </section>
            ))}
          </div>
        )
      )}

      {activeTab === "bookings" && (
        filteredBookings.length === 0 ? (
          <EmptyState label={currentTab.emptyLabel} />
        ) : (
          <div className="space-y-5">
            {bookingWeeks.map((week) => (
              <section key={week.label} className="space-y-2">
                <h2 className="text-sm font-bold text-slate-950">{week.label}</h2>
                {week.items.map((meeting) => (
                  <div key={meeting.meeting_id} className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{meeting.title || "Meeting"}</p>
                        <p className="text-xs text-muted-foreground">{meeting.attendee_name || meeting.attendee_email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(meeting.start_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-8 text-center shadow-sm">
      <Inbox className="mx-auto mb-3 size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
