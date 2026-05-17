# Task v4-002 : Étendre schéma GSheets — tabs Conversations, Email_Health, Meetings + colonnes Leads_Qualified v4 + Config v4
**Status**: ✅ 2026-05-17

## Autonomie
🤖 **Claude 100%** — migration schema GSheets via googleapis SDK + script à exécuter.

## Context
v4 ajoute la bidirectionnalité (inbound replies) et le multi-canal. Le schéma GSheets existant doit être étendu sans casser les données v3. Les nouveaux onglets `Conversations`, `Meetings`, `Email_Health` sont nécessaires avant de pouvoir coder le Setter.

**Références** : ARCHI-v4 §Database v4

## Objective
GSheet maître Index et GSheets enfants étendus avec les nouveaux onglets et colonnes v4. Script de migration idempotent (ne casse pas les feuilles existantes).

## Requirements

### Must Have
**Index (maître)** :
- [x] Tab `Campagnes` : ajouter 4 colonnes → `setter_enabled`, `setter_validation`, `li_account_id`, `calendly_event_uri` — confirmé 2026-05-17
- [x] Tab `Email_Health` NEW : créé avec headers corrects — confirmé 2026-05-17
- [x] Tab `Accounts` NEW : créé avec headers corrects — confirmé 2026-05-17

**Enfant (1 par campagne existante)** :
- [x] Tab `Leads_Qualified` : headers v4 +5 colonnes (`linkedin_url | source_channel | statut_li | reply_intent | reply_at`) définis dans `CHILD_QUALIFIED_HEADER` (sheets.ts) et écrits lors de `createChildGSheet()` — 2026-05-17
- [x] Tab `Conversations` NEW : créé dans `createChildGSheet()` avec header correct — 2026-05-17
- [x] Tab `Meetings` : `ensureMeetingsSheet()` opérationnel dans l'Index — 2026-05-14
- [x] Tab `Config` (campagnes existantes) : clés v4 migrées via script — confirmé 2026-05-17

### Must NOT
- Ne pas supprimer de colonnes ou tabs existants
- Ne pas modifier l'ordre des colonnes v3 existantes (append uniquement)
- Script idempotent : relancer = no-op si déjà fait

## Technical Approach

Script `scripts/migrate-sheets-v4.ts` :
```typescript
// Pour l'Index :
// 1. Lire headers tab Campagnes → append colonnes manquantes uniquement
// 2. Créer tab Email_Health si n'existe pas → insérer row header
// 3. Créer tab Accounts si n'existe pas → insérer row header

// Pour chaque enfant (lire liste depuis Index tab Campagnes, colonne sheet_id) :
// 1. Lire headers Leads_Qualified → append colonnes manquantes
// 2. Créer tab Conversations si n'existe pas → insérer row header
// 3. Créer tab Meetings si n'existe pas → insérer row header
// 4. Lire Config tab → append lignes manquantes avec valeurs par défaut
//    setter_enabled=FALSE, setter_validation=TRUE, setter_tone=formal, setter_signature=Thomas, calendly_event_uri='', li_caps_daily=20
```

Exécuter : `npx ts-node scripts/migrate-sheets-v4.ts`

## Acceptance Criteria
- [x] Index : tab `Email_Health` existe avec headers corrects — 2026-05-17
- [x] Index : tab `Accounts` existe avec headers corrects — 2026-05-17
- [x] Index : tab `Campagnes` contient les 4 nouvelles colonnes — 2026-05-17
- [x] Nouvelle campagne : tab `Conversations` créé avec header correct — 2026-05-17
- [x] Nouvelle campagne : `Leads_Qualified` contient 32 colonnes (27 v3 + 5 v4) — 2026-05-17
- [x] Nouvelle campagne : `Config` contient les nouvelles clés v4 avec valeurs par défaut — 2026-05-17
- [x] Campagnes existantes : migration script idempotent exécuté — confirmé 2026-05-17 (5 enfants, tous ✓ no-op au 2e run)

## Avancement 2026-05-17
- **Architecture corrigée** : `createChildGSheet()` crée désormais 1 fichier GSheet dédié par campagne (via `sheets.spreadsheets.create()`) au lieu d'ajouter des onglets dans un fichier partagé. Fichier déplacé dans `GOOGLE_DRIVE_FOLDER_ID` via Drive API (`drive.file` scope ajouté).
- **Onglets enfant** : `Leads_Raw`, `Leads_Qualified` (32 cols), `Leads_Rejected`, `Config` (v3+v4), `Conversations` — créés dans le nouveau fichier.
- **`updateConfigValue()`** : try `Config` d'abord (v4), fallback `{campaign_id}_Config` (v3 legacy) pour rétrocompatibilité.
- **Tests** : `lib/sheets.test.ts` créé (328 tests verts).
- **Reste** : script migration campagnes existantes + Index tabs Email_Health / Accounts / +4 colonnes Campagnes.

## Dependencies
**Blocked By**: v4-001 (pour `CALENDLY_EVENT_TYPE_URI` valeur par défaut dans Config)

## Complexity & Estimates
Medium · 2h · Risk: Medium (opération sur données prod — tester sur copie d'abord)
