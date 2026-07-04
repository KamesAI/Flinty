import { describe, expect, it } from "vitest";
import { ANNUAL_DISCOUNT, displayedMonthlyPrice, formatEuro } from "./pricing-model";

describe("pricing-model", () => {
  it("expose une remise annuelle de 20 %", () => {
    expect(ANNUAL_DISCOUNT).toBe(0.2);
  });

  describe("displayedMonthlyPrice", () => {
    it("retourne le prix mensuel tel quel en facturation mensuelle", () => {
      expect(displayedMonthlyPrice(49, "monthly")).toBe(49);
      expect(displayedMonthlyPrice(99, "monthly")).toBe(99);
    });

    it("applique −20 % arrondi à l'euro en facturation annuelle", () => {
      expect(displayedMonthlyPrice(49, "annual")).toBe(39); // 39.2 → 39
      expect(displayedMonthlyPrice(99, "annual")).toBe(79); // 79.2 → 79
      expect(displayedMonthlyPrice(149, "annual")).toBe(119); // 119.2 → 119
    });
  });

  describe("formatEuro", () => {
    it("formate un montant entier en euros à la française", () => {
      expect(formatEuro(49)).toBe("49 €");
      expect(formatEuro(119)).toBe("119 €");
    });
  });
});
