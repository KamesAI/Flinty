# Task 001: Provisionner le GSheet maître "Flinty Index" + env vars
**Status**: ✅ Done

## Context
BLOC 0 démarre avec la création du registre central. Sans ce fichier + les variables d'environnement, aucun workflow v3 ne peut fonctionner.

**References**: PRD §3 F1 · ARCHI §Backend "Database"

## Objective
`GOOGLE_INDEX_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID` et `OPENROUTER_API_KEY` sont configurés localement + Vercel, et le GSheet "Flinty Index" existe avec ses 2 onglets prêts.

## Requirements
### Must Have
- [x] Créer (ou renommer) un GSheet "Flinty — Index" avec onglets `Campagnes` et `Contacts_Registry`
- [x] Headers exacts selon ARCHI §Backend
- [x] Créer dossier Drive dédié où WF1 déposera les enfants → récupérer `folder_id`
- [x] Ajouter `GOOGLE_INDEX_SHEET_ID`, `GOOGLE_DRIVE_FOLDER_ID`, `OPENROUTER_API_KEY` dans `.env.local`
- [x] Partager Index + dossier Drive avec le service account `lead-qualifier-service@...`

### Must NOT
- [x] Ne pas toucher au GSheet v1 actuel (rester opérationnel jusqu'à bascule)

## Technical Approach
### Colonnes `Campagnes`
```
campaign_id | nom | sheet_id | sheet_url | secteur | localisation | offre_kames |
statut | date_création | total_leads_raw | total_leads_qualified | emails_envoyés | taux_réponse
```
Statuts autorisés : `new | active | paused | done`.

### Colonnes `Contacts_Registry`
```
domain | last_contacted_at | campaign_id | statut
```

## Acceptance Criteria
- [x] `GOOGLE_INDEX_SHEET_ID=14Uf6GlvmlCxzaFxENExW-FkCV0CZNQ_7zwzik9SAelY` → accès vérifié via script node
- [x] `GOOGLE_DRIVE_FOLDER_ID=12Xdrs-xRfBOYrz3IxqGO8ZVDFNl7Uh9m` → extrait correctement depuis URL Drive
- [x] Service account lit/écrit sur Index (titre "Flinty - Index", onglets Campagnes + Contacts_Registry confirmés)

## Notes
- GSheet renommé depuis l'ancien "Kames-CRM" (même ID, pas de nouveau fichier créé) — OK pour v3
- `ANTHROPIC_API_KEY` remplacé par `OPENROUTER_API_KEY` dans toute la v3
- Env var corrigée : `GOOGLE_INDEX_SHEETS_ID` → `GOOGLE_INDEX_SHEET_ID` (faute de frappe initiale corrigée dans `.env.local`)
- Vercel (preview + prod) : à configurer manuellement depuis le dashboard Vercel

## Complexity & Estimates
- **Complexity**: Low
- **Est. Time**: 1.5h
