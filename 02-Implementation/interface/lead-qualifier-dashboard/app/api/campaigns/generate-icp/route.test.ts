import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as OpenRouter from "@/lib/openrouter";
import { POST } from "./route";
import { resetRateLimitStore } from "@/lib/rate-limit";

const mockCreate = vi.fn();

const EIGHT = Array.from({ length: 8 }, (_, i) => `Réponse ${i + 1}`);

function makeReq(ip: string, answers: string[] = EIGHT) {
  return new Request("http://localhost/api/campaigns/generate-icp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ answers }),
  });
}

describe("POST /api/campaigns/generate-icp", () => {
  beforeEach(() => {
    resetRateLimitStore();
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "# ICP généré" } }],
    });
    vi.spyOn(OpenRouter, "getOpenRouter").mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne 200 avec icp_md", async () => {
    const res = await POST(makeReq("203.0.113.1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.icp_md).toContain("ICP");
    expect(mockCreate).toHaveBeenCalled();
  });

  it("retourne 400 si answers n'a pas 8 entrées", async () => {
    const res = await POST(makeReq("203.0.113.2", ["a", "b"]));
    expect(res.status).toBe(400);
  });

  it("retourne 429 avec Retry-After au 6e appel / min / IP", async () => {
    const ip = "198.51.100.99";
    for (let i = 0; i < 5; i++) {
      const r = await POST(makeReq(ip));
      expect(r.status).toBe(200);
    }
    const blocked = await POST(makeReq(ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    const j = await blocked.json();
    expect(j.retryAfter).toBeDefined();
  });
});
