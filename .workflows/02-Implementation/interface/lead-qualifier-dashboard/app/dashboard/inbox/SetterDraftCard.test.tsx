import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SetterDraftCard } from "./SetterDraftCard";

vi.stubGlobal("React", React);

describe("SetterDraftCard", () => {
  it("affiche intent, confidence, reasoning, diff et modal d'escalade", () => {
    const html = renderToStaticMarkup(
      <SetterDraftCard
        leadId="lead_1"
        turn={{
          turn_id: "turn_1",
          lead_id: "lead_1",
          channel: "email",
          role: "setter",
          content: "Merci pour votre retour.",
          sent_at: "2026-05-15T10:00:00.000Z",
          intent: "interested",
          validated_by: "",
          edited_from_draft: "false",
        }}
        confidence={0.92}
        reasoning="Le prospect demande un prochain échange."
      />
    );

    expect(html).toContain("interested");
    expect(html).toContain("92%");
    expect(html).toContain("Raisonnement");
    expect(html).toContain("Le prospect demande");
    expect(html).toContain("Diff");
    expect(html).toContain("Confirmer l’escalade");
    expect(html).toContain("Enter");
    expect(html).toContain("Escape");
  });
});
