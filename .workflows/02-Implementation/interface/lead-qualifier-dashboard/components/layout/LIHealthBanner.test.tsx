import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  LIHealthBanner,
  formatLinkedInHealthEta,
  getLinkedInHealthStatusLabel,
} from "./LIHealthBanner";

describe("LIHealthBanner", () => {
  it("ne rend rien pendant le rendu serveur initial", () => {
    expect(renderToStaticMarkup(<LIHealthBanner />)).toBe("");
  });

  it("mappe les pauses LinkedIn lisibles", () => {
    expect(getLinkedInHealthStatusLabel("paused_captcha")).toContain("Captcha LinkedIn");
    expect(getLinkedInHealthStatusLabel("paused_low_accept")).toContain("Taux d'acceptation");
  });

  it("calcule une ETA de reprise depuis date de pause et TTL", () => {
    const eta = formatLinkedInHealthEta("paused_captcha", "2026-05-18T08:00:00.000Z", new Date("2026-05-18T09:00:00.000Z"));
    expect(eta).toBe("Reprise automatique dans 23h");
  });
});
