import { describe, expect, it } from "vitest";
import {
  DASHBOARD_APP_TITLE,
  DASHBOARD_APP_SUBTITLE,
  dashboardSidebarGroups,
} from "./dashboard-sidebar-config";

describe("dashboard-sidebar-config", () => {
  it("affiche le titre du CRM dans la sidebar", () => {
    expect(DASHBOARD_APP_TITLE).toBe("Flinty");
    expect(DASHBOARD_APP_SUBTITLE).toBe("Lead gen dashboard");
  });

  it("adapte les vraies sections du CRM au layout de la sidebar", () => {
    expect(dashboardSidebarGroups.flatMap((group) => group.items.map((item) => item.label))).toEqual([
      "Dashboard",
      "Campagnes",
      "Configuration",
      "Messagerie",
      "Calendrier",
      "Donnees",
    ]);
  });

  it("ne garde plus d'action Nouvelle campagne dans la sidebar", () => {
    expect(dashboardSidebarGroups).toHaveLength(1);
    expect(
      dashboardSidebarGroups.flatMap((group) => group.items.map((item) => item.href))
    ).not.toContain("/dashboard/campaigns/new");
  });
});
