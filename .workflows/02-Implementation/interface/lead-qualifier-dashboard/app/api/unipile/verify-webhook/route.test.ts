import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/unipile/verify-webhook", () => {
  afterEach(() => {
    delete process.env.UNIPILE_WEBHOOK_SECRET;
  });

  it("valide une signature HMAC Unipile sur le raw body", async () => {
    process.env.UNIPILE_WEBHOOK_SECRET = "hook-secret";
    const rawBody = JSON.stringify({ event: "invitation.accepted" });
    const signature =
      "sha256=978b210c722a60d937ff1edbb36bf96ccf5f1c068b1350e01463930f94531765";

    const response = await POST(
      new Request("https://flinty.test/api/unipile/verify-webhook", {
        method: "POST",
        headers: { "X-Unipile-Signature": signature },
        body: rawBody,
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ valid: true });
  });

  it("rejette une signature invalide", async () => {
    process.env.UNIPILE_WEBHOOK_SECRET = "hook-secret";

    const response = await POST(
      new Request("https://flinty.test/api/unipile/verify-webhook", {
        method: "POST",
        headers: { "X-Unipile-Signature": "sha256=deadbeef" },
        body: JSON.stringify({ event: "message.received" }),
      })
    );

    expect(response.status).toBe(401);
  });
});
