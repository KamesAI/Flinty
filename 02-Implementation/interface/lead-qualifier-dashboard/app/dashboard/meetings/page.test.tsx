import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.stubGlobal("React", React);

vi.mock("@/lib/sheets", () => ({
  readIndex: vi.fn(async () => []),
  getMeetings: vi.fn(async () => []),
  parseIndexCampaigns: vi.fn(() => []),
  getAllLeadsV3: vi.fn(async () => []),
  indexCampaignToCampaign: vi.fn((campaign) => campaign),
}));

import MeetingsPage from "./page";

describe("MeetingsPage", () => {
  it("supprime le badge semaine et utilise des surfaces claires", async () => {
    const html = renderToStaticMarkup(await MeetingsPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("Rendez-vous à venir");
    expect(html).toContain("border-slate-200/70 bg-white/90");
    expect(html).not.toContain("Semaine ");
    expect(html).not.toContain("bg-zinc-950");
    expect(html).not.toContain("bg-black");
  });
});
