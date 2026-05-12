# marketingskills (Corey Haines) — index Flinty / Kames

**Upstream** : [github.com/coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT)  
**Copie locale** : [external/marketingskills](../../external/marketingskills) (sous-module Git), si initialisé.

Toujours lire d’abord le hub projet : [skills/flinty-product-marketing-context/SKILL.md](../flinty-product-marketing-context/SKILL.md).

## Légende des tiers

| Tier | Signification |
|------|----------------|
| **A** | Cœur outbound, qualification, copy email, revops — priorité agents Flinty + prospection Kames |
| **B** | Croissance, site, SEO, CRO, pub, contenu — surtout marketing Kames (site, acquisition) |
| **C** | Périmètre latéral — n’activer que si besoin explicite (app store, paywall in-app, etc.) |

## Table des skills

| Skill (dossier) | Tier | Utilité Flinty / Kames |
|-----------------|------|-------------------------|
| `product-marketing-context` | A | Socle contexte produit (amont de tous les skills upstream) — lire via le hub Flinty |
| `cold-email` | A | Cadres B2B cold outreach, relances |
| `email-sequence` | A | Drip, séquences automatisées (complément [sales-message-generator](../sales-message-generator/SKILL.md)) |
| `customer-research` | A | ICP, interviews, synthèse recherche client |
| `competitor-profiling` | A | Profil concurrents pour scoring / hooks |
| `competitor-alternatives` | B | Pages comparaison SEO / sales enablement |
| `revops` | A | Cycle de vie lead, handoff marketing → sales |
| `sales-enablement` | A | Collatéraux, objections, one-pagers |
| `copywriting` | A | Copy pages et messages (cadres généraux) |
| `copy-editing` | A | Révision et amélioration de copy existante |
| `marketing-psychology` | A | Principes comportementaux pour hooks / angles |
| `marketing-ideas` | B | Inspiration tactiques SaaS |
| `ab-test-setup` | B | Expérimentation (objets, hooks, landing) |
| `analytics-tracking` | B | Mesure, événements, GA4 |
| `seo-audit` | B | Audit SEO site Kames |
| `ai-seo` | B | Visibilité dans les réponses IA |
| `schema-markup` | B | Données structurées |
| `programmatic-seo` | B | Pages SEO à l’échelle |
| `site-architecture` | B | Structure site, navigation |
| `page-cro` | B | Conversion pages marketing |
| `signup-flow-cro` | B | Parcours inscription |
| `onboarding-cro` | B | Activation post-signup |
| `form-cro` | B | Formulaires hors signup |
| `popup-cro` | B | Popups / modales |
| `paywall-upgrade-cro` | C | Paywalls in-app — hors scope Flinty par défaut |
| `paid-ads` | B | Campagnes payantes |
| `ad-creative` | B | Création publicitaire |
| `social-content` | B | Réseaux sociaux |
| `content-strategy` | B | Stratégie éditoriale |
| `launch-strategy` | B | Lancement produit / feature |
| `pricing-strategy` | B | Pricing, packaging |
| `lead-magnets` | B | Aimants à leads |
| `free-tool-strategy` | B | Outils gratuits marketing |
| `referral-program` | B | Parrainage / affiliation |
| `churn-prevention` | B | Rétention, offres de sauvegarde |
| `community-marketing` | B | Communautés |
| `directory-submissions` | B | Annuaires produits |
| `image` | B | Images marketing |
| `video` | B | Vidéo marketing |
| `aso-audit` | C | App Store / Play — si app mobile |

Installation recommandée pour les agents : **Tier A** en priorité ; Tier B selon la tâche (site Kames, mesure, SEO) ; Tier C à la demande.

## Mise à jour du vendor

```bash
git submodule update --init --recursive
cd external/marketingskills && git fetch origin && git checkout main && git pull
cd ../.. && git add external/marketingskills && git commit -m "chore: bump marketingskills submodule"
```

Révision suggérée : **trimestrielle**, ou après une release majeure upstream (README / changelog).
