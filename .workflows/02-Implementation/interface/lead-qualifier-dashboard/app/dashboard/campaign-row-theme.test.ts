import { describe, expect, it } from "vitest";
import { getCampaignRowThemeTokens } from "./campaign-row-theme";

describe("campaign row theme tokens", () => {
  it("s'appuie sur les variables du dashboard pour suivre light et dark mode", () => {
    const tokens = getCampaignRowThemeTokens();

    expect(tokens.surface).toBe("var(--dashboard-card-bg)");
    expect(tokens.surfaceHover).toBe("var(--dashboard-card-bg-muted)");
    expect(tokens.border).toBe("var(--dashboard-border)");
    expect(tokens.borderStrong).toBe("var(--dashboard-border-strong)");
    expect(tokens.textPrimary).toBe("var(--dashboard-text-primary)");
    expect(tokens.textSecondary).toBe("var(--dashboard-text-secondary)");
    expect(tokens.textMuted).toBe("var(--dashboard-text-muted)");
    expect(tokens.carouselSurface).toContain("var(--dashboard-card-bg)");
    expect(tokens.ratePillBackground).toContain("var(--dashboard-card-bg)");
  });

  it("conserve des accents neutres et orange discrets pour le funnel et le statut", () => {
    const tokens = getCampaignRowThemeTokens();

    expect(tokens.stageFills.raw).toContain("color-mix");
    expect(tokens.stageFills.contacted).toContain("#006596");
    expect(tokens.generatingDot).toBe("#006596");
  });
});
