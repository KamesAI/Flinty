import { describe, expect, it } from "vitest";
import { buildPremiumStatsCards } from "./premium-stats";

describe("buildPremiumStatsCards", () => {
  it("retourne les 4 cartes KPI du dashboard dans le bon ordre", () => {
    const cards = buildPremiumStatsCards({
      campaignsCount: 7,
      repliedCount: 0,
      avgOpenRate: 0,
      meetingsCount: 0,
    });

    expect(cards.map((card) => card.label)).toEqual([
      "Campagnes actives",
      "Leads qualifiés",
      "Taux d'ouverture",
      "Meetings bookés",
    ]);
  });

  it("formate les valeurs et sous-libelles attendus", () => {
    const cards = buildPremiumStatsCards({
      campaignsCount: 7,
      repliedCount: 23,
      avgOpenRate: 42,
      meetingsCount: 3,
    });

    expect(cards).toMatchObject([
      { value: "7", sublabel: "au total" },
      { value: "23", sublabel: "cette semaine" },
      { value: "42%", sublabel: "moyenne globale" },
      { value: "3", sublabel: "sur la semaine" },
    ]);
  });
});
