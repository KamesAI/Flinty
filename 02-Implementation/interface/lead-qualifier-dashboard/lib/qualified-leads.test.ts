import { describe, it, expect } from "vitest";
import { parseQualifiedLeads } from "./qualified-leads";

describe("parseQualifiedLeads", () => {
  it("mappe A2:U vers les champs enrichis", () => {
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
      ],
    ];
    const [lead] = parseQualifiedLeads(rows);
    expect(lead?.score_reason).toBe("raison");
    expect(lead?.personalized_hook).toBe("hook");
    expect(lead?.web_quality_score).toBe("88");
  });
});
