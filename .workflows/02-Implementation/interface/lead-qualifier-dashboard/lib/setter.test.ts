import { describe, expect, it, vi } from "vitest";
import {
  parseIntentResponse,
  buildConversationContext,
  buildSystemPrompt,
  shouldEscalate,
  isAiQuestion,
  detectsAIQuestion,
  appendAIDisclosure,
  routeIntent,
  type SetterContext,
} from "./setter";
import type { IntentLabel } from "./types";

// ——— parseIntentResponse ———

describe("parseIntentResponse", () => {
  it("parse un JSON valide avec intent et confidence", () => {
    const raw = JSON.stringify({
      intent: "interested",
      confidence: 0.92,
      reasoning: "Prospect demande plus d'infos",
    });
    const result = parseIntentResponse(raw);
    expect(result.intent).toBe("interested");
    expect(result.confidence).toBe(0.92);
    expect(result.reasoning).toBeTruthy();
  });

  it("parse JSON avec markdown code block", () => {
    const raw = '```json\n{"intent":"meeting_ready","confidence":0.88,"reasoning":"Veut booker"}\n```';
    const result = parseIntentResponse(raw);
    expect(result.intent).toBe("meeting_ready");
    expect(result.confidence).toBe(0.88);
  });

  it("retourne off_topic avec confidence 0 si JSON invalide", () => {
    const result = parseIntentResponse("not valid json at all");
    expect(result.intent).toBe("off_topic");
    expect(result.confidence).toBe(0);
  });

  it("clamp confidence entre 0 et 1", () => {
    const raw = JSON.stringify({ intent: "interested", confidence: 1.5, reasoning: "x" });
    const result = parseIntentResponse(raw);
    expect(result.confidence).toBe(1);
  });

  it("accepte toutes les valeurs d'intent valides", () => {
    const intents: IntentLabel[] = [
      "interested", "objection_price", "objection_timing", "objection_need",
      "objection_trust", "meeting_ready", "off_topic", "unsubscribe", "hostile",
    ];
    for (const intent of intents) {
      const raw = JSON.stringify({ intent, confidence: 0.9, reasoning: "test" });
      const result = parseIntentResponse(raw);
      expect(result.intent).toBe(intent);
    }
  });

  it("fallback off_topic si intent inconnu", () => {
    const raw = JSON.stringify({ intent: "unknown_intent", confidence: 0.9, reasoning: "test" });
    const result = parseIntentResponse(raw);
    expect(result.intent).toBe("off_topic");
  });
});

// ——— shouldEscalate ———

describe("shouldEscalate", () => {
  it("escalade si unsubscribe", () => {
    expect(shouldEscalate("unsubscribe")).toBe(true);
  });

  it("escalade si hostile", () => {
    expect(shouldEscalate("hostile")).toBe(true);
  });

  it("pas d'escalade si interested", () => {
    expect(shouldEscalate("interested")).toBe(false);
  });

  it("escalade si confidence < 0.7", () => {
    expect(shouldEscalate("interested", 0.65)).toBe(true);
  });

  it("pas d'escalade si confidence >= 0.7", () => {
    expect(shouldEscalate("interested", 0.75)).toBe(false);
  });
});

// ——— isAiQuestion ———

describe("isAiQuestion", () => {
  it("détecte question IA directe", () => {
    expect(isAiQuestion("Êtes-vous une intelligence artificielle ?")).toBe(true);
    expect(isAiQuestion("vous êtes un bot ?")).toBe(true);
    expect(isAiQuestion("C'est une IA qui répond ?")).toBe(true);
    expect(isAiQuestion("Parlez-vous à un robot ?")).toBe(true);
  });

  it("expose detectsAIQuestion avec 5 vrais positifs FR/EN", () => {
    expect(detectsAIQuestion("Êtes-vous une IA ?")).toBe(true);
    expect(detectsAIQuestion("Are you an AI or a real person?")).toBe(true);
    expect(detectsAIQuestion("Vous êtes un robot ?")).toBe(true);
    expect(detectsAIQuestion("bot ?")).toBe(true);
    expect(detectsAIQuestion("c'est automatique ?")).toBe(true);
  });

  it("ne fausse pas sur message normal", () => {
    expect(isAiQuestion("Bonjour, intéressé par votre offre")).toBe(false);
    expect(isAiQuestion("Quel est votre tarif ?")).toBe(false);
  });

  it("garde 3 faux négatifs vérifiés", () => {
    expect(detectsAIQuestion("On utilise déjà de l'IA en interne.")).toBe(false);
    expect(detectsAIQuestion("Votre automatisation peut aider notre équipe ?")).toBe(false);
    expect(detectsAIQuestion("Je peux parler à Thomas demain ?")).toBe(false);
  });
});

describe("appendAIDisclosure", () => {
  it("ajoute le disclaimer EU AI Act avec la signature", () => {
    const result = appendAIDisclosure("Bien reçu, je vous propose mardi.", "Thomas");
    expect(result).toContain("Bien reçu");
    expect(result).toContain("assistant IA");
    expect(result).toContain("validée par Thomas");
  });

  it("n'ajoute pas deux fois le disclaimer", () => {
    const draft = "Réponse.\n\n— Cette réponse a été préparée par un assistant IA et validée par Thomas.";
    expect(appendAIDisclosure(draft, "Thomas")).toBe(draft);
  });
});

// ——— routeIntent ———

describe("routeIntent", () => {
  it("retourne escalate pour unsubscribe", () => {
    expect(routeIntent("unsubscribe", 0.9)).toBe("escalate");
  });

  it("retourne escalate pour hostile", () => {
    expect(routeIntent("hostile", 0.9)).toBe("escalate");
  });

  it("retourne escalate si confidence < 0.7", () => {
    expect(routeIntent("interested", 0.6)).toBe("escalate");
  });

  it("retourne generate pour interested", () => {
    expect(routeIntent("interested", 0.85)).toBe("generate");
  });

  it("retourne generate pour meeting_ready", () => {
    expect(routeIntent("meeting_ready", 0.9)).toBe("generate");
  });

  it("retourne generate pour objections", () => {
    expect(routeIntent("objection_price", 0.8)).toBe("generate");
    expect(routeIntent("objection_trust", 0.8)).toBe("generate");
  });

  it("retourne escalate pour off_topic", () => {
    expect(routeIntent("off_topic", 0.9)).toBe("escalate");
  });
});

// ——— buildConversationContext ———

describe("buildConversationContext", () => {
  const ctx: SetterContext = {
    lead: {
      lead_id: "lead_1",
      nom: "Dupont",
      prénom: "Jean",
      email: "jean@test.com",
      poste: "Directeur",
      secteur: "Immobilier",
      ville: "Paris",
      score: "82",
      site: "test.com",
      taille_equipe: "10",
      has_ia_services: "false",
    },
    campaign: {
      campaign_id: "camp_1",
      nom: "Campagne Test",
      offre_kames: "Automatisation IA pour PME",
      secteur: "Immobilier",
      localisation: "Paris",
      workspace_id: "workspace-a",
      setter_tone: "formal",
      setter_signature: "Thomas Callendreau, Kames AI",
      icp_md: "**ICP** : Directeurs PME 5–20p cherchant à automatiser",
    },
  };

  it("inclut le nom du lead", () => {
    const result = buildConversationContext(ctx);
    expect(result).toContain("Jean");
    expect(result).toContain("Dupont");
  });

  it("inclut l'offre", () => {
    const result = buildConversationContext(ctx);
    expect(result).toContain("Automatisation IA pour PME");
  });

  it("inclut l'ICP", () => {
    const result = buildConversationContext(ctx);
    expect(result).toContain("ICP");
  });
});

// ——— buildSystemPrompt ———

describe("buildSystemPrompt", () => {
  it("contient les instructions Voss", () => {
    const prompt = buildSystemPrompt("formal");
    expect(prompt).toMatch(/mirror|miroir|reformul/i);
  });

  it("contient contrainte ≤120 mots", () => {
    const prompt = buildSystemPrompt("casual");
    expect(prompt).toMatch(/120/);
  });

  it("contient instruction No-Oriented Question", () => {
    const prompt = buildSystemPrompt("formal");
    expect(prompt).toMatch(/no|question/i);
  });
});
