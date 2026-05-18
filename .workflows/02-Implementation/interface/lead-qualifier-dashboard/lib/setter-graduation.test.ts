import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ConversationTurn } from "./conversations";
import {
  computeIntentAccuracy,
  graduateCampaign,
  getIntentAccuracySample,
} from "./setter-graduation";

vi.mock("@/lib/campaigns", () => ({
  getCampaignById: vi.fn(),
}));

vi.mock("@/lib/conversations", async () => {
  const actual = await vi.importActual<typeof import("@/lib/conversations")>("@/lib/conversations");
  return {
    ...actual,
    getAllConversationTurns: vi.fn(),
  };
});

vi.mock("@/lib/replies", () => ({
  readCampaignConfig: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  updateConfigValue: vi.fn(),
}));

vi.mock("@/lib/graduation-alerts", () => ({
  sendSetterGraduationEmail: vi.fn(),
}));

import { getCampaignById } from "@/lib/campaigns";
import { getAllConversationTurns } from "@/lib/conversations";
import { sendSetterGraduationEmail } from "@/lib/graduation-alerts";
import { readCampaignConfig } from "@/lib/replies";
import { updateConfigValue } from "@/lib/sheets";

function turn(index: number, patch: Partial<ConversationTurn> = {}): ConversationTurn {
  return {
    turn_id: `turn_${index}`,
    lead_id: `lead_${index}`,
    channel: "email",
    role: "setter",
    content: "Draft",
    sent_at: new Date(Date.UTC(2026, 4, 1, 9, index)).toISOString(),
    intent: "interested",
    validated_by: "Thomas",
    edited_from_draft: "false",
    tags: "",
    ...patch,
  };
}

describe("computeIntentAccuracy", () => {
  it("retourne 0.9 avec 45 turns corrects sur 50", () => {
    const turns = Array.from({ length: 50 }, (_, index) =>
      turn(index, index < 45 ? {} : { edited_from_draft: "true" })
    );

    expect(computeIntentAccuracy(turns)).toBe(0.9);
  });

  it("retourne 0.7 avec 35 turns corrects sur 50", () => {
    const turns = Array.from({ length: 50 }, (_, index) =>
      turn(index, index < 35 ? {} : { edited_from_draft: "true" })
    );

    expect(computeIntentAccuracy(turns)).toBe(0.7);
  });

  it("utilise human_intent_label si présent", () => {
    const turns = [
      turn(1, { intent: "interested", human_intent_label: "interested" }),
      turn(2, { intent: "interested", human_intent_label: "meeting_ready" }),
    ] as ConversationTurn[];

    expect(computeIntentAccuracy(turns)).toBe(0.5);
  });

  it("retourne 0 si aucun turn labellisé", () => {
    expect(computeIntentAccuracy([turn(1, { validated_by: "", edited_from_draft: "false" })])).toBe(0);
  });

  it("échantillonne les 50 derniers turns labellisés et ignore les forced AI", () => {
    const oldBadTurns = Array.from({ length: 10 }, (_, index) =>
      turn(index, { edited_from_draft: "true" })
    );
    const forced = turn(60, { tags: "forced_validation_ai_question", edited_from_draft: "false" });
    const recentGoodTurns = Array.from({ length: 50 }, (_, index) => turn(100 + index));

    const sample = getIntentAccuracySample([...oldBadTurns, forced, ...recentGoodTurns], 50);

    expect(sample).toHaveLength(50);
    expect(sample.some((candidate) => candidate.turn_id === "turn_60")).toBe(false);
    expect(computeIntentAccuracy(sample)).toBe(1);
  });
});

describe("graduateCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-18T10:00:00.000Z"));
    vi.mocked(getCampaignById).mockResolvedValue({
      campaign: { campaign_id: "cmp_1", nom: "Test" } as never,
      sheetId: "sheet_1",
      sheetUrl: "",
    });
    vi.mocked(readCampaignConfig).mockResolvedValue({
      setter_validation: "TRUE",
      setter_validation_locked_until: "2026-05-17T00:00:00.000Z",
    });
    vi.mocked(getAllConversationTurns).mockResolvedValue(Array.from({ length: 50 }, (_, index) => turn(index)));
  });

  it("ne flip pas si warm-up encore actif", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      setter_validation: "TRUE",
      setter_validation_locked_until: "2026-05-20T00:00:00.000Z",
    });

    await expect(graduateCampaign("cmp_1")).resolves.toMatchObject({
      graduated: false,
      reason: "warmup_active",
    });
    expect(updateConfigValue).not.toHaveBeenCalled();
  });

  it("ne flip pas si setter_validation_locked_until est absent", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      setter_validation: "TRUE",
    });

    await expect(graduateCampaign("cmp_1")).resolves.toMatchObject({
      graduated: false,
      reason: "warmup_active",
    });
    expect(updateConfigValue).not.toHaveBeenCalled();
  });

  it("ne flip pas avec moins de 50 turns labellisés", async () => {
    vi.mocked(getAllConversationTurns).mockResolvedValueOnce(Array.from({ length: 49 }, (_, index) => turn(index)));

    await expect(graduateCampaign("cmp_1")).resolves.toMatchObject({
      graduated: false,
      accuracy: 1,
      reason: "insufficient_turns",
    });
    expect(updateConfigValue).not.toHaveBeenCalled();
  });

  it("ne flip pas si accuracy < 85%", async () => {
    vi.mocked(getAllConversationTurns).mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, index) => turn(index, index < 35 ? {} : { edited_from_draft: "true" }))
    );

    await expect(graduateCampaign("cmp_1")).resolves.toMatchObject({
      graduated: false,
      accuracy: 0.7,
      reason: "low_accuracy",
    });
    expect(updateConfigValue).not.toHaveBeenCalled();
  });

  it("flip setter_validation à FALSE si accuracy >= 85%", async () => {
    await expect(graduateCampaign("cmp_1")).resolves.toMatchObject({
      graduated: true,
      accuracy: 1,
    });
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "setter_validation", "FALSE");
    expect(sendSetterGraduationEmail).toHaveBeenCalledWith(expect.objectContaining({
      campaignId: "cmp_1",
      graduated: true,
    }));
  });

  it("désactive le mode warm-up automatiquement après J14", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      setter_validation: "TRUE",
      setter_validation_locked_until: "2026-05-17T00:00:00.000Z",
      warmup_campaign: "TRUE",
      warmup_started_at: "2026-05-01T00:00:00.000Z",
    });

    await graduateCampaign("cmp_1");

    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "warmup_campaign", "FALSE");
    expect(updateConfigValue).toHaveBeenCalledWith("sheet_1", "cmp_1", "warmup_completed_at", "2026-05-18T10:00:00.000Z");
  });

  it("envoie une alerte si accuracy basse après 21 jours", async () => {
    vi.mocked(readCampaignConfig).mockResolvedValueOnce({
      setter_validation: "TRUE",
      setter_validation_locked_until: "2026-04-20T00:00:00.000Z",
    });
    vi.mocked(getAllConversationTurns).mockResolvedValueOnce(
      Array.from({ length: 50 }, (_, index) => turn(index, index < 35 ? {} : { edited_from_draft: "true" }))
    );

    await graduateCampaign("cmp_1");

    expect(sendSetterGraduationEmail).toHaveBeenCalledWith(expect.objectContaining({
      campaignId: "cmp_1",
      graduated: false,
      reason: "low_accuracy",
    }));
  });
});
