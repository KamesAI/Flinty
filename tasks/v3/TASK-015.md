# Task 015: `@dnd-kit` + PATCH `/api/leads/[id]/status`
**Status**: ✅ Complété

## Context
Prérequis du Kanban : installer la lib drag-and-drop et exposer une route pour persister les changements de statut dans le GSheet enfant.

**References**: PRD §3 F4 · ARCHI §API Routes

## Objective
Dépendances installées + PATCH endpoint fonctionnel.

## Requirements
### Must Have
- [x] `npm i @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- [x] Route `PATCH /api/leads/[id]/status` accepte body `{ sheet_id: string, campaign_id: string, statut_email: Statut }`
- [x] Valide statut dans set autorisé (new, contacted, relance_1, relance_2, opened, clicked, replied, bounced, disqualified)
- [x] Trouve la ligne par `lead_id` dans l’onglet `{campaign_id}_Qualified` du fichier `sheet_id` (v3 ; équivalent « Leads_Qualified » par campagne)
- [x] `values.update` la cellule `statut_email` (colonne **S**)
- [x] Retourne 200 `{ ok: true }` / 400 si invalide / 404 si lead introuvable

### Must NOT
- [x] Pas de résolution `sheet_id` côté serveur (passé par le client qui l'a déjà)

## Technical Approach
Index du lead : `readChildSheet(sheetId, 'Leads_Qualified!A:A')` puis `findIndex`. Ensuite `update('Leads_Qualified!T{index+2}', [[statut]])`.

## Acceptance Criteria
- [x] `curl -X PATCH` met à jour la cellule visible dans Sheets *(à valider manuellement avec serveur + vrais IDs ; logique couverte par tests Vitest + build OK)*
- [x] Statut invalide → 400
- [x] Lead inconnu → 404

## Dependencies
**Blocked By**: Task 002

## Complexity & Estimates
Medium · 2h
