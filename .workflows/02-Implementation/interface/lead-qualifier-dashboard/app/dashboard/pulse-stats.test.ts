import { describe, expect, it } from "vitest";
import { buildPulseStats } from "./pulse-stats";

describe("buildPulseStats", () => {
  it("construit les 4 metriques Flinty avec un accent sur la stat campagnes", () => {
    const stats = buildPulseStats({
      campaignsCount: 7,
      repliedCount: 0,
      avgOpenRate: 0,
      meetingsCount: 0,
    });

    expect(stats).toHaveLength(4);
    expect(stats[0].label).toBe("Campagnes actives");
    expect(stats[0].icon).toBe("layers");
    expect(stats[0].value).toBe("7");
    expect(stats[0].sublabel).toBe("au total");
    expect(stats[0].accent).toBe(true);
    expect(stats[1].label).toBe("Emails recus");
    expect(stats[1].icon).toBe("inbox");
    expect(stats[1].sublabel).toBe("0 a repondre");
    expect(stats[2].icon).toBe("trend");
    expect(stats[2].value).toBe("0%");
    expect(stats[3].icon).toBe("calendar");
    expect(stats[3].sublabel).toBe("sur la semaine en cours");
  });
});
