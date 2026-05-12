import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicOrigin } from "./request-origin";

describe("getPublicOrigin", () => {
  beforeEach(() => {
    delete process.env.VERCEL_URL;
  });

  it("utilise l’origine de req.url quand elle est absolue", () => {
    const req = new Request("https://flinty.example.com/api/campaigns");
    expect(getPublicOrigin(req)).toBe("https://flinty.example.com");
  });

  it("supporte localhost pour les tests / dev", () => {
    const req = new Request("http://localhost:3000/api/campaigns");
    expect(getPublicOrigin(req)).toBe("http://localhost:3000");
  });

  it("utilise https://VERCEL_URL si l’URL de la requête est invalide", () => {
    process.env.VERCEL_URL = "my-app.vercel.app";
    const req = new Request("about:blank");
    expect(getPublicOrigin(req)).toBe("https://my-app.vercel.app");
  });

  it("normalise VERCEL_URL déjà préfixé par https://", () => {
    process.env.VERCEL_URL = "https://my-app.vercel.app";
    const req = new Request("about:blank");
    expect(getPublicOrigin(req)).toBe("https://my-app.vercel.app");
  });

  it("retombe sur http://localhost:3000 sans VERCEL_URL et URL invalide", () => {
    const req = new Request("about:blank");
    expect(getPublicOrigin(req)).toBe("http://localhost:3000");
  });
});
