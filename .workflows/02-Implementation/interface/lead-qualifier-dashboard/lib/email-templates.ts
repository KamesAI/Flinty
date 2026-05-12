export type EmailSequenceKey = "j0" | "j3" | "j7" | "j10";
export type EmailVariantKey = "a" | "b" | "c" | "default";
export type EmailTemplateMediaType = "none" | "image" | "gif" | "video";

export interface EmailTemplateEntry {
  campaign_id: string;
  sequence_key: EmailSequenceKey;
  variant_key: EmailVariantKey;
  label: string;
  subject: string;
  body: string;
  preview_text: string;
  cta_label: string;
  cta_url: string;
  media_type: EmailTemplateMediaType;
  media_thumbnail_url: string;
  media_target_url: string;
  is_rich_template: boolean;
  notes: string;
  updated_at?: string;
}

export interface EmailTemplateEntryInput {
  sequence_key: EmailSequenceKey;
  variant_key: EmailVariantKey;
  label: string;
  subject: string;
  body: string;
  preview_text?: string;
  cta_label?: string;
  cta_url?: string;
  media_type?: EmailTemplateMediaType;
  media_thumbnail_url?: string;
  media_target_url?: string;
  is_rich_template?: boolean;
  notes?: string;
}

export type EmailTemplateStoredEntry = Pick<
  EmailTemplateEntry,
  "campaign_id" | "sequence_key" | "variant_key" | "label" | "subject" | "body"
> &
  Partial<
    Omit<
      EmailTemplateEntry,
      "campaign_id" | "sequence_key" | "variant_key" | "label" | "subject" | "body"
    >
  >;

export interface CampaignEmailTemplates {
  campaign_id: string;
  entries: EmailTemplateEntry[];
}

export const EMAIL_TEMPLATES_SHEET_NAME = "Email_Templates";
export const EMAIL_TEMPLATES_HEADER = [
  "campaign_id",
  "sequence_key",
  "variant_key",
  "label",
  "subject",
  "body",
  "preview_text",
  "cta_label",
  "cta_url",
  "media_type",
  "media_thumbnail_url",
  "media_target_url",
  "is_rich_template",
  "notes",
  "updated_at",
] as const;

export const EMAIL_TEMPLATE_MEDIA_OPTIONS: Array<{
  value: EmailTemplateMediaType;
  label: string;
  description: string;
}> = [
  {
    value: "none",
    label: "Aucun media",
    description: "Email texte simple avec rendu leger et delivrable.",
  },
  {
    value: "image",
    label: "Image",
    description: "Visuel statique cliquable vers une page ou une demo.",
  },
  {
    value: "gif",
    label: "GIF",
    description: "Animation legere pour illustrer un geste ou une interface.",
  },
  {
    value: "video",
    label: "Video miniature",
    description: "Thumbnail cliquable avec bouton play vers Loom ou page demo.",
  },
];

export const EMAIL_TEMPLATE_SECTIONS: Array<{
  key: EmailSequenceKey;
  title: string;
  description: string;
  variants: Array<{ key: EmailVariantKey; label: string }>;
}> = [
  {
    key: "j0",
    title: "Prise de contact",
    description: "Trois variantes testeables pour comparer les angles d'accroche d'une meme campagne.",
    variants: [
      { key: "a", label: "Variante A" },
      { key: "b", label: "Variante B" },
      { key: "c", label: "Variante C" },
    ],
  },
  {
    key: "j3",
    title: "Relance J+3",
    description: "Premier rappel court pour remettre l'email en haut de boite.",
    variants: [{ key: "default", label: "Template J+3" }],
  },
  {
    key: "j7",
    title: "Relance J+7",
    description: "Second rappel avec plus de contexte ou un angle de valeur different.",
    variants: [{ key: "default", label: "Template J+7" }],
  },
  {
    key: "j10",
    title: "Relance J+10",
    description: "Derniere relance avant sortie de sequence.",
    variants: [{ key: "default", label: "Template J+10" }],
  },
];

function cleanString(value: string | undefined) {
  return value?.trim() ?? "";
}

function isValidHttpUrl(value: string) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getAllowedTemplatePairs() {
  return EMAIL_TEMPLATE_SECTIONS.flatMap((section) =>
    section.variants.map((variant) => `${section.key}:${variant.key}`)
  );
}

export function computeIsRichTemplate(entry: Pick<
  EmailTemplateEntryInput,
  | "preview_text"
  | "cta_label"
  | "cta_url"
  | "media_type"
  | "media_thumbnail_url"
  | "media_target_url"
  | "notes"
>) {
  return Boolean(
    cleanString(entry.preview_text) ||
      cleanString(entry.cta_label) ||
      cleanString(entry.cta_url) ||
      (entry.media_type && entry.media_type !== "none") ||
      cleanString(entry.media_thumbnail_url) ||
      cleanString(entry.media_target_url) ||
      cleanString(entry.notes)
  );
}

export function normalizeEmailTemplateEntry(
  entry: EmailTemplateStoredEntry
): EmailTemplateEntry {
  const mediaType = entry.media_type ?? "none";
  const normalizedPreviewText = cleanString(entry.preview_text);
  const normalizedCtaLabel = cleanString(entry.cta_label);
  const normalizedCtaUrl = cleanString(entry.cta_url);
  const normalizedMediaThumbnailUrl = cleanString(entry.media_thumbnail_url);
  const normalizedMediaTargetUrl = cleanString(entry.media_target_url);
  const normalizedNotes = cleanString(entry.notes);

  return {
    campaign_id: entry.campaign_id,
    sequence_key: entry.sequence_key,
    variant_key: entry.variant_key,
    label: entry.label,
    subject: entry.subject,
    body: entry.body,
    preview_text: normalizedPreviewText,
    cta_label: normalizedCtaLabel,
    cta_url: normalizedCtaUrl,
    media_type: mediaType,
    media_thumbnail_url: normalizedMediaThumbnailUrl,
    media_target_url: normalizedMediaTargetUrl,
    is_rich_template:
      entry.is_rich_template ??
      computeIsRichTemplate({
        preview_text: normalizedPreviewText,
        cta_label: normalizedCtaLabel,
        cta_url: normalizedCtaUrl,
        media_type: mediaType,
        media_thumbnail_url: normalizedMediaThumbnailUrl,
        media_target_url: normalizedMediaTargetUrl,
        notes: normalizedNotes,
      }),
    notes: normalizedNotes,
    updated_at: entry.updated_at,
  };
}

export function normalizeTemplateEntryInput(entry: EmailTemplateEntryInput): EmailTemplateEntryInput {
  const mediaType = entry.media_type ?? "none";
  const normalized = {
    sequence_key: entry.sequence_key,
    variant_key: entry.variant_key,
    label: entry.label,
    subject: entry.subject,
    body: entry.body,
    preview_text: cleanString(entry.preview_text),
    cta_label: cleanString(entry.cta_label),
    cta_url: cleanString(entry.cta_url),
    media_type: mediaType,
    media_thumbnail_url: cleanString(entry.media_thumbnail_url),
    media_target_url: cleanString(entry.media_target_url),
    notes: cleanString(entry.notes),
  } satisfies EmailTemplateEntryInput;

  return {
    ...normalized,
    is_rich_template:
      entry.is_rich_template ??
      computeIsRichTemplate({
        preview_text: normalized.preview_text,
        cta_label: normalized.cta_label,
        cta_url: normalized.cta_url,
        media_type: normalized.media_type,
        media_thumbnail_url: normalized.media_thumbnail_url,
        media_target_url: normalized.media_target_url,
        notes: normalized.notes,
      }),
  };
}

export function validateTemplateEntryInput(entry: Partial<EmailTemplateEntryInput>) {
  if (
    typeof entry.sequence_key !== "string" ||
    typeof entry.variant_key !== "string" ||
    typeof entry.label !== "string" ||
    typeof entry.subject !== "string" ||
    typeof entry.body !== "string"
  ) {
    return { valid: false, message: "Champs de base du template invalides." } as const;
  }

  if (!getAllowedTemplatePairs().includes(`${entry.sequence_key}:${entry.variant_key}`)) {
    return { valid: false, message: "Combinaison sequence/variante invalide." } as const;
  }

  const normalized = normalizeTemplateEntryInput(entry as EmailTemplateEntryInput);
  const hasCtaLabel = normalized.cta_label ? normalized.cta_label.length > 0 : false;
  const hasCtaUrl = normalized.cta_url ? normalized.cta_url.length > 0 : false;

  if (hasCtaLabel !== hasCtaUrl) {
    return { valid: false, message: "CTA incomplet : renseigner le libelle et l'URL." } as const;
  }

  if (hasCtaUrl && !isValidHttpUrl(normalized.cta_url ?? "")) {
    return { valid: false, message: "CTA invalide : l'URL doit commencer par http ou https." } as const;
  }

  if (normalized.media_type === "none") {
    return { valid: true } as const;
  }

  if (!normalized.media_thumbnail_url || !normalized.media_target_url) {
    return {
      valid: false,
      message:
        normalized.media_type === "video"
          ? "Le bloc video requiert une miniature et une URL cible."
          : "Le bloc media requiert une miniature et une URL cible.",
    } as const;
  }

  if (
    !isValidHttpUrl(normalized.media_thumbnail_url) ||
    !isValidHttpUrl(normalized.media_target_url)
  ) {
    return {
      valid: false,
      message: "Les URLs media doivent commencer par http ou https.",
    } as const;
  }

  return { valid: true } as const;
}

export function createEmptyCampaignEmailTemplates(campaignId: string): CampaignEmailTemplates {
  return {
    campaign_id: campaignId,
    entries: EMAIL_TEMPLATE_SECTIONS.flatMap((section) =>
      section.variants.map((variant) =>
        normalizeEmailTemplateEntry({
          campaign_id: campaignId,
          sequence_key: section.key,
          variant_key: variant.key,
          label: variant.label,
          subject: "",
          body: "",
        })
      )
    ),
  };
}

export function mergeCampaignEmailTemplates(
  campaignId: string,
  entries: EmailTemplateStoredEntry[]
): CampaignEmailTemplates {
  const defaults = createEmptyCampaignEmailTemplates(campaignId);

  return {
    campaign_id: campaignId,
    entries: defaults.entries.map((entry) => {
      const saved = entries.find(
        (candidate) =>
          candidate.sequence_key === entry.sequence_key &&
          candidate.variant_key === entry.variant_key
      );

      return saved
        ? normalizeEmailTemplateEntry({
            ...entry,
            ...saved,
            campaign_id: campaignId,
            label: saved.label || entry.label,
          })
        : entry;
    }),
  };
}
