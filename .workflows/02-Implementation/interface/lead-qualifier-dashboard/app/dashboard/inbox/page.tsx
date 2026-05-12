import Link from "next/link";
import {
  getAllEmailEvents,
  getMeetings,
  readIndex,
  readChildQualifiedLeads,
  parseIndexCampaigns,
  QUALIFIED_SHEET_RANGE_WITH_HEADER,
  type IndexCampaign,
} from "@/lib/sheets";
import { getEventLabel } from "@/lib/email-events";

type InboxStatus = "needs_reply" | "booked" | "waiting" | "new" | "bounced";
type TabKey = "needs_reply" | "booked" | "waiting" | "all";

interface LeadV3 {
  lead_id: string;
  campaign_id: string;
  nom: string;
  prénom: string;
  poste: string;
  ville: string;
  statut_email: string;
  last_email_sent_at: string;
}

function parseQualifiedLeads(rows: string[][]): LeadV3[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((r) => r[0])
    .map((r) => ({
      lead_id:            r[0]  ?? "",
      campaign_id:        r[1]  ?? "",
      nom:                r[21] ?? r[2] ?? "",
      prénom:             r[22] ?? r[9] ?? "",
      poste:              r[10] ?? "",
      ville:              r[4]  ?? "",
      statut_email:       r[18] ?? "new",
      last_email_sent_at: "",
    }));
}

const TABS: { key: TabKey; label: string; emptyLabel: string }[] = [
  { key: "needs_reply", label: "À répondre",       emptyLabel: "Aucune réponse en attente." },
  { key: "booked",      label: "Meeting planifié", emptyLabel: "Aucun meeting planifié." },
  { key: "waiting",     label: "En attente",       emptyLabel: "Aucun lead en attente." },
  { key: "all",         label: "Tout",             emptyLabel: "Aucune conversation." },
];

const STATUS_BADGE: Record<InboxStatus, { label: string; classes: string }> = {
  needs_reply: { label: "À répondre",   classes: "bg-emerald-100 text-emerald-800" },
  booked:      { label: "Meeting",      classes: "bg-blue-100 text-blue-800" },
  waiting:     { label: "En attente",   classes: "bg-slate-100 text-slate-700" },
  new:         { label: "Nouveau",      classes: "bg-zinc-100 text-zinc-600" },
  bounced:     { label: "Bounced",      classes: "bg-red-100 text-red-800" },
};

function relativeDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `il y a ${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; campaign_id?: string }>;
}) {
  const { tab = "needs_reply", campaign_id } = await searchParams;
  const activeTab = (TABS.find((t) => t.key === tab)?.key ?? "needs_reply") as TabKey;

  // v3 — read campaigns from Index, leads from each child sheet
  const indexRows = await readIndex();
  const campaigns: IndexCampaign[] = parseIndexCampaigns(indexRows);

  const leadsPerCampaign = await Promise.all(
    campaigns
      .filter((c) => c.sheet_id)
      .map(async (c) => {
        const rows = await readChildQualifiedLeads(
          c.sheet_id,
          c.campaign_id,
          QUALIFIED_SHEET_RANGE_WITH_HEADER
        );
        return parseQualifiedLeads(rows);
      })
  );
  const leads = leadsPerCampaign.flat();

  const [allEvents, allMeetings] = await Promise.all([
    getAllEmailEvents(),
    getMeetings(),
  ]);

  // Build inbox items
  const inboxItems = leads
    .filter((l) => l.statut_email !== "new")
    .map((lead) => {
      const campaign = campaigns.find((c) => c.campaign_id === lead.campaign_id);
      const leadEvents = allEvents.filter((e) => e.lead_id === lead.lead_id);
      const lastEvent = leadEvents[0];
      const leadMeetings = allMeetings.filter((m) => m.lead_id === lead.lead_id);
      const scheduledMeeting = leadMeetings.find((m) => m.status === "scheduled");

      let inbox_status: InboxStatus;
      if (lead.statut_email === "replied") {
        inbox_status = "needs_reply";
      } else if (scheduledMeeting) {
        inbox_status = "booked";
      } else if (lead.statut_email === "bounced") {
        inbox_status = "bounced";
      } else {
        inbox_status = "waiting";
      }

      const last_activity_at =
        lastEvent?.timestamp || lead.last_email_sent_at || "";

      return {
        ...lead,
        campaign_nom: campaign?.nom ?? "—",
        inbox_status,
        last_activity_at,
        last_event_label: lastEvent ? getEventLabel(lastEvent.event_type) : "Email envoyé",
        has_meeting: leadMeetings.length > 0,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.last_activity_at).getTime() -
        new Date(a.last_activity_at).getTime()
    );

  const counts: Record<TabKey, number> = {
    needs_reply: inboxItems.filter((i) => i.inbox_status === "needs_reply").length,
    booked:      inboxItems.filter((i) => i.inbox_status === "booked").length,
    waiting:     inboxItems.filter((i) => i.inbox_status === "waiting").length,
    all:         inboxItems.length,
  };

  let filtered = inboxItems;
  if (activeTab !== "all") {
    filtered = filtered.filter((i) => i.inbox_status === activeTab);
  }
  if (campaign_id) {
    filtered = filtered.filter((i) => i.campaign_id === campaign_id);
  }

  const activeCampaigns = campaigns.filter(
    (c) => c.statut === "active" || c.statut === "generating"
  );
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="max-w-4xl px-1 py-2 sm:px-2 sm:py-3">
      {/* Header — thème clair (lisible sur fond AppShell) */}
      <div className="mb-8">
        <div className="max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#006596]">
            Inbox
          </p>
          <h1 className="font-flinty text-3xl font-extrabold tracking-tight text-black">
            Conversations
          </h1>
        </div>
        <div className="mt-3">
          <p className="text-sm text-muted-foreground sm:text-base">
            Vue centralisée de toutes les interactions leads.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 border-b border-border pb-0">
        {TABS.map((t) => {
          const isActive = t.key === activeTab;
          const params = new URLSearchParams();
          params.set("tab", t.key);
          if (campaign_id) params.set("campaign_id", campaign_id);
          return (
            <Link
              key={t.key}
              href={`/dashboard/inbox?${params.toString()}`}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "-mb-px border-b-2 border-[#006596] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className={`min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-xs font-bold leading-none ${
                    isActive
                      ? "bg-[#006596] text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {counts[t.key]}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Campaign filter */}
      {activeCampaigns.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Campagne :
          </span>
          {[{ campaign_id: "", nom: "Toutes" }, ...activeCampaigns].map((c) => {
            const isSelected = (campaign_id ?? "") === c.campaign_id;
            const params = new URLSearchParams();
            params.set("tab", activeTab);
            if (c.campaign_id) params.set("campaign_id", c.campaign_id);
            return (
              <Link
                key={c.campaign_id || "all"}
                href={`/dashboard/inbox?${params.toString()}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  isSelected
                    ? "border-[#006596] bg-[#006596]/10 text-[#006596]"
                    : "border-border text-muted-foreground hover:border-[#006596]/40 hover:text-foreground"
                }`}
              >
                {c.nom}
              </Link>
            );
          })}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{currentTab.emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const badge = STATUS_BADGE[item.inbox_status];
            return (
              <Link
                key={item.lead_id}
                href={`/dashboard/campaigns/${item.campaign_id}/leads/${item.lead_id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:border-[#006596]/35"
              >
                {/* Left */}
                <div className="flex min-w-0 items-center gap-4">
                  <span className="shrink-0 text-lg">✉️</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground transition-colors group-hover:text-[#006596]">
                        {item.prénom ? `${item.prénom} · ` : ""}{item.nom}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.classes}`}>
                        {badge.label}
                      </span>
                      {item.has_meeting && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                          📅 Meeting
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.poste && `${item.poste} · `}{item.ville}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="ml-4 flex shrink-0 items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-foreground">{item.last_event_label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {relativeDate(item.last_activity_at)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">{item.campaign_nom}</p>
                  </div>
                  <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
