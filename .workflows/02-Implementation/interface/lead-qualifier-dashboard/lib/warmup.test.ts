import { describe, expect, it } from "vitest";
import {
  buildWarmupState,
  configBool,
  countWarmupPositiveRepliesFromTurns,
  getWarmupDailyCap,
  getWarmupDay,
} from "./warmup";

describe("warmup helpers", () => {
  it("normalise les booléens Config", () => {
    expect(configBool("TRUE")).toBe(true);
    expect(configBool("false", true)).toBe(false);
    expect(configBool(undefined, true)).toBe(true);
  });

  it("calcule le jour de warm-up depuis warmup_started_at", () => {
    expect(getWarmupDay("2026-05-01T10:00:00.000Z", new Date("2026-05-01T12:00:00.000Z"))).toBe(1);
    expect(getWarmupDay("2026-05-01T10:00:00.000Z", new Date("2026-05-07T12:00:00.000Z"))).toBe(7);
  });

  it("rampe de 5 à 20 emails/jour sur 14 jours", () => {
    expect(getWarmupDailyCap(1)).toBe(5);
    expect(getWarmupDailyCap(7)).toBe(12);
    expect(getWarmupDailyCap(14)).toBe(20);
    expect(getWarmupDailyCap(30)).toBe(20);
  });

  it("compte les replies positives taggées", () => {
    expect(countWarmupPositiveRepliesFromTurns([
      { tags: "warmup_positive_reply" },
      { tags: "forced_validation_ai_question,warmup_positive_reply" },
      { tags: "other" },
    ])).toBe(2);
  });

  it("construit l'état warm-up UI", () => {
    expect(buildWarmupState(
      { warmup_campaign: "TRUE", warmup_started_at: "2026-05-01T00:00:00.000Z" },
      3,
      new Date("2026-05-14T00:00:00.000Z")
    )).toMatchObject({
      enabled: true,
      day: 14,
      maxDailySends: 20,
      positiveReplies: 3,
      completed: true,
    });
  });
});
