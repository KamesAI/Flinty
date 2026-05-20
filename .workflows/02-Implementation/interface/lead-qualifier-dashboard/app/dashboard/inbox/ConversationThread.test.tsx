import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConversationThread } from "./ConversationThread";

vi.stubGlobal("React", React);

describe("ConversationThread", () => {
  it("rend un feed accessible avec badges canal, draft et dates relatives", () => {
    const html = renderToStaticMarkup(
      <ConversationThread
        turns={[
          {
            turn_id: "turn_1",
            lead_id: "lead_1",
            channel: "linkedin",
            role: "prospect",
            content: "On peut échanger sur LinkedIn ?",
            sent_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            intent: "interested",
            validated_by: "",
            edited_from_draft: "false",
          },
          {
            turn_id: "turn_2",
            lead_id: "lead_1",
            channel: "email",
            role: "setter",
            content: "Oui, voici une proposition.",
            sent_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            intent: "interested",
            validated_by: "",
            edited_from_draft: "false",
          },
        ]}
        leadName="Jeanne Dupont"
      />
    );

    expect(html).toContain('role="feed"');
    expect(html).toContain("Conversation avec Jeanne Dupont");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Email");
    expect(html).toContain("border-l-[#0a66c2]");
    expect(html).toContain("En attente de validation");
    expect(html).toContain("Intéressé");
    expect(html).toContain("il y a");
  });

  it("affiche '✓ Envoyé' sur un message setter validé", () => {
    const html = renderToStaticMarkup(
      <ConversationThread
        turns={[
          {
            turn_id: "turn_1",
            lead_id: "lead_1",
            channel: "email",
            role: "setter",
            content: "Voici ma réponse.",
            sent_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            intent: "meeting_ready",
            validated_by: "Thomas",
            edited_from_draft: "false",
          },
        ]}
        leadName="Jean Martin"
      />
    );

    expect(html).toContain("Envoyé");
    expect(html).toContain("Prêt pour RDV");
    expect(html).not.toContain("En attente de validation");
  });
});
