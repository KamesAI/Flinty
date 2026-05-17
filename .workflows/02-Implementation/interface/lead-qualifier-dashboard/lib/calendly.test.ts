import { describe, expect, it } from "vitest";
import {
  formatSlotsNatural,
  parseCalendlySlots,
  type RawCalendlyAvailability,
} from "./calendly";

const PARIS_TZ = "Europe/Paris";

describe("parseCalendlySlots", () => {
  it("extrait 3 premiers slots d'une réponse Calendly", () => {
    const raw: RawCalendlyAvailability = {
      collection: [
        { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
        { start_time: "2026-05-15T10:30:00.000000Z", scheduling_url: "https://calendly.com/e/2" },
        { start_time: "2026-05-15T14:00:00.000000Z", scheduling_url: "https://calendly.com/e/3" },
        { start_time: "2026-05-16T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/4" },
      ],
    };
    const slots = parseCalendlySlots(raw, 3);
    expect(slots).toHaveLength(3);
    expect(slots[0].start_time).toBe("2026-05-15T09:00:00.000000Z");
    expect(slots[0].scheduling_url).toBe("https://calendly.com/e/1");
  });

  it("retourne moins si moins disponible", () => {
    const raw: RawCalendlyAvailability = {
      collection: [
        { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
      ],
    };
    const slots = parseCalendlySlots(raw, 3);
    expect(slots).toHaveLength(1);
  });

  it("retourne vide si collection vide", () => {
    expect(parseCalendlySlots({ collection: [] }, 3)).toHaveLength(0);
  });
});

describe("formatSlotsNatural", () => {
  it("formate 3 slots en texte naturel français", () => {
    const slots = [
      { start_time: "2026-05-15T09:00:00.000000Z", scheduling_url: "https://calendly.com/e/1" },
      { start_time: "2026-05-16T14:30:00.000000Z", scheduling_url: "https://calendly.com/e/2" },
      { start_time: "2026-05-18T10:00:00.000000Z", scheduling_url: "https://calendly.com/e/3" },
    ];
    const text = formatSlotsNatural(slots, PARIS_TZ);
    // Should contain day and time info
    expect(text).toContain("https://calendly.com/e/1");
    expect(text).toContain("https://calendly.com/e/2");
    expect(text).toContain("https://calendly.com/e/3");
    // Should mention vendredi 15 mai (UTC+2 → 11h Paris)
    expect(text.toLowerCase()).toMatch(/vendredi|samedi|lundi/);
  });

  it("retourne message si aucun slot", () => {
    const text = formatSlotsNatural([], PARIS_TZ);
    expect(text).toBeTruthy();
    expect(text.length).toBeGreaterThan(10);
  });
});
