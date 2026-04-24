# Task 006: WF6 refonte — loop Index + update stats maître
**Status**: ✅ Complété

## Context
Sans WF6, les colonnes de stats du maître (J→M) restent vides. Le dashboard n'affichera rien d'agrégé.

**References**: ARCHI §Data flow v3 · PRD §3 F1

## Objective
WF6 (schedule horaire) parcourt l'Index, calcule et écrit les 4 compteurs pour chaque campagne active.

## Requirements
### Must Have
- [ ] Schedule trigger toutes les heures
- [ ] Node Sheets : lit l'Index → itère chaque ligne
- [ ] Pour chaque `sheet_id` : compte `Leads_Raw`, `Leads_Qualified`, emails envoyés (statut ≠ new), taux_réponse = replied / envoyés
- [ ] Update `Campagnes` colonnes J-M via `values.batchUpdate`
- [ ] Skip les campagnes avec statut `done` ou `paused`

### Must NOT
- [ ] Ne pas toucher aux autres colonnes de l'Index
- [ ] Pas de suppression de lignes

## Technical Approach
Dupliquer WF6 v1 → remplacer la source (GSheet unique) par une boucle sur l'Index. Utiliser `SplitInBatches` pour éviter les timeouts.

## Acceptance Criteria
- [ ] Après un run, les colonnes `total_leads_raw`, `total_leads_qualified`, `emails_envoyés`, `taux_réponse` reflètent les enfants
- [ ] Run <30s pour 10 campagnes
- [ ] Campaigne `paused` non modifiée

## Dependencies
**Blocked By**: Task 003

## Complexity & Estimates
Medium · 2h
