import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  cacheClear,
  cacheDelete,
  cacheGet,
  cacheSet,
  invalidateCampaignSheetIdCache,
} from "./cache";

describe("lib/cache", () => {
  beforeEach(() => {
    cacheClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cacheClear();
  });

  it("cacheSet / cacheGet retourne la valeur avant expiration", () => {
    vi.setSystemTime(1_000_000);
    cacheSet("k", { a: 1 }, 60_000);
    expect(cacheGet<{ a: number }>("k")).toEqual({ a: 1 });
  });

  it("cacheGet retourne null après TTL", () => {
    vi.setSystemTime(1_000_000);
    cacheSet("k", "v", 5_000);
    vi.setSystemTime(1_006_001);
    expect(cacheGet("k")).toBeNull();
  });

  it("cacheDelete supprime une clé", () => {
    cacheSet("k", 42, 60_000);
    cacheDelete("k");
    expect(cacheGet("k")).toBeNull();
  });

  it("invalidateCampaignSheetIdCache vide le store", () => {
    cacheSet("campaignById:x", { x: 1 }, 300_000);
    invalidateCampaignSheetIdCache();
    expect(cacheGet("campaignById:x")).toBeNull();
  });
});
