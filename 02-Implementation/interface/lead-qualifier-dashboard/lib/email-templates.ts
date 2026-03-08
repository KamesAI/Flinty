export type EmailSequenceKey = "j0" | "j3" | "j7" | "j10";
export type EmailVariantKey = "a" | "b" | "c" | "default";

export interface EmailTemplateEntry {
  campaign_id: string;
  sequence_key: EmailSequenceKey;
  variant_key: EmailVariantKey;
  label: string;
  subject: string;
  body: string;
  updated_at?: string;
}

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
  "updated_at",
] as const;

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

export function createEmptyCampaignEmailTemplates(campaignId: string): CampaignEmailTemplates {
  return {
    campaign_id: campaignId,
    entries: EMAIL_TEMPLATE_SECTIONS.flatMap((section) =>
      section.variants.map((variant) => ({
        campaign_id: campaignId,
        sequence_key: section.key,
        variant_key: variant.key,
        label: variant.label,
        subject: "",
        body: "",
      }))
    ),
  };
}

export function mergeCampaignEmailTemplates(
  campaignId: string,
  entries: EmailTemplateEntry[]
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
        ? {
            ...entry,
            ...saved,
            campaign_id: campaignId,
            label: saved.label || entry.label,
          }
        : entry;
    }),
  };
}
