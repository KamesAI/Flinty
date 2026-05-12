import { describe, expect, it } from "vitest";
import {
  CAMPAIGN_QUESTIONS,
  currentQuestion,
  getDraftAnswer,
  goBack,
  initialChatState,
  isComplete,
  submitAnswer,
} from "./chat-state";

describe("CAMPAIGN_QUESTIONS", () => {
  it("expose les 8 questions stratégiques dans l'ordre attendu", () => {
    expect(CAMPAIGN_QUESTIONS.map((q) => q.key)).toEqual([
      "secteur_cible",
      "pain_points",
      "taille_entreprise",
      "budget_cible",
      "zones_geo",
      "proposition_valeur",
      "signaux_achat",
      "signaux_exclusion",
    ]);
  });
});

describe("chat-state", () => {
  it("démarre à la question 0 sans réponses", () => {
    const state = initialChatState();
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(currentQuestion(state)?.key).toBe("secteur_cible");
  });

  it("ajoute la réponse trimmed et passe à la question suivante", () => {
    const state = submitAnswer(initialChatState(), "  Plombiers  ");
    expect(state.answers).toEqual(["Plombiers"]);
    expect(state.currentIndex).toBe(1);
    expect(currentQuestion(state)?.key).toBe("pain_points");
  });

  it("ignore une réponse vide", () => {
    const state = submitAnswer(initialChatState(), "   ");
    expect(state.answers).toEqual([]);
    expect(state.currentIndex).toBe(0);
  });

  it("Retour décrémente l'index sans perdre les réponses", () => {
    let state = submitAnswer(initialChatState(), "Plombiers");
    state = submitAnswer(state, "Manque de leads qualifiés");
    state = goBack(state);
    expect(state.currentIndex).toBe(1);
    expect(state.answers).toEqual(["Plombiers", "Manque de leads qualifiés"]);
    expect(getDraftAnswer(state)).toBe("Manque de leads qualifiés");
  });

  it("Retour à l'index 0 ne change rien", () => {
    const state = goBack(initialChatState());
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
  });

  it("re-soumettre après un Retour écrase la réponse existante", () => {
    let state = submitAnswer(initialChatState(), "Plombiers");
    state = submitAnswer(state, "Pain v1");
    state = goBack(state);
    state = submitAnswer(state, "Pain v2");
    expect(state.answers).toEqual(["Plombiers", "Pain v2"]);
    expect(state.currentIndex).toBe(2);
  });

  it("isComplete passe à true après 8 réponses", () => {
    let state = initialChatState();
    for (let i = 0; i < 8; i++) state = submitAnswer(state, `réponse ${i + 1}`);
    expect(isComplete(state)).toBe(true);
    expect(currentQuestion(state)).toBeNull();
  });

  it("isComplete reste false tant qu'il manque une réponse", () => {
    let state = initialChatState();
    for (let i = 0; i < 7; i++) state = submitAnswer(state, `r${i}`);
    expect(isComplete(state)).toBe(false);
  });
});
