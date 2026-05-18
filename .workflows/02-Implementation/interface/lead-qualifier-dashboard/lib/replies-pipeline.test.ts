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
    ["setter_validation", "false"],
  ]),
  readIndex: vi.fn(async () => [["campaign_id"], ["cmp_1"]]),
  updateConfigValue: vi.fn(async () => undefined),
  updateLeadFieldInChild: vi.fn(async () => undefined),
}));

vi.mock("@/lib/conversations", () => ({
  addConversationTurnTag: vi.fn(),
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

import {
  addConversationTurnTag,
  appendConversationTurn,
  findConversationTurnById,
  generateTurnId,
  getAllConversationTurns,
  validateConversationTurn,
} from "@/lib/conversations";
import { runSetterPipeline } from "@/lib/setter";
import { updateConfigValue, updateLeadFieldInChild } from "@/lib/sheets";
import { escalateSetterDraft, markWarmupPositiveReply, processEmailReply } from "./replies";

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

  it("force la validation et tagge le turn si le prospect demande si c'est une IA", async () => {
    vi.mocked(runSetterPipeline).mockResolvedValueOnce({
      draft: "Vous êtes un robot... Non, Thomas valide cette réponse.",
      intent: "interested",
      confidence: 0.91,
      escalated: false,
      ai_disclosure: true,
    });

    const result = await processEmailReply({
      from_email: "jeanne@example.com",
      content: "Vous êtes un robot ?",
    });

    expect(result.setter_validation).toBe(true);
    expect(result.forced_validation).toBe(true);
    expect(result.forced_validation_reason).toBe("ai_question");
    expect(appendConversationTurn).toHaveBeenLastCalledWith(
      "sheet_1",
      expect.objectContaining({
        role: "setter",
        tags: "forced_validation_ai_question",
        validated_by: "",
      })
    );
  });
});

describe("escalateSetterDraft", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valide le turn ET met à jour setter_action=escalated dans Leads_Qualified", async () => {
    vi.mocked(validateConversationTurn).mockResolvedValueOnce(undefined);
    vi.mocked(updateLeadFieldInChild).mockResolvedValueOnce(undefined);

    await escalateSetterDraft({
      lead_id: "lead_1",
      turn_id: "turn_draft",
      escalated_by: "Thomas",
      reason: "sensible",
    });

    expect(validateConversationTurn).toHaveBeenCalledWith(
      "sheet_1",
      "turn_draft",
      "escalated:Thomas:sensible"
    );
    expect(updateLeadFieldInChild).toHaveBeenCalledWith(
      "sheet_1",
      "cmp_1",
      "lead_1",
      "setter_action",
      "escalated"
    );
  });

  it("lève une erreur si le lead est introuvable", async () => {
    const { readIndex } = await import("@/lib/sheets");
    vi.mocked(readIndex).mockResolvedValueOnce([]);
    await expect(
      escalateSetterDraft({ lead_id: "unknown", turn_id: "t", escalated_by: "Thomas" })
    ).rejects.toThrow("Lead introuvable");
  });
});

describe("markWarmupPositiveReply", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tagge la reply prospect et met à jour le compteur Config", async () => {
    vi.mocked(findConversationTurnById).mockResolvedValueOnce({
      turn_id: "turn_prospect",
      lead_id: "lead_1",
      channel: "email",
      role: "prospect",
      content: "Avec plaisir",
      sent_at: "2026-05-18T10:00:00.000Z",
      intent: "interested",
      validated_by: "",
      edited_from_draft: "false",
      tags: "",
    });
    vi.mocked(addConversationTurnTag).mockResolvedValueOnce({
      turn_id: "turn_prospect",
      lead_id: "lead_1",
      channel: "email",
      role: "prospect",
      content: "Avec plaisir",
      sent_at: "2026-05-18T10:00:00.000Z",
      intent: "interested",
      validated_by: "",
      edited_from_draft: "false",
      tags: "warmup_positive_reply",
    });
    vi.mocked(getAllConversationTurns).mockResolvedValueOnce([
      {
        turn_id: "turn_prospect",
        lead_id: "lead_1",
        channel: "email",
        role: "prospect",
        content: "Avec plaisir",
        sent_at: "2026-05-18T10:00:00.000Z",
        intent: "interested",
        validated_by: "",
        edited_from_draft: "false",
        tags: "",
      },
      {
        turn_id: "turn_other",
        lead_id: "lead_2",
        channel: "email",
        role: "prospect",
        content: "OK",
        sent_at: "2026-05-18T10:05:00.000Z",
        intent: "interested",
        validated_by: "",
        edited_from_draft: "false",
        tags: "warmup_positive_reply",
      },
    ]);

    await markWarmupPositiveReply({ lead_id: "lead_1", turn_id: "turn_prospect" });

    expect(addConversationTurnTag).toHaveBeenCalledWith("sheet_1", "turn_prospect", "warmup_positive_reply");
    expect(updateConfigValue).toHaveBeenCalledWith(
      "sheet_1",
      "cmp_1",
      "warmup_positive_replies",
      "2"
    );
  });
});
