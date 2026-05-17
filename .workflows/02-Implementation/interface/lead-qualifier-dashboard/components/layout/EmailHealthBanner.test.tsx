import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EmailHealthBanner,
  formatEmailHealthCheckedAt,
  getEmailHealthStatusLabel,
} from "./EmailHealthBanner";

describe("EmailHealthBanner", () => {
  it("ne rend rien pendant le rendu serveur initial", () => {
    expect(renderToStaticMarkup(<EmailHealthBanner />)).toBe("");
  });

  it("mappe les raisons de pause attendues", () => {
    expect(getEmailHealthStatusLabel("paused_high_bounce")).toContain("bounce 7j");
    expect(getEmailHealthStatusLabel("paused_high_complaint")).toContain("complaint 7j");
  });

  it("formate la date du dernier check en heure Paris", () => {
    expect(formatEmailHealthCheckedAt("2026-05-17T18:00:00.000Z")).toContain("20:00");
  });
});
