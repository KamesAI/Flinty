import { describe, expect, it } from "vitest";
import { getDashboardThemeCssVariables, toggleDashboardSidebar } from "./dashboard-theme";

describe("dashboard-theme", () => {
  it("ouvre ou ferme le panneau desktop via un toggle simple", () => {
    expect(toggleDashboardSidebar(true)).toBe(false);
    expect(toggleDashboardSidebar(false)).toBe(true);
  });

  it("expose des variables CSS mode clair pour les surfaces et textes du dashboard", () => {
    const vars = getDashboardThemeCssVariables();

    expect(vars["--dashboard-text-primary"]).toBe("#111111");
    expect(vars["--dashboard-card-bg"]).toBe("rgba(255, 255, 255, 0.92)");
    expect(vars["--dashboard-border"]).toBe("rgba(17, 17, 17, 0.08)");
  });
});
