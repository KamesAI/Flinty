# Task 003: WF1 refonte — création GSheet enfant + écriture Index
**Status**: ✅ Complété (2026-04-17)

## Context
WF1 v1 écrivait dans un GSheet unique. V3 crée un GSheet isolé par campagne via Sheets API, initialise ses 4 onglets avec headers, écrit la Config, puis référence dans l'Index avant de poursuivre le scraping Maps.

**References**: ARCHI §Automatisation n8n · PRD §3 F1

## Objective
Un POST `/webhook/flinty-wf1-launch { icp_md, secteur, localisation, offre_kames, ... }` crée un GSheet enfant, écrit son `sheet_id` dans l'Index, et poursuit le scraping Maps.

## Ce qui a été fait

Le workflow `OnpGdsIZQShrN4P1` sur `staging-n8n.kamesai.com` a été simplifié.

### Changement d'architecture (2026-04-17)
La création du GSheet enfant a été déplacée vers la **Next.js API** (TASK-004) pour éviter les problèmes de credentials OAuth2 dans n8n (OAuth clients supprimés côté Google Cloud Console). WF1 reçoit `spreadsheet_id` déjà créé dans le payload.

### Chaîne de nodes (5 nodes)

```
Webhook (flinty-wf1-launch)
  → Code — Prépare       [lit campaign_id + spreadsheet_id + secteur + localisation depuis body]
  → Google Places API    [HTTP : textQuery secteur+localisation]
  → Parse Places         [Code : construit objets leads]
  → Append Leads Raw     [Google Sheets node : écrit dans le GSheet enfant via spreadsheet_id dynamique]
```

### Responsabilités TASK-004 (Next.js API `/api/campaigns` POST)
La Next.js API gère désormais :
1. Générer `campaign_id` + `sheet_name`
2. Créer le GSheet enfant via googleapis (Service Account en env vars)
3. Créer les 4 onglets + headers + Config (score_minimum=60)
4. Écrire dans Flinty Index
5. Appeler WF1 webhook avec `{ campaign_id, spreadsheet_id, secteur, localisation, ... }`

### Détails techniques
- **Credential WF1** : `googleApi` Service Account (`t4NIN9i8vCgkBUVk`) — uniquement pour Append Leads Raw
- **Webhook path** : `flinty-wf1-launch`
- **Append Leads Raw** : écrit dans le GSheet enfant via `spreadsheet_id` dynamique (`mode: "id"`)

## Acceptance Criteria
- [x] WF1 déployé sur staging avec 5 nodes (Webhook → Prépare → Places → Parse → Leads Raw)
- [x] TASK-004 crée les 4 onglets + Config + Index (2026-04-17, Option A : onglets dans GOOGLE_CAMPAIGNS_SHEET_ID)
- [x] Test end-to-end via POST `/api/campaigns` → 20 leads scrapés dans `cmp_6jo0e0jm_Raw` ✅

## Dependencies
**Blocked By**: Task 001 ✅

## Notes
- WF1 v1 n'existe plus séparément — le workflow `OnpGdsIZQShrN4P1` a été mis à jour en place (pas de doublon)
- Si besoin de rollback : les exécutions précédentes sont conservées dans n8n, et la v1 peut être reconstruite depuis le git (`WF1-v3-setup-test.json` sert de référence de la structure)
