import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sheets", () => ({
  readIndex: vi.fn(async () => []),
  getMeetings: vi.fn(async () => []),
  parseIndexCampaigns: vi.fn(() => []),
  getAllLeadsV3: vi.fn(async () => []),
  getAnalyticsDailySnapshots: vi.fn(async () => []),
  indexCampaignToCampaign: vi.fn((campaign) => campaign),
}));

vi.mock("./kpi-sparks", () => ({
  buildDashboardKpiMetrics: vi.fn(() => ({
    deltas: {
      campaignsActive: 0,
      qualifiedLeads: 0,
      openRate: 0,
      meetingsBooked: 0,
    },
    sparks: {
      campaignsActive: [],
      qualifiedLeads: [],
      openRate: [],
      meetingsBooked: [],
    },
  })),
}));

vi.mock("@/components/dashboard/KpiGrid", () => ({
  KpiGrid: () => <section>kpi-grid</section>,
}));

vi.mock("@/components/dashboard/CampaignList", () => ({
  CampaignList: () => <section>main-campaigns</section>,
}));

vi.mock("@/components/dashboard/HotLeads", () => ({
  HotLeads: () => <section>hot-leads</section>,
}));

vi.mock("@/components/dashboard/UpcomingMeetings", () => ({
  UpcomingMeetings: () => <section>upcoming-meetings</section>,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("place Upcoming meetings au-dessus de Main campaigns et Hot leads", async () => {
    const html = renderToStaticMarkup(await DashboardPage());

    expect(html.indexOf("upcoming-meetings")).toBeGreaterThan(-1);
    expect(html.indexOf("main-campaigns")).toBeGreaterThan(-1);
    expect(html.indexOf("hot-leads")).toBeGreaterThan(-1);
    expect(html.indexOf("upcoming-meetings")).toBeLessThan(html.indexOf("main-campaigns"));
    expect(html.indexOf("upcoming-meetings")).toBeLessThan(html.indexOf("hot-leads"));
  });
});
