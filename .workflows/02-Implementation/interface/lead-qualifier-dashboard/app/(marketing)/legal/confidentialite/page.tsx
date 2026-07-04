import type { Metadata } from "next";

import { LegalArticle } from "@/components/marketing/LegalArticle";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false },
};

// ⚠️ BROUILLON — contenu à valider par Thomas (et idéalement un juriste) avant mise en ligne.
export default function ConfidentialitePage() {
  return (
    <LegalArticle
      title="Politique de confidentialité"
      updatedAt="4 juillet 2026"
      sections={[
        {
          title: "Responsable de traitement",
          paragraphs: [
            "Kames, [À COMPLÉTER : forme juridique et adresse], est responsable du traitement des données collectées via flinty.fr. Contact : [À COMPLÉTER : email DPO/contact].",
          ],
        },
        {
          title: "Données collectées",
          paragraphs: [
            "Comptes utilisateurs : nom, email professionnel, mot de passe (haché). Prospection pour le compte des clients : données professionnelles publiques de prospects B2B (nom, fonction, entreprise, email professionnel, profil LinkedIn public), traitées sur la base de l'intérêt légitime (art. 6.1.f RGPD).",
            "Le site n'utilise pas de cookies publicitaires. [À COMPLÉTER : lister les cookies/outillage analytics réellement déployés.]",
          ],
        },
        {
          title: "Finalités et durées de conservation",
          paragraphs: [
            "Les données de prospection servent exclusivement à la mise en relation commerciale B2B pour le compte des clients de Flinty. Elles sont conservées [À COMPLÉTER : durée — recommandation CNIL : 3 ans après le dernier contact].",
            "Certaines réponses sont traitées par une intelligence artificielle (assistant de qualification). Conformément à l'AI Act européen, les messages générés par IA sont identifiés comme tels et un mode de validation humaine est disponible.",
          ],
        },
        {
          title: "Sous-traitants",
          paragraphs: [
            "Hébergement : Vercel Inc. (États-Unis, clauses contractuelles types). Envoi d'emails : Resend. Traitement IA : Anthropic via OpenRouter. Stockage : Google Workspace (Google Sheets). [À COMPLÉTER : vérifier la liste au moment de la publication.]",
          ],
        },
        {
          title: "Vos droits",
          paragraphs: [
            "Vous disposez des droits d'accès, de rectification, d'effacement, d'opposition et de portabilité sur vos données (art. 15 à 22 RGPD). Chaque email de prospection contient un lien de désinscription. Pour exercer vos droits : [À COMPLÉTER : email]. Vous pouvez saisir la CNIL (cnil.fr) en cas de litige.",
          ],
        },
      ]}
    />
  );
}
