import type { AnalyticsDailySnapshot } from "@/lib/analytics";

export interface DashboardKpiSparks {
  activeCampaigns: number[];
  qualifiedLeads: number[];
  openRate: number[];
  meetingsBooked: number[];
}

export interface DashboardKpiDeltas {
  activeCampaigns: number;
  qualifiedLeads: number;
  openRate: number;
  meetingsBooked: number;
}

export interface DashboardKpiMetrics {
  sparks: DashboardKpiSparks;
  deltas: DashboardKpiDeltas;
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isActiveSnapshot(status: string) {
  return status === "active" || status === "generating";
}

function compareDateStrings(a: string, b: string) {
  return new Date(a).getTime() - new Date(b).getTime();
}

function getSeriesDelta(series: number[], decimals = 0) {
  if (series.length < 2) return 0;
  return round(series.at(-1)! - series.at(-2)!, decimals);
}

export function buildDashboardKpiSparks(
  snapshots: AnalyticsDailySnapshot[],
  pointCount = 6
): DashboardKpiSparks {
  if (!snapshots.length) {
    return {
      activeCampaigns: [],
      qualifiedLeads: [],
      openRate: [],
      meetingsBooked: [],
    };
  }

  const orderedDates = Array.from(
    new Set(snapshots.map((snapshot) => snapshot.snapshot_date).filter(Boolean))
  )
    .sort(compareDateStrings)
    .slice(-pointCount);

  const allowedDates = new Set(orderedDates);
  const dailyMap = new Map<
    string,
    {
      activeCampaignIds: Set<string>;
      qualifiedLeads: number;
      emailsSent: number;
      opens: number;
      meetingsBooked: number;
    }
  >();

  for (const date of orderedDates) {
    dailyMap.set(date, {
      activeCampaignIds: new Set<string>(),
      qualifiedLeads: 0,
      emailsSent: 0,
      opens: 0,
      meetingsBooked: 0,
    });
  }

  for (const snapshot of snapshots) {
    if (!allowedDates.has(snapshot.snapshot_date)) continue;

    const current = dailyMap.get(snapshot.snapshot_date);
    if (!current) continue;

    if (isActiveSnapshot(snapshot.campaign_status)) {
      current.activeCampaignIds.add(snapshot.campaign_id);
    }

    current.qualifiedLeads += snapshot.leads_qualified;
    current.emailsSent += snapshot.emails_sent;
    current.opens += snapshot.opens;
    current.meetingsBooked += snapshot.meetings;
  }

  return {
    activeCampaigns: orderedDates.map((date) => dailyMap.get(date)?.activeCampaignIds.size ?? 0),
    qualifiedLeads: orderedDates.map((date) => dailyMap.get(date)?.qualifiedLeads ?? 0),
    openRate: orderedDates.map((date) => {
      const current = dailyMap.get(date);
      if (!current || current.emailsSent === 0) return 0;
      return round((current.opens / current.emailsSent) * 100);
    }),
    meetingsBooked: orderedDates.map((date) => dailyMap.get(date)?.meetingsBooked ?? 0),
  };
}

export function buildDashboardKpiMetrics(
  snapshots: AnalyticsDailySnapshot[],
  pointCount = 6
): DashboardKpiMetrics {
  const sparks = buildDashboardKpiSparks(snapshots, pointCount);

  return {
    sparks,
    deltas: {
      activeCampaigns: getSeriesDelta(sparks.activeCampaigns),
      qualifiedLeads: getSeriesDelta(sparks.qualifiedLeads),
      openRate: getSeriesDelta(sparks.openRate, 1),
      meetingsBooked: getSeriesDelta(sparks.meetingsBooked),
    },
  };
}
