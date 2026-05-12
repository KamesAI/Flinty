import { describe, expect, it } from "vitest";
import { buildCampaignOverviewModel } from "./campaign-overview";

describe("buildCampaignOverviewModel", () => {
  it("calcule le sous-texte et les stats de campagne", () => {
    const model = buildCampaignOverviewModel({
      nom: "Test Plombiers Lyon",
      secteur: "plombier",
      localisation: "Lyon",
      statut: "generating",
      total_leads_raw: "40",
      total_leads_qualified: "12",
      emails_envoyés: "10",
      taux_ouverture: "42",
      taux_réponse: "10",
    });

    expect(model.subtitle).toBe("Automatisation IA · plombier · Lyon");
    expect(model.funnelStats).toEqual([
      { label: "Raw", value: 40 },
      { label: "Qualifies", value: 12 },
      { label: "Contactes", value: 10 },
      { label: "Reponses", value: 1 },
    ]);
    expect(model.rateStats).toEqual([
      { label: "Ouverture", value: "42%" },
      { label: "Reponse", value: "10%" },
    ]);
  });

  it("retourne un ton de badge coherent avec le statut", () => {
    expect(
      buildCampaignOverviewModel({
        nom: "A",
        secteur: "agence",
        localisation: "Lyon",
        statut: "active",
        total_leads_raw: "0",
        total_leads_qualified: "0",
        emails_envoyés: "0",
        taux_ouverture: "0",
        taux_réponse: "0",
      }).statusTone
    ).toBe("success");

    expect(
      buildCampaignOverviewModel({
        nom: "A",
        secteur: "agence",
        localisation: "Lyon",
        statut: "generating",
        total_leads_raw: "0",
        total_leads_qualified: "0",
        emails_envoyés: "0",
        taux_ouverture: "0",
        taux_réponse: "0",
      }).statusTone
    ).toBe("info");
  });
});
