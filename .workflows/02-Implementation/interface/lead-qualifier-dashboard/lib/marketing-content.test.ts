import { describe, expect, it } from "vitest";
import {
  BOOK_DEMO,
  COMPARISON_COMPETITORS,
  COMPARISON_DISCLAIMER,
  COMPARISON_ROWS,
  FAQ_ITEMS,
  FEATURES,
  FUNNEL_NOTE,
  FUNNEL_STEPS,
  HOW_IT_WORKS_STEPS,
  PRICING_PLANS,
  RESULT_STATS,
} from "./marketing-content";

describe("marketing-content", () => {
  it("expose 6 fonctionnalités avec des ids uniques et 3 bullets chacune", () => {
    expect(FEATURES).toHaveLength(6);
    const ids = FEATURES.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const feature of FEATURES) {
      expect(feature.title.length).toBeGreaterThan(0);
      expect(feature.bullets).toHaveLength(3);
    }
  });

  it("expose 3 plans dont exactement un « Populaire »", () => {
    expect(PRICING_PLANS).toHaveLength(3);
    expect(PRICING_PLANS.filter((p) => p.popular)).toHaveLength(1);
    for (const plan of PRICING_PLANS) {
      expect(plan.monthlyPrice).toBeGreaterThan(0);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });

  it("expose des plans triés par prix croissant", () => {
    const prices = PRICING_PLANS.map((p) => p.monthlyPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("expose 4 étapes « comment ça marche » numérotées 1→4", () => {
    expect(HOW_IT_WORKS_STEPS).toHaveLength(4);
    expect(HOW_IT_WORKS_STEPS.map((s) => s.step)).toEqual([1, 2, 3, 4]);
  });

  it("expose des stats avec sous-label et barre de progression valides", () => {
    expect(RESULT_STATS.length).toBeGreaterThanOrEqual(3);
    for (const stat of RESULT_STATS) {
      expect(stat.value.length).toBeGreaterThan(0);
      expect(stat.sublabel.length).toBeGreaterThan(0);
      expect(stat.progress).toBeGreaterThan(0);
      expect(stat.progress).toBeLessThanOrEqual(100);
    }
  });

  it("expose un funnel de campagne type strictement décroissant avec note d'honnêteté", () => {
    expect(FUNNEL_STEPS.length).toBeGreaterThanOrEqual(4);
    for (let i = 1; i < FUNNEL_STEPS.length; i++) {
      expect(FUNNEL_STEPS[i].value).toBeLessThan(FUNNEL_STEPS[i - 1].value);
    }
    // Transparence : c'est une projection, pas des métriques clients mesurées
    expect(FUNNEL_NOTE.toLowerCase()).toContain("projection");
  });

  it("expose un comparatif dont les cellules pointent vers des concurrents déclarés", () => {
    expect(COMPARISON_COMPETITORS.length).toBeGreaterThanOrEqual(3);
    expect(COMPARISON_ROWS.length).toBeGreaterThanOrEqual(5);
    const competitorIds = new Set(COMPARISON_COMPETITORS.map((c) => c.id));
    for (const row of COMPARISON_ROWS) {
      expect(row.feature.length).toBeGreaterThan(0);
      expect(Object.keys(row.competitors).sort()).toEqual([...competitorIds].sort());
    }
    expect(COMPARISON_DISCLAIMER.length).toBeGreaterThan(0);
  });

  it("expose le contenu de la section démo", () => {
    expect(BOOK_DEMO.title.length).toBeGreaterThan(0);
    expect(BOOK_DEMO.bullets.length).toBeGreaterThanOrEqual(3);
  });

  it("expose au moins 6 questions FAQ avec réponses non vides", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(6);
    for (const item of FAQ_ITEMS) {
      expect(item.question.length).toBeGreaterThan(0);
      expect(item.answer.length).toBeGreaterThan(0);
    }
  });
});
