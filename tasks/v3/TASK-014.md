# Task 014: WF1 — écriture `icp_md` dans Config enfant
**Status**: ✅ Complété

## Context
Compléter WF1 pour qu'il propage `icp_md` reçu dans le payload vers l'onglet Config du GSheet enfant (utilisé par WF2).

**References**: PRD §3 F3 · ARCHI §Data flow

## Objective
`Config!A:B` contient une ligne `icp_md | <contenu Markdown>` après exécution WF1.

## Requirements
### Must Have
- [ ] Après création des 4 onglets, un node Sheets append dans `Config` la ligne `('icp_md', $json.body.icp_md, 'ICP généré par Claude')`
- [ ] Gérer les retours à la ligne dans la cellule (Sheets accepte mais échappement à tester)
- [ ] Si `icp_md` manquant dans payload → écrire chaîne vide + log warning

### Must NOT
- [ ] Pas stocker `icp_md` dans l'Index maître (trop volumineux)

## Technical Approach
Dans le node Google Sheets "Append", valeur colonne B = `={{ $json.body.icp_md }}` (n8n échappe automatiquement).

## Acceptance Criteria
- [ ] Après WF1, ouvrir l'enfant → Config contient `icp_md` avec le markdown complet
- [ ] WF2 peut le relire sans perte de formatage

## Dependencies
**Blocked By**: Tasks 003, 013

## Complexity & Estimates
Low · 1h
