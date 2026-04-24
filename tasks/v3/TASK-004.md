# Task 004: API `/api/campaigns` GET/POST sur Index
**Status**: ✅ Complété

## Context
La liste du dashboard et la création de campagne doivent passer par l'Index maître, pas par un GSheet unique.
Suite au changement d'architecture de TASK-003 (OAuth2 n8n cassé), la création du GSheet enfant a été déplacée ici.

**References**: ARCHI §API Routes · PRD §3 F1

## Objective
`GET /api/campaigns` renvoie la liste Index ; `POST /api/campaigns` crée le GSheet enfant, écrit dans l'Index, puis déclenche WF1.

## Ce qui a été fait (2026-04-17)

### Architecture finale (v3)
`POST /api/campaigns` orchestre la création complète d'une campagne :
1. Génère `campaign_id` (`cmp_` + 8 chars aléatoires) + `sheet_name`
2. Appelle `createChildGSheet()` → GSheet enfant via googleapis (Service Account)
   - 4 onglets : `Leads_Raw`, `Leads_Qualified`, `Leads_Rejected`, `Config`
   - Headers v3 sur chaque onglet
   - Lignes Config (icp_md, secteur, villes, taille_equipe, poste_cible, offre_kames, template_email, score_minimum=60)
3. Écrit dans l'Index maître via `appendIndex()` (13 colonnes v3)
4. Déclenche WF1 webhook (fire-and-forget) avec `{ campaign_id, spreadsheet_id, secteur, localisation, ... }`
5. Retourne 202 immédiatement avec `{ campaign_id, spreadsheet_id, sheet_url }`

### Fichiers modifiés
- `lib/sheets.ts` — Ajout de `createChildGSheet(sheetName, config)` + `ChildSheetConfig` type
- `app/api/campaigns/route.ts` — Réécriture complète (remplace l'ancienne version v1 mono-sheet)
- `app/api/campaigns/route.test.ts` — Nouveau fichier, 9 tests Vitest (TDD)

### Résultats tests
`npm run test -- campaigns/route` → 9/9 ✅

## Acceptance Criteria
- [x] `GET /api/campaigns` utilise `listCampaigns()` → JSON `Campaign[]`
- [x] `POST /api/campaigns` crée le GSheet enfant via googleapis + 4 onglets + Config
- [x] `POST /api/campaigns` écrit dans l'Index maître via `appendIndex()`
- [x] `POST /api/campaigns` déclenche WF1 webhook (fire-and-forget)
- [x] `POST /api/campaigns` répond 202 immédiatement
- [x] Erreurs 500 avec message si createChildGSheet ou appendIndex échoue
- [x] 9 tests Vitest verts

## Dependencies
**Blocked By**: Tasks 002 ✅, 003 🔄

## Complexity & Estimates
Low-Medium · 2h
