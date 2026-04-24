export type CampaignFormDefaults = {
  nom: string;
  secteur: string;
  localisation: string;
  offre_kames: string;
  taille_equipe: string;
};

export function deriveFormDefaults(answers: string[]): CampaignFormDefaults {
  const secteur = answers[0] ?? "";
  const taille_equipe = answers[2] ?? "";
  const localisation = answers[4] ?? "";
  const offre_kames = answers[5] ?? "";

  const nomParts = [secteur, localisation].filter(Boolean);
  const nom = nomParts.length > 0 ? `Campagne ${nomParts.join(" — ")}` : "Nouvelle campagne";

  return { nom, secteur, localisation, offre_kames, taille_equipe };
}
