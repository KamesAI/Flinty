import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/sheets", () => ({
  appendContactRegistryEntry: vi.fn(),
  appendToChildSheet: vi.fn(),
  getContactRegistryLinkedInUrls: vi.fn(),
  parseIndexCampaigns: vi.fn(),
  readIndex: vi.fn(),
}));

import {
  appendContactRegistryEntry,
  appendToChildSheet,
  getContactRegistryLinkedInUrls,
} from "@/lib/sheets";

describe("POST /api/linkedin/persist-source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.mocked(getContactRegistryLinkedInUrls).mockResolvedValue(new Set());
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("refuse sans bearer CRON_SECRET", async () => {
    const response = await POST(
      new Request("https://flinty.test/api/linkedin/persist-source", {
        method: "POST",
        body: JSON.stringify({ campaign_id: "cmp_1", sheet_id: "sheet_1", leads: [] }),
      })
    );

    expect(response.status).toBe(401);
    expect(appendToChildSheet).not.toHaveBeenCalled();
  });

  it("append les leads LinkedIn non dupliques dans Leads_Raw et Contacts_Registry", async () => {
    vi.mocked(getContactRegistryLinkedInUrls).mockResolvedValueOnce(
      new Set(["https://www.linkedin.com/in/already"])
    );

    const response = await POST(
      new Request("https://flinty.test/api/linkedin/persist-source", {
        method: "POST",
        headers: { Authorization: "Bearer cron-secret" },
        body: JSON.stringify({
          campaign_id: "cmp_1",
          sheet_id: "sheet_1",
          leads: [
            {
              name: "Already There",
              linkedin_url: "https://www.linkedin.com/in/already",
              title: "CEO",
              company: "Dup Co",
              source_channel: "linkedin_search",
            },
            {
              name: "Ada Lovelace",
              linkedin_url: "https://www.linkedin.com/in/ada-lovelace",
              title: "Founder",
              company: "Analytical Co",
              source_channel: "linkedin_search",
            },
          ],
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, inserted_count: 1, skipped_duplicates: 1 });
    expect(appendToChildSheet).toHaveBeenCalledWith(
      "sheet_1",
      "Leads_Raw!A:N",
      expect.arrayContaining([
        "cmp_1",
        "Ada Lovelace",
        "https://www.linkedin.com/in/ada-lovelace",
        "Founder",
        "Analytical Co",
        "linkedin_search",
      ])
    );
    expect(appendContactRegistryEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        campaign_id: "cmp_1",
        linkedin_url: "https://www.linkedin.com/in/ada-lovelace",
        statut: "sourced",
      })
    );
  });
});
