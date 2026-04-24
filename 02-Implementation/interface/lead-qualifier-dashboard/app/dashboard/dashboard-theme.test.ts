import { describe, expect, it } from "vitest";
import {
  DASHBOARD_THEME_STORAGE_KEY,
  getDashboardThemeCssVariables,
  resolveDashboardTheme,
  toggleDashboardSidebar,
  toggleDashboardTheme,
} from "./dashboard-theme";

describe("dashboard-theme", () => {
  it("expose une cle de storage stable pour memoriser le choix utilisateur", () => {
    expect(DASHBOARD_THEME_STORAGE_KEY).toBe("lead-gen-dashboard-theme");
  });

  it("retourne le theme sauvegarde quand il est valide", () => {
    expect(resolveDashboardTheme("dark", false)).toBe("dark");
    expect(resolveDashboardTheme("light", true)).toBe("light");
  });

  it("retombe sur la preference systeme quand aucune valeur valide n'est stockee", () => {
    expect(resolveDashboardTheme(null, true)).toBe("dark");
    expect(resolveDashboardTheme(undefined, false)).toBe("light");
    expect(resolveDashboardTheme("invalid", true)).toBe("dark");
  });

  it("bascule proprement entre light et dark", () => {
    expect(toggleDashboardTheme("light")).toBe("dark");
    expect(toggleDashboardTheme("dark")).toBe("light");
  });

  it("ouvre ou ferme le panneau desktop via un toggle simple", () => {
    expect(toggleDashboardSidebar(true)).toBe(false);
    expect(toggleDashboardSidebar(false)).toBe(true);
  });

  it("expose des variables CSS de theme pour les surfaces et textes du dashboard", () => {
    const lightVars = getDashboardThemeCssVariables("light");
    const darkVars = getDashboardThemeCssVariables("dark");

    expect(lightVars["--dashboard-text-primary"]).toBeDefined();
    expect(lightVars["--dashboard-card-bg"]).toBeDefined();
    expect(lightVars["--dashboard-border"]).toBeDefined();
    expect(darkVars["--dashboard-text-primary"]).toBeDefined();
    expect(darkVars["--dashboard-card-bg"]).toBeDefined();
    expect(darkVars["--dashboard-border"]).toBeDefined();
    expect(lightVars["--dashboard-text-primary"]).not.toBe(darkVars["--dashboard-text-primary"]);
  });
});
