import { describe, expect, it } from "vitest";
import {
  campaignToSetterCampaign,
  conversationTurnsToMessages,
  leadToSetterLead,
  parseCampaignConfigRows,
} from "./replies";
import type { IndexCampaign, Lead } from "./sheets";
import type { ConversationTurn } from "./conversations";

describe("parseCampaignConfigRows", () => {
  it("transforme les lignes Config en objet clé-valeur", () => {
    expect(parseCampaignConfigRows([
      ["icp_md", "# ICP"],
      ["setter_tone", "casual"],
      ["", "ignored"],
    ])).toEqual({
      icp_md: "# ICP",
      setter_tone: "casual",
    });
  });
});

describe("Setter mapping helpers", () => {
  const campaign: IndexCampaign = {
    campaign_id: "cmp_1",
    nom: "Campagne Test",
    sheet_id: "sheet_1",
    sheet_url: "",
    secteur: "SaaS",
    localisation: "Paris",
    offre_kames: "Audit IA",
    statut: "active",
    date_création: "2026-05-15",
    total_leads_raw: "0",
    total_leads_qualified: "0",
    emails_envoyés: "0",
    taux_réponse: "0",
  };

  const lead: Lead = {
    lead_id: "lead_1",
    campaign_id: "cmp_1",
    nom: "Dupont",
    prénom: "Jeanne",
    poste: "CEO",
    secteur: "SaaS",
    email: "jeanne@example.com",
    téléphone: "",
    score: "88",
    site: "example.com",
    ville: "Paris",
    taille_equipe: "10",
    has_ia_services: "false",
    statut_email: "replied",
    resend_email_id: "",
  };

  it("mappe une campagne Index vers le contexte Setter avec defaults validation humaine", () => {
    const setterCampaign = campaignToSetterCampaign(campaign, {
      icp_md: "# ICP",
      setter_signature: "Thomas",
    });

    expect(setterCampaign).toMatchObject({
      campaign_id: "cmp_1",
      setter_tone: "formal",
      setter_signature: "Thomas",
      icp_md: "# ICP",
    });
  });

  it("mappe un lead qualifié vers le contexte Setter", () => {
    expect(leadToSetterLead(lead)).toMatchObject({
      lead_id: "lead_1",
      email: "jeanne@example.com",
      prénom: "Jeanne",
    });
  });
});

describe("conversationTurnsToMessages", () => {
  it("conserve uniquement le contrat attendu par le pipeline Setter", () => {
    const turns: ConversationTurn[] = [
      {
        turn_id: "turn_1",
        lead_id: "lead_1",
        channel: "email",
        role: "prospect",
        content: "Bonjour",
        sent_at: "2026-05-15T10:00:00.000Z",
        intent: "",
        validated_by: "",
        edited_from_draft: "false",
      },
    ];

    expect(conversationTurnsToMessages(turns)).toEqual([
      {
        channel: "email",
        role: "prospect",
        content: "Bonjour",
        sent_at: "2026-05-15T10:00:00.000Z",
      },
    ]);
  });
});
