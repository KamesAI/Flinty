import type { Metadata } from "next";

import { LegalArticle } from "@/components/marketing/LegalArticle";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

// ⚠️ BROUILLON — contenu à valider par Thomas avant mise en ligne publique.
export default function MentionsLegalesPage() {
  return (
    <LegalArticle
      title="Mentions légales"
      updatedAt="4 juillet 2026"
      sections={[
        {
          title: "Éditeur du site",
          paragraphs: [
            "Le site flinty.fr est édité par Kames, [À COMPLÉTER : forme juridique — ex. EI / SASU], immatriculée sous le numéro SIREN [À COMPLÉTER], dont le siège social est situé [À COMPLÉTER : adresse complète].",
            "Directeur de la publication : Thomas Callendreau. Contact : [À COMPLÉTER : email de contact public].",
          ],
        },
        {
          title: "Hébergement",
          paragraphs: [
            "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).",
          ],
        },
        {
          title: "Propriété intellectuelle",
          paragraphs: [
            "L'ensemble des contenus du site (textes, visuels, logo, marque Flinty) est la propriété exclusive de Kames, sauf mention contraire. Toute reproduction sans autorisation écrite préalable est interdite.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Pour toute question relative au site ou à ses contenus : [À COMPLÉTER : email de contact public].",
          ],
        },
      ]}
    />
  );
}
