import Link from "next/link";
import { getMeetings, getSheetData, parseCampaigns, parseLeads } from "@/lib/sheets";
import {
  buildMeetingCarouselDays,
  getMeetingDayKey,
  getMeetingStatusClasses,
  getMeetingStatusLabel,
  getWeekWindow,
  isMeetingWithinWindow,
} from "@/lib/meetings";
import { PremiumStatsCards } from "./PremiumStatsCards";
import { TopCampaignsOverview } from "./TopCampaignsOverview";
import { UpcomingMeetingsCarousel } from "./UpcomingMeetingsCarousel";

export default async function DashboardPage() {
  let campaigns: Awaited<ReturnType<typeof parseCampaigns>> = [];
  let hotLeads: Awaited<ReturnType<typeof parseLeads>> = [];
  let leads: Awaited<ReturnType<typeof parseLeads>> = [];
  let upcomingMeetings = await Promise.resolve([] as Awaited<ReturnType<typeof getMeetings>>);
  let meetingsThisWeekCount = 0;
  let repliedCount = 0;
  let error = false;
  try {
    const [campRows, leadRows, meetings] = await Promise.all([
      getSheetData("Campagnes!A:L"),
      getSheetData("Leads_Qualified!A:P"),
      getMeetings(),
    ]);
    campaigns = parseCampaigns(campRows);
    const allLeads = parseLeads(leadRows);
    leads = allLeads;
    hotLeads = allLeads.filter(
      (l) => l.statut_email === "replied" || l.statut_email === "clicked"
    );
    repliedCount = allLeads.filter((l) => l.statut_email === "replied").length;
    const weekWindow = getWeekWindow(new Date());
    meetingsThisWeekCount = meetings.filter((meeting) =>
      isMeetingWithinWindow(meeting, weekWindow)
    ).length;
    const carouselDays = buildMeetingCarouselDays(meetings, new Date(), 10);
    const allowedDayKeys = new Set(carouselDays.map((day) => day.key));
    upcomingMeetings = meetings
      .filter((meeting) =>
        allowedDayKeys.has(getMeetingDayKey(meeting.start_at, meeting.timezone || "Europe/Paris"))
      )
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 12);
  } catch {
    error = true;
  }
  const avgOpen = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + parseFloat(c.taux_ouverture || "0"), 0) / campaigns.length)
    : 0;
  const topCampaigns = [...campaigns]
    .sort((a, b) => parseInt(b.total_leads_qualified || "0") - parseInt(a.total_leads_qualified || "0"))
    .slice(0, 3);
  const carouselDays = buildMeetingCarouselDays(upcomingMeetings, new Date(), 10);
  const leadsById = new Map(leads.map((lead) => [lead.lead_id, lead]));
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.campaign_id, campaign]));
  const upcomingMeetingItems = upcomingMeetings.map((meeting) => {
    const lead = leadsById.get(meeting.lead_id);
    const campaign = campaignsById.get(meeting.campaign_id);
    const meetingDate = new Date(meeting.start_at);

    return {
      meetingId: meeting.meeting_id,
      dayKey: getMeetingDayKey(meeting.start_at, meeting.timezone || "Europe/Paris"),
      title: lead?.nom || meeting.attendee_name || meeting.title || "Meeting",
      campaignName: campaign?.nom || "Campagne non reliee",
      dateTimeLabel: new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: meeting.timezone || "Europe/Paris",
      }).format(meetingDate),
      timeLabel: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: meeting.timezone || "Europe/Paris",
      }).format(meetingDate),
      statusLabel: getMeetingStatusLabel(meeting.status),
      statusClassName: getMeetingStatusClasses(meeting.status),
    };
  });

  return (
    <div className="p-4 sm:p-8">
      {/* Eyebrow + Title */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-1">Accueil</p>
        <h1 className="text-3xl font-bold text-white">Dashboard principal</h1>
        <p className="text-zinc-500 text-sm mt-1">Pipeline de prospection automatisé Kames AI</p>
      </div>

      {/* Leads chauds */}
      {hotLeads.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-3">
            🔥 À traiter maintenant — {hotLeads.length} lead{hotLeads.length > 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {hotLeads.map((lead) => (
              <Link
                key={lead.lead_id}
                href={`/dashboard/campaigns/${lead.campaign_id}/leads/${lead.lead_id}`}
                className="flex items-center justify-between bg-zinc-950 border border-orange-500/30 rounded-xl px-5 py-3 hover:border-orange-500/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    lead.statut_email === "replied"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-green-400/20 text-green-300"
                  }`}>
                    {lead.statut_email === "replied" ? "✅ Répondu" : "🖱 Cliqué"}
                  </span>
                  <span className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
                    {lead.nom}
                  </span>
                  <span className="text-zinc-500 text-xs">{lead.ville} · {lead.poste}</span>
                </div>
                <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">→ Voir la fiche</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Google Sheets not configured */}
      {error && (
        <div className="mb-6 border border-zinc-700 bg-zinc-900/50 rounded-lg px-4 py-3">
          <p className="text-zinc-400 text-sm">⚠️ Google Sheets non configuré — renseigner les credentials dans <code className="text-orange-400 text-xs">.env.local</code></p>
        </div>
      )}

      {/* Top action */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <Link
          href="/dashboard/campaigns/new"
          className="group relative inline-flex items-center justify-center"
        >
          <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
          <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
            <span className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
              Nouvelle campagne
            </span>
          </span>
        </Link>
      </div>

      <PremiumStatsCards
        campaignsCount={campaigns.length}
        repliedCount={repliedCount}
        avgOpenRate={avgOpen}
        meetingsCount={meetingsThisWeekCount}
      />

      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-orange-500 mb-1">
              Upcoming meetings
            </p>
            <p className="text-sm text-zinc-500">
              Vue rapide des prochains rendez-vous Calendly reliés au CRM.
            </p>
          </div>
          <Link
            href="/dashboard/meetings"
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:text-white hover:border-zinc-500 transition-colors"
          >
            Voir tous les meetings
          </Link>
        </div>

        <UpcomingMeetingsCarousel days={carouselDays} meetings={upcomingMeetingItems} />
      </div>

      {/* Campaign list — top 3 */}
      {campaigns.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-base mb-4">Aucune campagne créée</p>
          <Link
            href="/dashboard/campaigns/new"
            className="group relative inline-flex items-center justify-center"
          >
            <span className="pointer-events-none absolute inset-x-5 inset-y-1.5 rounded-full bg-orange-500/30 blur-xl transition-opacity duration-300 group-hover:opacity-90" />
            <span className="relative inline-flex rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-white p-[1px]">
              <span className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-300 group-hover:text-zinc-100">
                Créer votre première campagne
              </span>
            </span>
          </Link>
        </div>
      ) : (
        <>
        <TopCampaignsOverview campaigns={topCampaigns} />
        </>
      )}
    </div>
  );
}
