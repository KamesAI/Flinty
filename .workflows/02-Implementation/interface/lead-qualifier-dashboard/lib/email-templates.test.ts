import { describe, expect, it } from "vitest";
import {
  mergeCampaignEmailTemplates,
  normalizeEmailTemplateEntry,
  validateTemplateEntryInput,
  type EmailTemplateEntryInput,
} from "./email-templates";

describe("normalizeEmailTemplateEntry", () => {
  it("ajoute les champs V2 par defaut a une entree V1", () => {
    const entry = normalizeEmailTemplateEntry({
      campaign_id: "camp-1",
      sequence_key: "j0",
      variant_key: "a",
      label: "Variante A",
      subject: "Sujet",
      body: "Corps",
    });

    expect(entry.preview_text).toBe("");
    expect(entry.cta_label).toBe("");
    expect(entry.cta_url).toBe("");
    expect(entry.media_type).toBe("none");
    expect(entry.media_thumbnail_url).toBe("");
    expect(entry.media_target_url).toBe("");
    expect(entry.is_rich_template).toBe(false);
    expect(entry.notes).toBe("");
  });
});

describe("mergeCampaignEmailTemplates", () => {
  it("reste retro-compatible pour une campagne avec donnees V1", () => {
    const templates = mergeCampaignEmailTemplates("camp-1", [
      {
        campaign_id: "camp-1",
        sequence_key: "j3",
        variant_key: "default",
        label: "Template J+3",
        subject: "Relance",
        body: "Bonjour",
      },
    ]);

    const entry = templates.entries.find(
      (candidate) =>
        candidate.sequence_key === "j3" && candidate.variant_key === "default"
    );

    expect(entry).toMatchObject({
      subject: "Relance",
      body: "Bonjour",
      media_type: "none",
      is_rich_template: false,
    });
  });
});

describe("validateTemplateEntryInput", () => {
  it("refuse un CTA incomplet", () => {
    const result = validateTemplateEntryInput({
      sequence_key: "j0",
      variant_key: "a",
      label: "Variante A",
      subject: "Sujet",
      body: "Corps",
      cta_label: "Voir la demo",
      cta_url: "",
    } satisfies Partial<EmailTemplateEntryInput>);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("CTA");
  });

  it("refuse un bloc video sans miniature ni URL cible", () => {
    const result = validateTemplateEntryInput({
      sequence_key: "j0",
      variant_key: "b",
      label: "Variante B",
      subject: "Sujet",
      body: "Corps",
      media_type: "video",
      media_thumbnail_url: "",
      media_target_url: "",
    } satisfies Partial<EmailTemplateEntryInput>);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("video");
  });

  it("accepte un template enrichi complet", () => {
    const result = validateTemplateEntryInput({
      sequence_key: "j0",
      variant_key: "c",
      label: "Variante C",
      subject: "Sujet",
      body: "Corps",
      preview_text: "Apercu",
      cta_label: "Voir la demo",
      cta_url: "https://kamesai.com/demo",
      media_type: "video",
      media_thumbnail_url: "https://cdn.kamesai.com/thumb.jpg",
      media_target_url: "https://www.loom.com/share/demo",
      notes: "Tester sur segment agences",
    } satisfies Partial<EmailTemplateEntryInput>);

    expect(result.valid).toBe(true);
  });
});
