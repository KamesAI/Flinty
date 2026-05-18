# Task v4-023 : UI sourcing LI sur page campagne — sélecteur canal + params
**Status**: 🚧 Partiel — 2026-05-18

## Autonomie
🤖 **Claude 100%** — composant UI React.

## Context
Thomas doit pouvoir choisir depuis le dashboard quel canal LI utiliser pour sourcer les leads d'une campagne (search ICP, post engagers, etc.) et configurer les paramètres associés, avant de déclencher WF9.

**Références** : PRD-v4 F7 · ARCHI-v4 §Frontend

## Objective
Section "Sourcing LinkedIn" sur la page campagne avec sélecteur canal + formulaire params + bouton déclencher.

## Requirements

### Must Have
- [x] Section ajoutée sur page campagne (`/dashboard/campaigns/[id]`) ou settings
- [x] Select canal : "Recherche ICP" / "Engagements post" / "Visiteurs profil" / "Post externe"
- [x] Formulaire dynamique selon canal :
  - Recherche ICP : champs titre, secteur, taille entreprise, localisation (pré-remplis depuis Config.icp_md)
  - Engagements post / Post externe : input URL du post
  - Visiteurs profil : aucun param (auto depuis compte connecté)
- [x] Bouton "Sourcer" → POST `/api/linkedin/source` → toast "Sourcing lancé (WF9)"
- [x] Compteur leads LI sourcés visible sur la page

### Must NOT
- Pas de résultats immédiats dans l'UI (WF9 est async) — uniquement feedback "lancé"
- Désactiver le bouton si compte LI non connecté (afficher lien vers `/dashboard/settings/linkedin/connect`)

## Technical Approach

```tsx
// components/LinkedInSourcingPanel.tsx
const CHANNELS = [
  { value: 'linkedin_search', label: 'Recherche ICP' },
  { value: 'post_engagers', label: 'Engagements post' },
  { value: 'profile_visitors', label: 'Visiteurs profil' },
  { value: 'external_post', label: 'Post externe' },
]

// Route POST /api/linkedin/source
// body: {campaign_id, channel, params}
// → call N8N_WF9_WEBHOOK → 200 → toast
```

## Acceptance Criteria
- [x] Sélecteur canal visible et fonctionnel
- [x] Champs dynamiques changent selon canal choisi
- [x] Clic "Sourcer" → WF9 déclenché → toast "Sourcing lancé"
- [x] Bouton désactivé si status LI != connected

## Avancement

### 2026-05-18 — UI campagne + route WF9 livrées, WF9 réel en attente
- Ajout `components/linkedin/LinkedInSourcingPanel.tsx` dans la fiche campagne.
- Sélecteur 4 canaux + formulaires dynamiques : recherche ICP, engagements post, visiteurs profil, post externe.
- Bouton désactivé si `/api/unipile/status` ne retourne pas `connected`, avec lien vers settings LinkedIn.
- Ajout `POST /api/linkedin/source` : vérifie compte LI, valide payload, appelle `N8N_WF9_WEBHOOK` avec `max_results=100`.
- Compteur leads LinkedIn basé sur les colonnes `linkedin_url` / `source_channel` des leads qualifiés.

**Reste avant ✅** :
- Créer/activer WF9 (`v4-022`) et configurer `N8N_WF9_WEBHOOK`, puis smoke staging réel.

## Dependencies
**Blocked By**: v4-022 (WF9), v4-021 (statut compte LI)

## Complexity & Estimates
Medium · 3h · Risk: Low
