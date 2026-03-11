import { describe, expect, it } from "vitest";
import { getPulseStatsThemeTokens } from "./pulse-stats-theme";

describe("pulse stats theme tokens", () => {
  it("utilise des variables CSS du dashboard pour suivre light et dark mode", () => {
    const tokens = getPulseStatsThemeTokens();

    expect(tokens.surface).toBe("var(--pulse-surface)");
    expect(tokens.rowHover).toBe("var(--pulse-row-hover)");
    expect(tokens.border).toBe("var(--pulse-border)");
    expect(tokens.label).toBe("var(--pulse-label)");
    expect(tokens.value).toBe("var(--pulse-value)");
  });

  it("conserve un accent orange unique et discret", () => {
    const tokens = getPulseStatsThemeTokens();

    expect(tokens.accent).toBe("#FFA318");
  });
});
