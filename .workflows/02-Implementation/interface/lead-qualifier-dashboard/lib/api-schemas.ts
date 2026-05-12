import { z } from "zod";

export const postCampaignBodySchema = z.object({
  nom: z.string().trim().min(1, "nom requis"),
  secteur: z.string().trim().min(1, "secteur requis"),
  localisation: z.string().trim().min(1, "localisation requise"),
  offre_kames: z.string().trim().min(1, "offre_kames requis"),
  icp_md: z
    .string()
    .refine((s) => s.trim().length > 0, "icp_md ne peut pas être vide"),
  score_minimum: z.coerce.number().int().min(0).max(100),
  villes: z.string().optional(),
  taille_equipe: z.string().optional(),
  poste_cible: z.string().optional(),
  template_email: z.string().optional(),
  target_qualified_leads: z.coerce.number().int().min(10).max(500).optional(),
  search_terms: z.string().trim().optional(),
  search_locations: z.string().trim().optional(),
});

export type PostCampaignBody = z.infer<typeof postCampaignBodySchema>;

export const generateIcpBodySchema = z.object({
  answers: z
    .array(z.string())
    .length(8, "exactement 8 réponses requises"),
  campaign_id: z.string().optional(),
});

export type GenerateIcpBody = z.infer<typeof generateIcpBodySchema>;
