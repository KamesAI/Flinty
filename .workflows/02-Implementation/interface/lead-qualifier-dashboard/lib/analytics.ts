import type { Meeting } from "@/lib/meetings";
import type { Campaign, Lead } from "@/lib/sheets";

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";
export type AnalyticsStatusGroup = "all" | "active" | "archived";

export interface AnalyticsDailySnapshot {
  snapshot_date: string;
  campaign_id: string;
  campaign_status: string;
  leads_raw: number;
  leads_qualified: number;
  emails_sent: number;
  opens: number;
  clicks: number;
  replies: number;
  meetings: number;
  reply_rate: number;
  booking_rate: number;
  top_template: string;
  metadata: string;
}

interface DataModelInput {
  campaigns: Campaign[];
  leads: Lead[];
  meetings: Meeting[];
  snapshots: AnalyticsDailySnapshot[];
  selectedCampaignId?: string;
  statusGroup: AnalyticsStatusGroup;
  period: AnalyticsPeriod;
  referenceDate?: Date;
}

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function parseAnalyticsDailyRows(rows: string[][]): AnalyticsDailySnapshot[] {
  if (!rows.length) return [];

  const [, ...data] = rows;
  return data
    .filter((row) => (row[0] ?? "").trim().length > 0)
    .map((row) => ({
      snapshot_date: row[0] ?? "",
      campaign_id: row[1] ?? "",
      campaign_status: row[2] ?? "",
      leads_raw: toNumber(row[3]),
      leads_qualified: toNumber(row[4]),
      emails_sent: toNumber(row[5]),
      opens: toNumber(row[6]),
      clicks: toNumber(row[7]),
      replies: toNumber(row[8]),
      meetings: toNumber(row[9]),
      reply_rate: toNumber(row[10]),
      booking_rate: toNumber(row[11]),
      top_template: row[12] ?? "",
      metadata: row[13] ?? "",
    }));
}

export const ANALYTICS_DAILY_SHEET_NAME = "Analytics_Daily";
export const ANALYTICS_DAILY_HEADER = [
  "snapshot_date",
  "campaign_id",
  "campaign_status",
  "leads_raw",
  "leads_qualified",
  "emails_sent",
  "opens",
  "clicks",
  "replies",
  "meetings",
  "reply_rate",
  "booking_rate",
  "top_template",
  "metadata",
] as const;

export function isArchivedCampaign(status: Campaign["statut"]) {
  return status !== "active" && status !== "generating";
}

function getPeriodStart(period: AnalyticsPeriod, referenceDate: Date) {
  if (period === "all") return null;

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date(referenceDate);
  start.setDate(referenceDate.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

function isWithinPeriod(dateString: string, period: AnalyticsPeriod, referenceDate: Date) {
  if (period === "all") return true;
  const periodStart = getPeriodStart(period, referenceDate);
  if (!periodStart) return true;
  const date = new Date(dateString);
  return date >= periodStart && date <= referenceDate;
}

function matchesStatusGroup(status: Campaign["statut"], statusGroup: AnalyticsStatusGroup) {
  if (statusGroup === "all") return true;
  if (statusGroup === "active") return !isArchivedCampaign(status);
  return isArchivedCampaign(status);
}

export function buildDataDashboardModel({
  campaigns,
  leads,
  meetings,
  snapshots,
  selectedCampaignId,
  statusGroup,
  period,
  referenceDate = new Date(),
}: DataModelInput) {
  const filteredCampaigns = campaigns.filter((campaign) => {
    const campaignMatches =
      !selectedCampaignId || campaign.campaign_id === selectedCampaignId;
    return campaignMatches && matchesStatusGroup(campaign.statut, statusGroup);
  });

  const campaignIds = new Set(filteredCampaigns.map((campaign) => campaign.campaign_id));
  const filteredLeads = leads.filter((lead) => campaignIds.has(lead.campaign_id));
  const filteredMeetings = meetings.filter((meeting) => {
    return campaignIds.has(meeting.campaign_id) && isWithinPeriod(meeting.start_at, period, referenceDate);
  });
  const filteredSnapshots = snapshots.filter((snapshot) => {
    if (!campaignIds.has(snapshot.campaign_id)) return false;
    return isWithinPeriod(snapshot.snapshot_date, period, referenceDate);
  });

  const totalRawLeads = filteredCampaigns.reduce(
    (sum, campaign) => sum + toNumber(campaign.total_leads_raw),
    0
  );
  const totalQualifiedLeads = filteredCampaigns.reduce(
    (sum, campaign) => sum + toNumber(campaign.total_leads_qualified),
    0
  );
  const totalEmailsSent = filteredCampaigns.reduce(
    (sum, campaign) => sum + toNumber(campaign.emails_envoyés),
    0
  );
  const avgOpenRate = filteredCampaigns.length
    ? round(
        filteredCampaigns.reduce((sum, campaign) => sum + toNumber(campaign.taux_ouverture), 0) /
          filteredCampaigns.length
      )
    : 0;
  const clicks = filteredLeads.filter((lead) => lead.statut_email === "clicked").length;
  const replies = filteredLeads.filter((lead) => lead.statut_email === "replied").length;
  const repliesPending = filteredLeads.filter(
    (lead) => lead.statut_email === "replied" || lead.statut_email === "clicked"
  ).length;
  const scheduledMeetings = filteredMeetings.filter(
    (meeting) => meeting.status === "scheduled"
  ).length;

  const topTemplateMap = new Map<string, number>();
  for (const snapshot of filteredSnapshots) {
    if (!snapshot.top_template) continue;
    topTemplateMap.set(
      snapshot.top_template,
      (topTemplateMap.get(snapshot.top_template) ?? 0) + snapshot.replies
    );
  }

  const topTemplates = Array.from(topTemplateMap.entries())
    .map(([templateKey, repliesCount]) => ({
      templateKey,
      replies: repliesCount,
    }))
    .sort((a, b) => b.replies - a.replies)
    .slice(0, 5);

  const businessRows = filteredCampaigns
    .map((campaign) => {
      const campaignLeads = filteredLeads.filter((lead) => lead.campaign_id === campaign.campaign_id);
      const campaignMeetings = filteredMeetings.filter(
        (meeting) => meeting.campaign_id === campaign.campaign_id
      );
      const emailsSent = toNumber(campaign.emails_envoyés);
      const repliesCount = campaignLeads.filter((lead) => lead.statut_email === "replied").length;

      return {
        campaignId: campaign.campaign_id,
        campaignName: campaign.nom,
        status: campaign.statut,
        secteur: campaign.secteur,
        localisation: campaign.localisation,
        rawLeads: toNumber(campaign.total_leads_raw),
        qualifiedLeads: toNumber(campaign.total_leads_qualified),
        emailsSent,
        openRate: toNumber(campaign.taux_ouverture),
        replyRate: emailsSent > 0 ? round((repliesCount / emailsSent) * 100) : 0,
        bookingRate: emailsSent > 0 ? round((campaignMeetings.length / emailsSent) * 100) : 0,
      };
    })
    .sort((a, b) => b.qualifiedLeads - a.qualifiedLeads);

  const segmentMap = new Map<
    string,
    { segment: string; qualifiedLeads: number; replies: number; meetings: number }
  >();
  for (const lead of filteredLeads) {
    const key = lead.secteur || "Non renseigné";
    const current = segmentMap.get(key) ?? {
      segment: key,
      qualifiedLeads: 0,
      replies: 0,
      meetings: 0,
    };
    current.qualifiedLeads += 1;
    if (lead.statut_email === "replied") current.replies += 1;
    current.meetings += filteredMeetings.filter((meeting) => meeting.lead_id === lead.lead_id).length;
    segmentMap.set(key, current);
  }

  const segmentRows = Array.from(segmentMap.values()).sort(
    (a, b) => b.qualifiedLeads - a.qualifiedLeads
  );

  const commercialRows = filteredCampaigns
    .map((campaign) => {
      const campaignLeads = filteredLeads.filter((lead) => lead.campaign_id === campaign.campaign_id);
      const campaignMeetings = filteredMeetings.filter(
        (meeting) => meeting.campaign_id === campaign.campaign_id
      );

      return {
        campaignId: campaign.campaign_id,
        campaignName: campaign.nom,
        pendingReplies: campaignLeads.filter(
          (lead) => lead.statut_email === "replied" || lead.statut_email === "clicked"
        ).length,
        upcomingMeetings: campaignMeetings.filter((meeting) => meeting.status === "scheduled")
          .length,
        repliedLeads: campaignLeads.filter((lead) => lead.statut_email === "replied").length,
      };
    })
    .sort((a, b) => b.pendingReplies - a.pendingReplies);

  return {
    globalKpis: {
      totalCampaigns: filteredCampaigns.length,
      activeCampaigns: filteredCampaigns.filter((campaign) => !isArchivedCampaign(campaign.statut))
        .length,
      archivedCampaigns: filteredCampaigns.filter((campaign) => isArchivedCampaign(campaign.statut))
        .length,
      rawLeads: totalRawLeads,
      qualifiedLeads: totalQualifiedLeads,
      emailsSent: totalEmailsSent,
      openRate: avgOpenRate,
      clickRate: totalEmailsSent > 0 ? round((clicks / totalEmailsSent) * 100) : 0,
      replyRate: totalEmailsSent > 0 ? round((replies / totalEmailsSent) * 100) : 0,
      bookingRate:
        totalEmailsSent > 0 ? round((scheduledMeetings / totalEmailsSent) * 100) : 0,
      repliesPending,
      upcomingMeetings: scheduledMeetings,
      topTemplateAvailable: topTemplates.length > 0,
    },
    businessRows,
    marketingRows: businessRows.map((row) => ({
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      openRate: row.openRate,
      replyRate: row.replyRate,
      bookingRate: row.bookingRate,
    })),
    commercialRows,
    segmentRows,
    topTemplates,
  };
}
