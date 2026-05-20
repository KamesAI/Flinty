import type { CostMonitoringSummary } from "@/lib/cost-monitoring";

export async function sendCostThresholdEmail(summary: CostMonitoringSummary): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.COST_ALERT_TO ?? process.env.ALERT_EMAIL_TO ?? "thomas@kamesai.com";

  if (!apiKey || !from || !summary.alert.triggered) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Alerte Flinty coût / meeting: ${summary.alert.costPerMeetingLast7Usd.toFixed(2)}$`,
      text: [
        `Workspace: ${summary.workspaceId}`,
        `Coût / meeting sur les ${summary.alert.meetingsWindow} derniers RDV: ${summary.alert.costPerMeetingLast7Usd.toFixed(2)}$`,
        `Seuil configuré: ${summary.thresholdUsd.toFixed(2)}$`,
        `Tokens mois: ${summary.month.anthropicTokens}`,
        `Projection mensuelle: ${summary.projection.monthlyTotalUsd.toFixed(2)}$`,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend cost alert failed: ${response.status}`);
  }

  return true;
}
