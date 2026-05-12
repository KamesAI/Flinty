import { describe, expect, it } from "vitest";
import { buildCampaignCarouselItems } from "./campaign-row-carousel";

describe("campaign row carousel", () => {
  it("duplique les etapes pour permettre un defilement fluide sans scrollbar", () => {
    const items = buildCampaignCarouselItems([
      { key: "raw", label: "Raw", value: 0, fillPercent: 100 },
      { key: "qualified", label: "Qualifiés", value: 0, fillPercent: 0 },
      { key: "contacted", label: "Contactés", value: 0, fillPercent: 0 },
      { key: "replies", label: "Réponses", value: 0, fillPercent: 0 },
    ]);

    expect(items).toHaveLength(8);
    expect(items[0].id).toBe("raw-0");
    expect(items[4].id).toBe("raw-1");
  });
});
