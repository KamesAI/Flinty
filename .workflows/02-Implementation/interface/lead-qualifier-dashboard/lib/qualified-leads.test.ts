import { describe, it, expect } from "vitest";
import { parseQualifiedLeads } from "./qualified-leads";

describe("parseQualifiedLeads", () => {
  it("mappe A2:AA vers les champs enrichis et les champs gérant", () => {
    const rows = [
      [
        "l1",
        "c1",
        "Co",
        "site.fr",
        "Lyon",
        "90",
        "raison",
        "e@co.fr",
        "06",
        "Anne",
        "CTO",
        "Tech",
        "5",
        "oui",
        "h",
        "seed",
        "buy",
        "hook",
        "opened",
        "88",
        "signals",
        "Co",
        "Anne",
        "Durand",
        "anne.durand@co.fr",
        "nominatif_gerant",
        "high",
      ],
    ];
    const [lead] = parseQualifiedLeads(rows);
    expect(lead?.score_reason).toBe("raison");
    expect(lead?.personalized_hook).toBe("hook");
    expect(lead?.web_quality_score).toBe("88");
    expect(lead?.societe).toBe("Co");
    expect(lead?.prenom_gerant).toBe("Anne");
    expect(lead?.nom_gerant).toBe("Durand");
    expect(lead?.email_gerant).toBe("anne.durand@co.fr");
    expect(lead?.email_type).toBe("nominatif_gerant");
  });

  it("garde un fallback lisible pour les anciennes lignes A2:U", () => {
    const [lead] = parseQualifiedLeads([
      [
        "l1", "c1", "Co", "site.fr", "Lyon", "90", "raison", "e@co.fr",
        "06", "Anne", "CTO", "Tech", "5", "oui", "h", "seed", "buy",
        "hook", "opened", "88", "signals",
      ],
    ]);

    expect(lead?.societe).toBe("Co");
    expect(lead?.prenom_gerant).toBe("Anne");
    expect(lead?.nom_gerant).toBe("");
    expect(lead?.email_gerant).toBe("e@co.fr");
  });
});
