import { describe, expect, it } from "vitest";
import {
  isCampaignActiveForDashboardKpi,
  isCampaignShownInMainCampaignsList,
  mapCampaignStatutToRowStatus,
} from "./dashboard-campaigns";

describe("dashboard-campaigns", () => {
  it("isCampaignActiveForDashboardKpi : actives, génération, planifiées et en pause — pas archivées ni terminées", () => {
    expect(isCampaignActiveForDashboardKpi("active")).toBe(true);
    expect(isCampaignActiveForDashboardKpi("generating")).toBe(true);
    expect(isCampaignActiveForDashboardKpi("scheduled")).toBe(true);
    expect(isCampaignActiveForDashboardKpi("paused")).toBe(true);
    expect(isCampaignActiveForDashboardKpi("archived")).toBe(false);
    expect(isCampaignActiveForDashboardKpi("completed")).toBe(false);
  });

  it("isCampaignShownInMainCampaignsList : même ensemble que le KPI (pas d’archivées / terminées dans Main campaigns)", () => {
    expect(isCampaignShownInMainCampaignsList("active")).toBe(true);
    expect(isCampaignShownInMainCampaignsList("generating")).toBe(true);
    expect(isCampaignShownInMainCampaignsList("scheduled")).toBe(true);
    expect(isCampaignShownInMainCampaignsList("paused")).toBe(true);
    expect(isCampaignShownInMainCampaignsList("archived")).toBe(false);
    expect(isCampaignShownInMainCampaignsList("completed")).toBe(false);
  });

  it("mapCampaignStatutToRowStatus : ne mappe plus generating/scheduled vers inactive", () => {
    expect(mapCampaignStatutToRowStatus("active")).toBe("active");
    expect(mapCampaignStatutToRowStatus("generating")).toBe("active");
    expect(mapCampaignStatutToRowStatus("scheduled")).toBe("active");
    expect(mapCampaignStatutToRowStatus("paused")).toBe("paused");
    expect(mapCampaignStatutToRowStatus("completed")).toBe("completed");
    expect(mapCampaignStatutToRowStatus("archived")).toBe("inactive");
  });
});
