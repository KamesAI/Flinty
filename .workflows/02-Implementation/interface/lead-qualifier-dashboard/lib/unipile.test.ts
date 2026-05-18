import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  verifyUnipileSignature,
  UnipileClient,
  UnipileHTTPError,
  createUnipileClient,
  type UnipileAccount,
  type UnipileMessage,
  type UnipileProfile,
} from "./unipile";

// ——— verifyUnipileSignature ———

describe("verifyUnipileSignature", () => {
  it("accepte une signature valide", async () => {
    const secret = "test-webhook-secret";
    const body = JSON.stringify({ event: "message.received", account_id: "acc_123" });
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const expected = "sha256=" + Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await verifyUnipileSignature(body, expected, secret);
    expect(result).toBe(true);
  });

  it("rejette une signature falsifiée", async () => {
    const body = JSON.stringify({ event: "message.received" });
    const result = await verifyUnipileSignature(body, "sha256=deadbeef", "real-secret");
    expect(result).toBe(false);
  });

  it("rejette une signature sans préfixe sha256=", async () => {
    const body = "payload";
    const result = await verifyUnipileSignature(body, "badbadbadbad", "secret");
    expect(result).toBe(false);
  });
});

// ——— UnipileClient ———

describe("UnipileClient", () => {
  let client: UnipileClient;

  beforeEach(() => {
    client = new UnipileClient({ apiKey: "test-key", dsn: "api1" });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockFetch = (data: unknown, status = 200) => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    } as Response);
  };

  describe("getAccountStatus", () => {
    it("retourne le statut du compte LinkedIn", async () => {
      const account: UnipileAccount = {
        id: "acc_123",
        type: "LINKEDIN",
        status: "OK",
        name: "Thomas Callendreau",
      };
      mockFetch(account);

      const result = await client.getAccountStatus("acc_123");
      expect(result.id).toBe("acc_123");
      expect(result.status).toBe("OK");
      expect(fetch).toHaveBeenCalledWith(
        "https://api1.unipile.com:13465/api/v1/accounts/acc_123",
        expect.objectContaining({ headers: expect.objectContaining({ "X-API-KEY": "test-key" }) })
      );
    });

    it("retourne les statuts d'erreur Unipile", async () => {
      const account: UnipileAccount = {
        id: "acc_456",
        type: "LINKEDIN",
        status: "ACTION_NEEDED",
        name: "Test",
      };
      mockFetch(account);
      const result = await client.getAccountStatus("acc_456");
      expect(result.status).toBe("ACTION_NEEDED");
    });
  });

  describe("sendInvitation", () => {
    it("envoie une invitation sans note", async () => {
      mockFetch({ id: "inv_001" });

      const result = await client.sendInvitation({
        accountId: "acc_123",
        linkedinId: "li_abc",
      });
      expect(result.id).toBe("inv_001");
      const call = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body).not.toHaveProperty("message");
    });

    it("envoie une invitation avec note (max 300 chars)", async () => {
      mockFetch({ id: "inv_002" });
      const note = "Bonjour Thomas, j'ai vu votre profil...";

      await client.sendInvitation({
        accountId: "acc_123",
        linkedinId: "li_xyz",
        message: note,
      });
      const call = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.message).toBe(note);
    });
  });

  describe("sendDM", () => {
    it("envoie un DM dans un chat existant", async () => {
      mockFetch({ id: "msg_001" });

      const result = await client.sendDM({
        accountId: "acc_123",
        chatId: "chat_abc",
        message: "Bonjour !",
      });
      expect(result.id).toBe("msg_001");
      expect(fetch).toHaveBeenCalledWith(
        "https://api1.unipile.com:13465/api/v1/chats/chat_abc/messages",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("getMessages", () => {
    it("récupère les messages d'un compte", async () => {
      const messages: UnipileMessage[] = [
        { id: "m1", account_id: "acc_123", text: "Hello", sender_id: "li_abc", sender_name: "Bob", created_at: "2026-05-18T10:00:00Z", read: false },
      ];
      mockFetch(messages);

      const result = await client.getMessages("acc_123");
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe("Hello");
    });

    it("récupère les messages d'un chat précis", async () => {
      mockFetch([]);
      await client.getMessages("acc_123", "chat_xyz");
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/chats/chat_xyz/messages"),
        expect.anything()
      );
    });
  });

  describe("searchProfiles", () => {
    it("cherche des profils avec critères", async () => {
      const profiles: UnipileProfile[] = [
        { id: "p1", first_name: "Alice", last_name: "Martin", headline: "CEO", profile_url: "https://linkedin.com/in/alice" },
      ];
      mockFetch(profiles);

      const result = await client.searchProfiles({
        accountId: "acc_123",
        keywords: "CEO startup",
        location: "Paris",
        limit: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0].first_name).toBe("Alice");
      const url = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(url).toContain("keywords=CEO+startup");
      expect(url).toContain("limit=10");
    });
  });

  describe("retry (exponential backoff)", () => {
    it("retente 3x sur erreur puis lève une exception", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

      await expect(client.getAccountStatus("acc_fail")).rejects.toThrow("Network error");
      expect(fetch).toHaveBeenCalledTimes(3);
    }, 10_000);

    it("réussit au 2ème essai", async () => {
      const account: UnipileAccount = { id: "acc_ok", type: "LINKEDIN", status: "OK", name: "OK" };
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error("Timeout"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => account,
          text: async () => JSON.stringify(account),
        } as Response);

      const result = await client.getAccountStatus("acc_ok");
      expect(result.status).toBe("OK");
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("erreur HTTP", () => {
    it("lève UnipileHTTPError sur status 401 sans retry", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
        text: async () => "Unauthorized",
      } as Response);

      await expect(client.getAccountStatus("acc_x")).rejects.toThrow(UnipileHTTPError);
      // pas de retry sur 4xx — fetch appelé une seule fois
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});

// ——— createUnipileClient ———

describe("createUnipileClient", () => {
  it("lève une erreur si env vars manquantes", () => {
    const orig1 = process.env.UNIPILE_API_KEY;
    const orig2 = process.env.UNIPILE_DSN;
    delete process.env.UNIPILE_API_KEY;
    delete process.env.UNIPILE_DSN;

    expect(() => createUnipileClient()).toThrow();

    process.env.UNIPILE_API_KEY = orig1;
    process.env.UNIPILE_DSN = orig2;
  });
});
