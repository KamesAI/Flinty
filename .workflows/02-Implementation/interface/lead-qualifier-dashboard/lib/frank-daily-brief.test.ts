import { describe, expect, it } from "vitest";
import { buildDailyPipelineBriefData, type DailyPipelineBriefSource } from "./frank-daily-brief";

const campaign = {
  campaign_id: "cmp_1",
  nom: "Campagne DSI",
  sheet_id: "sheet_1",
  sheet_url: "https://docs.google.com/spreadsheets/private",
  secteur: "B2B SaaS",
  localisation: "France",
  offre_kames: "Agents IA",
  statut: "active",
  date_création: "2026-05-01",
  total_leads_raw: "100",
  total_leads_qualified: "2",
  emails_envoyés: "20",
  taux_réponse: "10",
  workspace_id: "kames-default",
} as const;

function source(): DailyPipelineBriefSource {
  return {
    now: new Date("2026-05-19T08:00:00.000Z"),
    campaigns: [campaign],
    leadsByCampaign: {
      cmp_1: [
        {
          lead_id: "lead_hot",
          campaign_id: "cmp_1",
          company: "Acme AI",
          contact_name: "Ada Lovelace",
          score: "91",
          score_reason: "Stack IA mature",
          statut_email: "replied",
          hiring_signals: "Recrutement RevOps",
          growth_stage: "scale",
          buying_signal: "Projet d'automatisation support",
          personalized_hook: "Mentionne un déploiement Zendesk",
          source_channel: "email",
          statut_li: "",
          reply_intent: "interested",
          reply_at: "2026-05-19T07:00:00.000Z",
          setter_action: "",
        },
        {
          lead_id: "lead_new",
          campaign_id: "cmp_1",
          company: "Beta Ops",
          contact_name: "",
          score: "72",
          score_reason: "Equipe en croissance",
          statut_email: "new",
          hiring_signals: "Hiring sales",
          growth_stage: "growth",
          buying_signal: "",
          personalized_hook: "Nouvelle offre enterprise",
          source_channel: "linkedin",
          statut_li: "new",
          reply_intent: "",
          reply_at: "",
          setter_action: "",
        },
      ],
    },
    conversationsByCampaign: {
      cmp_1: [
        {
          turn_id: "turn_1",
          lead_id: "lead_hot",
          channel: "email",
          role: "prospect",
          content:
            "Oui intéressé, écrivez à ada@example.com. token=super-secret-value https://secret.example",
          sent_at: "2026-05-19T07:00:00.000Z",
          intent: "interested",
          validated_by: "",
          edited_from_draft: "false",
        },
      ],
    },
  };
}

describe("buildDailyPipelineBriefData", () => {
  it("produit les sections attendues du daily brief Frank/Hermes", () => {
    const brief = buildDailyPipelineBriefData(source());

    expect(brief.date).toBe("2026-05-19");
    expect(brief.summary).toMatchObject({
      active_campaigns: 1,
      qualified_leads: 2,
      new_replies: 1,
      followups_due: 1,
      optional_drafts_to_prepare: 1,
    });
    expect(brief.new_replies[0]).toMatchObject({
      id: "lead_hot",
      company: "Acme AI",
      contact_name: "Ada Lovelace",
      stage: "replied",
      temperature: "hot",
      next_action_due: "2026-05-19",
      channel: "email",
    });
    expect(brief.optional_drafts_to_prepare[0]).toMatchObject({
      id: "lead_new",
      channel: "linkedin",
    });
  });

  it("n'expose pas les secrets, emails, URLs ni credentials dans le JSON", () => {
    const serialized = JSON.stringify(buildDailyPipelineBriefData(source()));

    expect(serialized).not.toContain("ada@example.com");
    expect(serialized).not.toContain("super-secret-value");
    expect(serialized).not.toContain("https://secret.example");
    expect(serialized).not.toContain("sheet_1");
    expect(serialized).not.toContain("docs.google.com");
  });
});
