import Link from "next/link";
import {
  getAllEmailEvents,
  getMeetings,
  getSheetData,
  parseCampaigns,
  parseLeads,
} from "@/lib/sheets";
import { getEventLabel } from "@/lib/email-events";

type InboxStatus = "needs_reply" | "booked" | "waiting" | "new" | "bounced";
type TabKey = "needs_reply" | "booked" | "waiting" | "all";

const TABS: { key: TabKey; label: string; emptyLabel: string }[] = [
  { key: "needs_reply", label: "À répondre",       emptyLabel: "Aucune réponse en attente." },
  { key: "booked",      label: "Meeting planifié", emptyLabel: "Aucun meeting planifié." },
  { key: "waiting",     label: "En attente",       emptyLabel: "Aucun lead en attente." },
  { key: "all",         label: "Tout",             emptyLabel: "Aucune conversation." },
];

const STATUS_BADGE: Record<InboxStatus, { label: string; classes: string }> = {
  needs_reply: { label: "À répondre",   classes: "bg-emerald-500/20 text-emerald-400" },
  booked:      { label: "Meeting",      classes: "bg-blue-500/20 text-blue-400" },
  waiting:     { label: "En attente",   classes: "bg-orange-500/20 text-orange-400" },
  new:         { label: "Nouveau",      classes: "bg-zinc-800 text-zinc-400" },
  bounced:     { label: "Bounced",      classes: "bg-red-500/20 text-red-400" },
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

  const [leadRows, campRows, allEvents, allMeetings] = await Promise.all([
    getSheetData("Leads_Qualified!A:P"),
    getSheetData("Campagnes!A:L"),
    getAllEmailEvents(),
    getMeetings(),
  ]);

  const leads = parseLeads(leadRows);
  const campaigns = parseCampaigns(campRows);

  // Build inbox items
  const inboxItems = leads
    .filter((l) => l.statut_email !== "new") // skip leads never contacted
    .map((lead) => {
      const campaign = campaigns.find((c) => c.campaign_id === lead.campaign_id);
      const leadEvents = allEvents.filter((e) => e.lead_id === lead.lead_id);
      const lastEvent = leadEvents[0]; // already sorted desc
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

  // Counts per tab (ignoring campaign filter for counts)
  const counts: Record<TabKey, number> = {
    needs_reply: inboxItems.filter((i) => i.inbox_status === "needs_reply").length,
    booked:      inboxItems.filter((i) => i.inbox_status === "booked").length,
    waiting:     inboxItems.filter((i) => i.inbox_status === "waiting").length,
    all:         inboxItems.length,
  };

  // Apply filters
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
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-1">
          Inbox
        </p>
        <h1 className="text-3xl font-bold text-white">Conversations</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Vue centralisée de toutes les interactions leads.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-zinc-800 pb-0">
        {TABS.map((t) => {
          const isActive = t.key === activeTab;
          const params = new URLSearchParams();
          params.set("tab", t.key);
          if (campaign_id) params.set("campaign_id", campaign_id);
          return (
            <Link
              key={t.key}
              href={`/dashboard/inbox?${params.toString()}`}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? "text-white border-b-2 border-orange-500 -mb-px"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center leading-none ${
                    isActive
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-400"
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
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Campagne :</span>
          {[{ campaign_id: "", nom: "Toutes" }, ...activeCampaigns].map((c) => {
            const isSelected = (campaign_id ?? "") === c.campaign_id;
            const params = new URLSearchParams();
            params.set("tab", activeTab);
            if (c.campaign_id) params.set("campaign_id", c.campaign_id);
            return (
              <Link
                key={c.campaign_id || "all"}
                href={`/dashboard/inbox?${params.toString()}`}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  isSelected
                    ? "border-orange-500 text-orange-400 bg-orange-500/10"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
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
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-500 text-sm">{currentTab.emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const badge = STATUS_BADGE[item.inbox_status];
            return (
              <Link
                key={item.lead_id}
                href={`/dashboard/campaigns/${item.campaign_id}/leads/${item.lead_id}`}
                className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-600 transition-colors group"
              >
                {/* Left */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Canal icon */}
                  <span className="text-lg shrink-0">✉️</span>

                  {/* Lead info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
                        {item.prénom ? `${item.prénom} · ` : ""}{item.nom}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.classes}`}>
                        {badge.label}
                      </span>
                      {item.has_meeting && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                          📅 Meeting
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-0.5 truncate">
                      {item.poste && `${item.poste} · `}{item.ville}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-6 shrink-0 ml-4 text-right">
                  <div>
                    <p className="text-zinc-400 text-xs">{item.last_event_label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{relativeDate(item.last_activity_at)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-zinc-500 text-xs">{item.campaign_nom}</p>
                  </div>
                  <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
