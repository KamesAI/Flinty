import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, dynamic } from "./route";

const getEmailHealthMock = vi.fn();

vi.mock("@/lib/sheets", () => ({
  getEmailHealth: (...args: unknown[]) => getEmailHealthMock(...args),
}));

describe("GET /api/email-health", () => {
  beforeEach(() => {
    getEmailHealthMock.mockReset();
  });

  it("force une lecture dynamique", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("retourne allowed=true si le domaine est actif", async () => {
    getEmailHealthMock.mockResolvedValue({
      domain: "outreach.kamesai.com",
      sent_today: "4",
      bounce_rate_7d: "0.01",
      complaint_rate_7d: "0",
      last_mail_tester_score: "10",
      last_check_at: "2026-05-17T18:00:00.000Z",
      status: "active",
    });

    const response = await GET(new Request("http://localhost/api/email-health"));
    const body = await response.json();

    expect(getEmailHealthMock).toHaveBeenCalledWith("outreach.kamesai.com");
    expect(body.allowed).toBe(true);
    expect(body.reason).toBeUndefined();
  });

  it("retourne la raison de pause si le status est non actif", async () => {
    getEmailHealthMock.mockResolvedValue({
      domain: "outreach.kamesai.com",
      sent_today: "12",
      bounce_rate_7d: "0.06",
      complaint_rate_7d: "0",
      last_mail_tester_score: "8",
      last_check_at: "2026-05-17T18:00:00.000Z",
      status: "paused_high_bounce",
    });

    const response = await GET(new Request("http://localhost/api/email-health"));
    const body = await response.json();

    expect(body.allowed).toBe(false);
    expect(body.reason).toBe("paused_high_bounce");
  });
});
