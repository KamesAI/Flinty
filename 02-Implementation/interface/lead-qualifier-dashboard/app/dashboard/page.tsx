import React from "react";
import {
  getMeetings,
  readIndex,
  parseIndexCampaigns,
  getAllLeadsV3,
  getAnalyticsDailySnapshots,
  indexCampaignToCampaign,
  type Campaign,
  type Lead,
} from "@/lib/sheets";
import {
  buildMeetingCarouselDays,
  getMeetingDayKey,
  getWeekWindow,
  isMeetingWithinWindow,
} from "@/lib/meetings";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { CampaignList, type CampaignRowProps } from "@/components/dashboard/CampaignList";
import { HotLeads } from "@/components/dashboard/HotLeads";
import { UpcomingMeetings, type UpcomingMeetingItem } from "@/components/dashboard/UpcomingMeetings";
import { buildDashboardKpiMetrics } from "./kpi-sparks";

export default async function DashboardPage() {
  let campaigns: Campaign[] = [];
  let hotLeadsRaw: Lead[] = [];
  let leads: Lead[] = [];
  let upcomingMeetingItems: UpcomingMeetingItem[] = [];
  let meetingsThisWeekCount = 0;
  let repliedCount = 0;
  let qualifiedCount = 0;
  let kpiMetrics = buildDashboardKpiMetrics([]);

  try {
    const [indexRows, meetings, snapshots] = await Promise.all([
      readIndex(),
      getMeetings(),
      getAnalyticsDailySnapshots(),
    ]);
    const indexCampaigns = parseIndexCampaigns(indexRows);
    campaigns = indexCampaigns.map(indexCampaignToCampaign);
    kpiMetrics = buildDashboardKpiMetrics(snapshots);
    const allLeads = await getAllLeadsV3(indexCampaigns);
    leads = allLeads;
    hotLeadsRaw = allLeads.filter(
      (l) => l.statut_email === "replied" || l.statut_email === "clicked"
    );
    repliedCount = allLeads.filter((l) => l.statut_email === "replied").length;
    qualifiedCount = allLeads.length;

    const weekWindow = getWeekWindow(new Date());
    meetingsThisWeekCount = meetings.filter((m) => isMeetingWithinWindow(m, weekWindow)).length;

    const carouselDays = buildMeetingCarouselDays(meetings, new Date(), 10);
    const allowedDayKeys = new Set(carouselDays.map((d) => d.key));
    const leadsById = new Map(leads.map((l) => [l.lead_id, l]));
    const campaignsById = new Map(campaigns.map((c) => [c.campaign_id, c]));

    upcomingMeetingItems = meetings
      .filter((m) => allowedDayKeys.has(getMeetingDayKey(m.start_at, m.timezone || "Europe/Paris")))
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 12)
      .map((m) => {
        const lead = leadsById.get(m.lead_id);
        const campaign = campaignsById.get(m.campaign_id);
        const date = new Date(m.start_at);
        const dayFmt = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          timeZone: m.timezone || "Europe/Paris",
        }).format(date);
        const dateFmt = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: m.timezone || "Europe/Paris",
        }).format(date);
        const timeFmt = new Intl.DateTimeFormat("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: m.timezone || "Europe/Paris",
        }).format(date);
        return {
          id: m.meeting_id,
          day: dayFmt,
          date: dateFmt,
          title: lead?.nom || m.attendee_name || m.title || "Meeting",
          campaign: campaign?.nom || "Campagne non reliée",
          time: timeFmt,
          status: (m.status === "scheduled" ? "confirmed" : "pending") as "confirmed" | "pending",
        };
      });
  } catch {
    // Sheets not configured — show empty state
  }

  const avgOpen = campaigns.length
    ? Math.round(campaigns.reduce((s, c) => s + parseFloat(c.taux_ouverture || "0"), 0) / campaigns.length)
    : 0;

  const topCampaigns = [...campaigns]
    .sort((a, b) => parseInt(b.total_leads_qualified || "0") - parseInt(a.total_leads_qualified || "0"))
    .slice(0, 3);

  const campaignRows: CampaignRowProps[] = topCampaigns.map((c) => ({
    href: `/dashboard/campaigns/${c.campaign_id}`,
    name: c.nom,
    subtitle: `${c.secteur} · ${c.offre_kames || "Prospection"} · ${c.localisation}`,
    status:
      c.statut === "active" ? "active"
      : c.statut === "completed" ? "completed"
      : c.statut === "paused" ? "paused"
      : "inactive",
    stats: {
      raw: parseInt(c.total_leads_raw || "0", 10) || 0,
      qualified: parseInt(c.total_leads_qualified || "0", 10) || 0,
      contacted: parseInt(c.emails_envoyés || "0", 10) || 0,
      replies: Math.round(
        ((parseFloat(c.taux_réponse || "0") || 0) * (parseInt(c.emails_envoyés || "0", 10) || 0)) / 100
      ) || 0,
    },
    openRate: parseFloat(c.taux_ouverture || "0") || 0,
    replyRate: parseFloat(c.taux_réponse || "0") || 0,
    isGenerating: c.statut === "generating",
  }));

  const hotLeads = hotLeadsRaw.map((l) => ({
    id: l.lead_id,
    name: l.nom,
    company: l.ville || "",
    campaign: l.campaign_id,
    signal: (l.statut_email === "replied" ? "replied" : "clicked") as "replied" | "clicked",
    hoursAgo: 0,
  }));

  return (
    <>
      {/* KPI row */}
      <KpiGrid
        campaignsActive={campaigns.filter((c) => c.statut === "active").length}
        qualifiedCount={qualifiedCount}
        avgOpenRate={avgOpen}
        meetingsCount={meetingsThisWeekCount}
        deltas={kpiMetrics.deltas}
        sparks={kpiMetrics.sparks}
      />

      <div className="mt-6">
        <UpcomingMeetings meetings={upcomingMeetingItems} />
      </div>

      {/* Main grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CampaignList campaigns={campaignRows} />
        </div>
        <HotLeads leads={hotLeads} />
      </div>
    </>
  );
}
