import { describe, it, expect } from "vitest";
import { deriveFormDefaults } from "./campaign-launch";

describe("deriveFormDefaults", () => {
  const fullAnswers = [
    "Plombiers",           // 0 secteur_cible
    "Appels manqués",      // 1 pain_points
    "1-10 salariés",       // 2 taille_entreprise
    "200-500€/mois",       // 3 budget_cible
    "Bordeaux + Bayonne",  // 4 zones_geo
    "IA qui ne rate plus aucun appel", // 5 proposition_valeur
    "Site daté",           // 6 signaux_achat
    "Pas de site",         // 7 signaux_exclusion
  ];

  it("extracts secteur from answer[0]", () => {
    const d = deriveFormDefaults(fullAnswers);
    expect(d.secteur).toBe("Plombiers");
  });

  it("extracts localisation from answer[4]", () => {
    const d = deriveFormDefaults(fullAnswers);
    expect(d.localisation).toBe("Bordeaux + Bayonne");
  });

  it("extracts offre_kames from answer[5]", () => {
    const d = deriveFormDefaults(fullAnswers);
    expect(d.offre_kames).toBe("IA qui ne rate plus aucun appel");
  });

  it("extracts taille_equipe from answer[2]", () => {
    const d = deriveFormDefaults(fullAnswers);
    expect(d.taille_equipe).toBe("1-10 salariés");
  });

  it("returns empty strings for missing answers", () => {
    const d = deriveFormDefaults([]);
    expect(d.secteur).toBe("");
    expect(d.localisation).toBe("");
    expect(d.offre_kames).toBe("");
    expect(d.taille_equipe).toBe("");
  });

  it("generates a nom from secteur and localisation", () => {
    const d = deriveFormDefaults(fullAnswers);
    expect(d.nom).toContain("Plombiers");
    expect(d.nom).toContain("Bordeaux");
  });

  it("generates nom from secteur only when localisation is absent", () => {
    const partial = ["Avocats", "pain", "1-10", "200€"];
    const d = deriveFormDefaults(partial);
    expect(d.nom).toContain("Avocats");
  });
});
