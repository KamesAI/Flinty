import type { Metadata } from "next";

import { LegalArticle } from "@/components/marketing/LegalArticle";

export const metadata: Metadata = {
  title: "Conditions générales",
  robots: { index: false },
};

// ⚠️ BROUILLON — contenu à valider par Thomas (et idéalement un juriste) avant mise en ligne.
export default function CguPage() {
  return (
    <LegalArticle
      title="Conditions générales d'utilisation"
      updatedAt="4 juillet 2026"
      sections={[
        {
          title: "Objet",
          paragraphs: [
            "Les présentes conditions encadrent l'utilisation de Flinty, plateforme SaaS de prospection B2B multi-canal éditée par Kames. La création d'un compte vaut acceptation des présentes conditions.",
          ],
        },
        {
          title: "Service",
          paragraphs: [
            "Flinty automatise le sourcing, la qualification, le contact et la prise de rendez-vous avec des prospects B2B, par email et LinkedIn, avec un assistant IA de qualification des réponses.",
            "L'utilisateur reste seul responsable du contenu de ses campagnes, du respect du RGPD et des conditions d'utilisation des plateformes tierces (LinkedIn notamment) sur ses propres comptes.",
          ],
        },
        {
          title: "Tarifs et facturation",
          paragraphs: [
            "Les tarifs en vigueur sont affichés sur la page Tarifs. [À COMPLÉTER : tarifs définitifs à valider.] L'abonnement est mensuel ou annuel, résiliable à tout moment ; la résiliation prend effet à la fin de la période en cours.",
          ],
        },
        {
          title: "Responsabilité",
          paragraphs: [
            "Flinty est fourni « en l'état ». Kames ne garantit ni un volume de rendez-vous, ni la délivrabilité des emails, ni la disponibilité continue des services tiers intégrés (Resend, Calendly, LinkedIn via Unipile).",
            "La responsabilité de Kames est limitée au montant des sommes versées au cours des douze derniers mois. [À COMPLÉTER : à faire relire par un juriste.]",
          ],
        },
        {
          title: "Droit applicable",
          paragraphs: [
            "Les présentes conditions sont soumises au droit français. Tout litige relève des tribunaux compétents de [À COMPLÉTER : ville du siège].",
          ],
        },
      ]}
    />
  );
}
