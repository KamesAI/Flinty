import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { pollCalendlyBookings } from "@/lib/calendly-poll";

vi.mock("@/lib/calendly-poll", () => ({
  pollCalendlyBookings: vi.fn(),
}));

describe("GET /api/calendly/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    vi.mocked(pollCalendlyBookings).mockResolvedValue({
      events: 0,
      invitees: 0,
      created: 0,
      skipped_existing: 0,
      skipped_unmatched: 0,
    });
  });

  it("répond 401 sans Authorization bearer CRON_SECRET", async () => {
    const res = await GET(new Request("http://localhost/api/calendly/poll"));

    expect(res.status).toBe(401);
    expect(pollCalendlyBookings).not.toHaveBeenCalled();
  });

  it("déclenche le polling avec le secret cron", async () => {
    vi.mocked(pollCalendlyBookings).mockResolvedValueOnce({
      events: 1,
      invitees: 1,
      created: 1,
      skipped_existing: 0,
      skipped_unmatched: 0,
    });

    const res = await GET(
      new Request("http://localhost/api/calendly/poll", {
        headers: { Authorization: "Bearer cron-secret" },
      })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      events: 1,
      invitees: 1,
      created: 1,
      skipped_existing: 0,
      skipped_unmatched: 0,
    });
  });
});
