import { describe, expect, it } from "vitest";
import { buildCampaignRowModel, formatCampaignRate } from "./campaign-row-model";

describe("campaign row model", () => {
  it("retourne un statut en cours prioritaire sur le statut brut", () => {
    const model = buildCampaignRowModel({
      name: "Outbound Bordeaux",
      subtitle: "Agences · Fondateur · Bordeaux",
      status: "active",
      stats: {
        raw: 120,
        qualified: 42,
        contacted: 18,
        replies: 6,
      },
      openRate: 61.4,
      replyRate: 9.8,
      isGenerating: true,
    });

    expect(model.status.label).toBe("En cours");
    expect(model.status.tone).toBe("generating");
    expect(model.stages.map((stage) => stage.label)).toEqual([
      "Raw",
      "Qualifiés",
      "Contactés",
      "Réponses",
    ]);
  });

  it("calcule des pourcentages de pipeline bornés pour chaque étape", () => {
    const model = buildCampaignRowModel({
      name: "Outbound Paris",
      subtitle: "Cabinets · Gérant · Paris",
      status: "inactive",
      stats: {
        raw: 80,
        qualified: 20,
        contacted: 10,
        replies: 0,
      },
      openRate: 34,
      replyRate: 0,
      isGenerating: false,
    });

    expect(model.stages.map((stage) => stage.fillPercent)).toEqual([100, 25, 12.5, 0]);
    expect(model.connectors.map((connector) => connector.fillPercent)).toEqual([25, 12.5, 0]);
    expect(model.status.label).toBe("Inactive");
  });

  it("formate les taux en pourcentages lisibles", () => {
    expect(formatCampaignRate(42)).toBe("42%");
    expect(formatCampaignRate(42.35)).toBe("42,4%");
  });
});
