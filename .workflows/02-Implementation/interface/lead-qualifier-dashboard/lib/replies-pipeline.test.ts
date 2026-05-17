import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sheets", () => ({
  QUALIFIED_SHEET_RANGE_WITH_HEADER: "A1:AB5000",
  parseIndexCampaigns: vi.fn(() => [
    {
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
    },
  ]),
  parseLeadsV3: vi.fn(() => [
    {
      lead_id: "lead_1",
      campaign_id: "cmp_1",
      nom: "Dupont",
      prénom: "Jeanne",
      poste: "CEO",
      secteur: "SaaS",
      email: "jeanne@example.com",
      téléphone: "",
      score: "88",
      site: "",
      ville: "Paris",
      taille_equipe: "10",
      has_ia_services: "false",
      statut_email: "replied",
      resend_email_id: "",
    },
  ]),
  readChildQualifiedLeads: vi.fn(async () => [["header"], ["lead_1"]]),
  readChildSheet: vi.fn(async () => [
    ["icp_md", "# ICP"],
    ["setter_signature", "Thomas"],
  ]),
  readIndex: vi.fn(async () => [["campaign_id"], ["cmp_1"]]),
}));

vi.mock("@/lib/conversations", () => ({
  appendConversationTurn: vi.fn(async () => undefined),
  findConversationTurnById: vi.fn(),
  generateTurnId: vi.fn(),
  getAllConversationTurns: vi.fn(),
  getConversationThread: vi.fn(async () => []),
  listUnvalidatedSetterDrafts: vi.fn(),
  validateConversationTurn: vi.fn(),
}));

vi.mock("@/lib/setter", () => ({
  runSetterPipeline: vi.fn(),
}));

import { appendConversationTurn, generateTurnId } from "@/lib/conversations";
import { runSetterPipeline } from "@/lib/setter";
import { processEmailReply } from "./replies";

describe("processEmailReply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateTurnId)
      .mockReturnValueOnce("turn_prospect")
      .mockReturnValueOnce("turn_draft");
  });

  it("écrit le turn prospect puis le draft Setter", async () => {
    vi.mocked(runSetterPipeline).mockResolvedValueOnce({
      draft: "Merci Jeanne, partante pour mardi ?",
      intent: "interested",
      confidence: 0.91,
      escalated: false,
    });

    const result = await processEmailReply({
      campaign_id: "cmp_1",
      from_email: "jeanne@example.com",
      content: "Oui, intéressée.",
      sent_at: "2026-05-15T10:00:00.000Z",
    });

    expect(result).toMatchObject({
      lead_id: "lead_1",
      campaign_id: "cmp_1",
      prospect_turn_id: "turn_prospect",
      draft_turn_id: "turn_draft",
      escalated: false,
    });
    expect(appendConversationTurn).toHaveBeenCalledTimes(2);
    expect(appendConversationTurn).toHaveBeenNthCalledWith(
      1,
      "sheet_1",
      expect.objectContaining({ turn_id: "turn_prospect", role: "prospect" })
    );
    expect(appendConversationTurn).toHaveBeenNthCalledWith(
      2,
      "sheet_1",
      expect.objectContaining({ turn_id: "turn_draft", role: "setter", content: "Merci Jeanne, partante pour mardi ?" })
    );
  });

  it("marque le turn Setter comme escaladé si le pipeline escalade", async () => {
    vi.mocked(runSetterPipeline).mockResolvedValueOnce({
      draft: "",
      intent: "hostile",
      confidence: 0.98,
      escalated: true,
    });

    const result = await processEmailReply({
      from_email: "jeanne@example.com",
      content: "Stop.",
    });

    expect(result).toMatchObject({
      escalated: true,
      draft_turn_id: undefined,
      intent: "hostile",
    });
    expect(appendConversationTurn).toHaveBeenLastCalledWith(
      "sheet_1",
      expect.objectContaining({ role: "setter", validated_by: "escalated" })
    );
  });
});
