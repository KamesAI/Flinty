---
name: flinty-product-marketing-context
description: "Contexte marketing Kames / Flinty avant toute tâche copy, ICP, cold email, SEO site, ou CRO. À lire en premier : isole la campagne, respecte l’ICP GSheet et les règles projet, puis seulement les skills vendor Corey Haines (marketingskills). Déclencher quand l’utilisateur parle de prospection, hooks, séquence email, ICP, positionnement, ou marketing hors code dashboard."
---

# Flinty — contexte produit & marketing (hub)

Ce skill **prime** sur les skills anglophones du dépôt [marketingskills](https://github.com/coreyhaines31/marketingskills) : il fixe le cadre **données**, **juridique** et **ton** avant d’appliquer leurs frameworks.

## 1. Lire d’abord (ordre)

1. **Campagne / produit**  
   - Onglet **`Config`** du GSheet enfant (notamment `icp_md`, `score_minimum` si la tâche touche au scoring ou à la qualification).  
   - [00-Discovery/PRD.md](../../00-Discovery/PRD.md) pour les champs v3 et le flux campagne.

2. **Prospection & messages (Kames)**  
   - [skills/sales-message-generator/SKILL.md](../sales-message-generator/SKILL.md) : tokens, longueurs J0/J+3/J+7, `ICP.md` et `email-templates-library.md` côté client quand ces chemins existent.

3. **Cadre marketing générique (vendor)**  
   - `external/marketingskills/skills/product-marketing-context/SKILL.md` — *seulement comme inspiration pour structurer le contexte* ; le document de sortie upstream (`.agents/product-marketing-context.md`) est **optionnel** pour Flinty : la source de vérité **par campagne** reste le GSheet + l’Index.

## 2. Règles non négociables (surcharge Flinty)

- **Français** pour le contenu utilisateur / prospection cible FR, sauf demande explicite autre langue.  
- **RGPD** : pas de fuite de données entre campagnes ; pas d’entremêlement de leads hors **Contacts_Registry** (BLOC 4).  
- **Isolation** : 1 GSheet enfant par campagne ; ne jamais mélanger des colonnes « leads » de deux campagnes dans un même export ou prompt.  
- **Tokens** sortie message : respecter la liste stricte de [sales-message-generator](../sales-message-generator/SKILL.md) (`{{prenom}}`, `{{entreprise}}`, etc.).  
- **Dashboard / code** : [`.claude/rules/flinty-core.md`](../../.claude/rules/flinty-core.md) et [`.claude/rules/flinty-dashboard.md`](../../.claude/rules/flinty-dashboard.md) — pas de shadcn, TDD sur le code Next.js.

## 3. Quand utiliser ce hub

- Rédaction ou itération **hooks**, **objets**, **séquences** alignés ICP.  
- Aide à la **recherche client** ou **profil concurrent** *dans le contexte d’une campagne Flinty*.  
- Tâches **SEO / CRO / pub** pour le **site Kames** (utiliser en plus les skills Tier B du vendor, voir index).  
- Toute question « **positionnement** / **ICP** » : commencer ici, puis `product-marketing-context` vendor si besoin de remplir un template long.

## 4. Skills marketingskills — par priorité (après ce hub)

**Index complet** : [skills/vendor/marketingskills-INDEX.md](../vendor/marketingskills-INDEX.md)

| Besoin | Skill vendor (dossier sous `external/marketingskills/skills/`) |
|--------|------------------------------------------------------------------|
| Cold email, angles, relances | `cold-email` |
| Séquences automatisées, drips | `email-sequence` |
| ICP, interviews, synthèse recherche | `customer-research` |
| Profiling concurrents (URL) | `competitor-profiling` |
| Pipeline, lifecycle, handoff | `revops` |
| One-pagers, objections, collatéraux | `sales-enablement` |
| Copy page / brouillon | `copywriting` |
| Relecture / polish | `copy-editing` |
| Accroches, biais, clarté | `marketing-psychology` |
| Site / SEO / CRO / mesure | Voir colonne **Tier B** dans l’INDEX |

**Ne pas** charger l’ensemble du dépôt vendor : ouvrir **un** skill à la fois selon la tâche.

## 5. Blocs pour prompts runtime (n8n / OpenRouter)

Pour aligner les **champs** qualification (WF2, `generate-icp`) sans relire tout le vendor : [01-Architecture/marketingskills-prompt-blocks.md](../../01-Architecture/marketingskills-prompt-blocks.md).

## 6. Mise à jour du vendor

```bash
git submodule update --init --recursive
# puis voir skills/vendor/README.md
```
