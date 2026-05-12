# Task v4-023 : UI sourcing LI sur page campagne — sélecteur canal + params
**Status**: ⬜ À faire

## Autonomie
🤖 **Claude 100%** — composant UI React.

## Context
Thomas doit pouvoir choisir depuis le dashboard quel canal LI utiliser pour sourcer les leads d'une campagne (search ICP, post engagers, etc.) et configurer les paramètres associés, avant de déclencher WF9.

**Références** : PRD-v4 F7 · ARCHI-v4 §Frontend

## Objective
Section "Sourcing LinkedIn" sur la page campagne avec sélecteur canal + formulaire params + bouton déclencher.

## Requirements

### Must Have
- [ ] Section ajoutée sur page campagne (`/dashboard/campaigns/[id]`) ou settings
- [ ] Select canal : "Recherche ICP" / "Engagements post" / "Visiteurs profil" / "Post externe"
- [ ] Formulaire dynamique selon canal :
  - Recherche ICP : champs titre, secteur, taille entreprise, localisation (pré-remplis depuis Config.icp_md)
  - Engagements post / Post externe : input URL du post
  - Visiteurs profil : aucun param (auto depuis compte connecté)
- [ ] Bouton "Sourcer" → POST `/api/linkedin/source` → toast "Sourcing lancé (WF9)"
- [ ] Compteur leads LI sourcés visible sur la page

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
- [ ] Sélecteur canal visible et fonctionnel
- [ ] Champs dynamiques changent selon canal choisi
- [ ] Clic "Sourcer" → WF9 déclenché → toast "Sourcing lancé"
- [ ] Bouton désactivé si status LI != connected

## Dependencies
**Blocked By**: v4-022 (WF9), v4-021 (statut compte LI)

## Complexity & Estimates
Medium · 3h · Risk: Low
