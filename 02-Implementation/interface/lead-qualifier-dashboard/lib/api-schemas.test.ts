import { describe, it, expect } from "vitest";
import { generateIcpBodySchema, postCampaignBodySchema } from "./api-schemas";

describe("postCampaignBodySchema", () => {
  const base = {
    nom: "Ma campagne",
    secteur: "SaaS",
    localisation: "Paris",
    offre_kames: "Audit",
    icp_md: "# ICP",
    score_minimum: 60,
  };

  it("accepte un payload valide", () => {
    const r = postCampaignBodySchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it("rejette icp_md vide ou blanc", () => {
    expect(postCampaignBodySchema.safeParse({ ...base, icp_md: "" }).success).toBe(
      false
    );
    expect(postCampaignBodySchema.safeParse({ ...base, icp_md: "   " }).success).toBe(
      false
    );
  });

  it("rejette score_minimum hors 0–100", () => {
    expect(
      postCampaignBodySchema.safeParse({ ...base, score_minimum: 101 }).success
    ).toBe(false);
  });
});

describe("generateIcpBodySchema", () => {
  it("exige 8 réponses", () => {
    expect(
      generateIcpBodySchema.safeParse({ answers: Array(7).fill("x") }).success
    ).toBe(false);
    expect(
      generateIcpBodySchema.safeParse({ answers: Array(8).fill("a") }).success
    ).toBe(true);
  });
});
