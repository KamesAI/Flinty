import { describe, it, expect } from "vitest";
import { isAllowedEmailStatut } from "./lead-email-status";

describe("isAllowedEmailStatut", () => {
  it("accepte tous les statuts Kanban / email v3", () => {
    const ok = [
      "new",
      "contacted",
      "relance_1",
      "relance_2",
      "opened",
      "clicked",
      "replied",
      "bounced",
      "disqualified",
    ];
    for (const s of ok) {
      expect(isAllowedEmailStatut(s)).toBe(true);
    }
  });

  it("rejette une valeur inconnue", () => {
    expect(isAllowedEmailStatut("spam")).toBe(false);
    expect(isAllowedEmailStatut("")).toBe(false);
  });
});
