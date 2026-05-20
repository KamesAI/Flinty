import type { Meeting } from "@/lib/meetings";
import type { Campaign } from "@/lib/sheets";

export const COST_TRACKING_SHEET_NAME = "Cost_Tracking";
export const COST_TRACKING_HEADER = [
  "date",
  "campaign_id",
  "anthropic_tokens",
  "anthropic_cost_usd",
  "unipile_actions",
  "calendly_calls",
] as const;

export const DEFAULT_COST_PER_MEETING_THRESHOLD_USD = 15;
const SONNET_INPUT_COST_PER_1K = 0.003;
const SONNET_OUTPUT_COST_PER_1K = 0.015;
const UNIPILE_MONTHLY_COST_USD = 59;

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostTrackingRow {
  date: string;
  campaign_id: string;
  anthropic_tokens: number;
  anthropic_cost_usd: number;
  unipile_actions: number;
  calendly_calls: number;
}

export interface CostMonitoringSummary {
  workspaceId: string;
  thresholdUsd: number;
  month: {
    anthropicTokens: number;
    anthropicCostUsd: number;
    unipileActions: number;
    calendlyCalls: number;
    unipileCostUsd: number;
    totalCostUsd: number;
    meetings: number;
  };
  costPerMeetingUsd: number;
  projection: {
    monthlyTotalUsd: number;
    monthlyAnthropicCostUsd: number;
  };
  alert: {
    triggered: boolean;
    reason: string;
    costPerMeetingLast7Usd: number;
    meetingsWindow: number;
  };
  campaigns: Array<{
    campaignId: string;
    campaignName: string;
    anthropicTokens: number;
    totalCostUsd: number;
    meetings: number;
    costPerMeetingUsd: number;
  }>;
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value: number, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthEnd(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

function daysInMonth(date: Date) {
  return monthEnd(date).getUTCDate();
}

function dayOfMonth(date: Date) {
  return date.getUTCDate();
}

export function calculateAnthropicCostUsd(usage: Pick<TokenUsage, "inputTokens" | "outputTokens">) {
  return round(
    (usage.inputTokens * SONNET_INPUT_COST_PER_1K + usage.outputTokens * SONNET_OUTPUT_COST_PER_1K) / 1000,
    6
  );
}

export function extractTokenUsage(response: unknown): TokenUsage {
  const usage = (response as { usage?: Record<string, unknown> } | null)?.usage ?? {};
  const inputTokens = toNumber(usage.input_tokens ?? usage.prompt_tokens);
  const outputTokens = toNumber(usage.output_tokens ?? usage.completion_tokens);
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

export function parseCostTrackingRows(rows: string[][]): CostTrackingRow[] {
  if (!rows.length) return [];
  const [, ...data] = rows;
  return data
    .filter((row) => (row[0] ?? "").trim() && (row[1] ?? "").trim())
    .map((row) => ({
      date: row[0] ?? "",
      campaign_id: row[1] ?? "",
      anthropic_tokens: toNumber(row[2]),
      anthropic_cost_usd: toNumber(row[3]),
      unipile_actions: toNumber(row[4]),
      calendly_calls: toNumber(row[5]),
    }));
}

export function buildCostMonitoringSummary({
  rows,
  campaigns,
  meetings,
  workspaceId,
  thresholdUsd = DEFAULT_COST_PER_MEETING_THRESHOLD_USD,
  referenceDate = new Date(),
}: {
  rows: CostTrackingRow[];
  campaigns: Campaign[];
  meetings: Meeting[];
  workspaceId: string;
  thresholdUsd?: number;
  referenceDate?: Date;
}): CostMonitoringSummary {
  const campaignById = new Map(campaigns.map((campaign) => [campaign.campaign_id, campaign]));
  const workspaceCampaignIds = new Set(
    campaigns
      .filter((campaign) => campaign.workspace_id === workspaceId)
      .map((campaign) => campaign.campaign_id)
  );
  const start = monthStart(referenceDate);
  const end = monthEnd(referenceDate);
  const rowsThisMonth = rows.filter((row) => {
    if (!workspaceCampaignIds.has(row.campaign_id)) return false;
    const date = new Date(`${row.date}T00:00:00.000Z`);
    return date >= start && date <= end;
  });
  const meetingsThisMonth = meetings.filter((meeting) => {
    if (!workspaceCampaignIds.has(meeting.campaign_id)) return false;
    const date = new Date(meeting.start_at);
    return date >= start && date <= end;
  });

  const anthropicTokens = rowsThisMonth.reduce((sum, row) => sum + row.anthropic_tokens, 0);
  const anthropicCostUsd = round(rowsThisMonth.reduce((sum, row) => sum + row.anthropic_cost_usd, 0), 4);
  const unipileActions = rowsThisMonth.reduce((sum, row) => sum + row.unipile_actions, 0);
  const calendlyCalls = rowsThisMonth.reduce((sum, row) => sum + row.calendly_calls, 0);
  const unipileCostUsd = unipileActions > 0 ? UNIPILE_MONTHLY_COST_USD : 0;
  const totalCostUsd = round(anthropicCostUsd + unipileCostUsd, 4);
  const meetingCount = meetingsThisMonth.length;
  const costPerMeetingUsd = meetingCount > 0 ? round(totalCostUsd / meetingCount, 4) : 0;
  const projectionFactor = daysInMonth(referenceDate) / Math.max(dayOfMonth(referenceDate), 1);
  const lastSevenMeetings = [...meetingsThisMonth]
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    .slice(0, 7);
  const costPerMeetingLast7Usd = lastSevenMeetings.length > 0
    ? round(totalCostUsd / lastSevenMeetings.length, 4)
    : 0;

  const perCampaign = Array.from(workspaceCampaignIds)
    .map((campaignId) => {
      const campaignRows = rowsThisMonth.filter((row) => row.campaign_id === campaignId);
      const campaignMeetings = meetingsThisMonth.filter((meeting) => meeting.campaign_id === campaignId);
      const campaignAnthropicCost = campaignRows.reduce((sum, row) => sum + row.anthropic_cost_usd, 0);
      const campaignUnipileActions = campaignRows.reduce((sum, row) => sum + row.unipile_actions, 0);
      const campaignTotalCost = round(campaignAnthropicCost + (campaignUnipileActions > 0 ? UNIPILE_MONTHLY_COST_USD : 0), 4);
      return {
        campaignId,
        campaignName: campaignById.get(campaignId)?.nom ?? campaignId,
        anthropicTokens: campaignRows.reduce((sum, row) => sum + row.anthropic_tokens, 0),
        totalCostUsd: campaignTotalCost,
        meetings: campaignMeetings.length,
        costPerMeetingUsd: campaignMeetings.length > 0 ? round(campaignTotalCost / campaignMeetings.length, 4) : 0,
      };
    })
    .filter((row) => row.anthropicTokens > 0 || row.meetings > 0 || row.totalCostUsd > 0);

  const alertTriggered = lastSevenMeetings.length > 0 && costPerMeetingLast7Usd > thresholdUsd;

  return {
    workspaceId,
    thresholdUsd,
    month: {
      anthropicTokens,
      anthropicCostUsd,
      unipileActions,
      calendlyCalls,
      unipileCostUsd,
      totalCostUsd,
      meetings: meetingCount,
    },
    costPerMeetingUsd,
    projection: {
      monthlyTotalUsd: round(totalCostUsd * projectionFactor, 4),
      monthlyAnthropicCostUsd: round(anthropicCostUsd * projectionFactor, 4),
    },
    alert: {
      triggered: alertTriggered,
      reason: alertTriggered
        ? `cost_per_meeting_last_7 ${costPerMeetingLast7Usd.toFixed(2)} > threshold ${thresholdUsd.toFixed(2)}`
        : "",
      costPerMeetingLast7Usd,
      meetingsWindow: lastSevenMeetings.length,
    },
    campaigns: perCampaign,
  };
}

export function costTrackingRowFromUsage(input: {
  date?: Date;
  campaignId: string;
  usage: TokenUsage;
  unipileActions?: number;
  calendlyCalls?: number;
}) {
  return [
    ymd(input.date ?? new Date()),
    input.campaignId,
    String(input.usage.totalTokens),
    String(calculateAnthropicCostUsd(input.usage)),
    String(input.unipileActions ?? 0),
    String(input.calendlyCalls ?? 0),
  ];
}
