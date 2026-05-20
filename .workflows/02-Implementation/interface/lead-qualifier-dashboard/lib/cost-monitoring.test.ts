import { describe, expect, it } from "vitest";
import {
  COST_TRACKING_HEADER,
  calculateAnthropicCostUsd,
  extractTokenUsage,
  parseCostTrackingRows,
  buildCostMonitoringSummary,
} from "./cost-monitoring";
import type { Campaign } from "./sheets";

const campaigns: Campaign[] = [
  {
    campaign_id: "cmp_1",
    nom: "Campagne 1",
    secteur: "SaaS",
    localisation: "Paris",
    date_création: "2026-05-01",
    offre_kames: "Setter IA",
    statut: "active",
    total_leads_raw: "100",
    total_leads_qualified: "50",
    emails_envoyés: "20",
    taux_ouverture: "0",
    taux_réponse: "0",
    workspace_id: "workspace-a",
  },
];

describe("cost-monitoring", () => {
  it("déclare le header Cost_Tracking attendu par l'Index", () => {
    expect(COST_TRACKING_HEADER).toEqual([
      "date",
      "campaign_id",
      "anthropic_tokens",
      "anthropic_cost_usd",
      "unipile_actions",
      "calendly_calls",
    ]);
  });

  it("calcule le coût Sonnet depuis input/output tokens", () => {
    expect(calculateAnthropicCostUsd({ inputTokens: 1000, outputTokens: 500 })).toBe(0.0105);
  });

  it("extrait les tokens des réponses Anthropic ou OpenRouter", () => {
    expect(extractTokenUsage({ usage: { input_tokens: 120, output_tokens: 30 } })).toEqual({
      inputTokens: 120,
      outputTokens: 30,
      totalTokens: 150,
    });

    expect(extractTokenUsage({ usage: { prompt_tokens: 80, completion_tokens: 20 } })).toEqual({
      inputTokens: 80,
      outputTokens: 20,
      totalTokens: 100,
    });
  });

  it("parse les lignes Cost_Tracking numériques", () => {
    const rows = [
      [...COST_TRACKING_HEADER],
      ["2026-05-20", "cmp_1", "150", "0.02", "3", "1"],
    ];

    expect(parseCostTrackingRows(rows)).toEqual([
      {
        date: "2026-05-20",
        campaign_id: "cmp_1",
        anthropic_tokens: 150,
        anthropic_cost_usd: 0.02,
        unipile_actions: 3,
        calendly_calls: 1,
      },
    ]);
  });

  it("retourne les coûts du mois, projection et alerte seuil", () => {
    const summary = buildCostMonitoringSummary({
      rows: [
        {
          date: "2026-05-02",
          campaign_id: "cmp_1",
          anthropic_tokens: 2000,
          anthropic_cost_usd: 8,
          unipile_actions: 12,
          calendly_calls: 4,
        },
        {
          date: "2026-04-30",
          campaign_id: "cmp_1",
          anthropic_tokens: 1000,
          anthropic_cost_usd: 99,
          unipile_actions: 0,
          calendly_calls: 0,
        },
      ],
      campaigns,
      meetings: [
        {
          meeting_id: "m_1",
          lead_id: "lead_1",
          campaign_id: "cmp_1",
          calendly_event_uri: "event",
          invitee_email: "a@example.com",
          start_at: "2026-05-18T10:00:00.000Z",
          end_at: "2026-05-18T10:30:00.000Z",
          status: "scheduled",
          created_at: "2026-05-17T10:00:00.000Z",
        },
      ],
      workspaceId: "workspace-a",
      thresholdUsd: 15,
      referenceDate: new Date("2026-05-20T12:00:00.000Z"),
    });

    expect(summary.month.anthropicTokens).toBe(2000);
    expect(summary.month.anthropicCostUsd).toBe(8);
    expect(summary.month.unipileActions).toBe(12);
    expect(summary.month.totalCostUsd).toBe(67);
    expect(summary.costPerMeetingUsd).toBe(67);
    expect(summary.alert.triggered).toBe(true);
    expect(summary.projection.monthlyTotalUsd).toBeGreaterThan(90);
  });
});
